import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireManagerAccess } from '@/lib/auth-helpers';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  withErrorHandling
} from '@/lib/api-response';

async function getReservationsHandler(request: NextRequest) {
  // 관리자 권한 확인
  await requireManagerAccess(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null;
  const facility_id = searchParams.get('facility_id');
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  if (page < 1 || limit < 1 || limit > 100) {
    throw ApiErrors.BadRequest('잘못된 페이지 또는 제한값입니다.');
  }

  // 상태 값 검증
  if (status && !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    throw ApiErrors.BadRequest('유효하지 않은 상태값입니다.');
  }

  const offset = (page - 1) * limit;

  // 쿼리 빌더 설정
  let query = supabaseAdmin
    .from('reservations')
    .select(`
      id,
      user_id,
      guest_name,
      guest_phone,
      guest_email,
      facility_id,
      site_id,
      reservation_date,
      time_slots,
      total_amount,
      status,
      payment_status,
      special_requests,
      admin_memo,
      created_at,
      updated_at,
      facilities (
        id,
        name,
        type
      ),
      sites (
        id,
        name,
        site_number,
        capacity
      ),
      users (
        id,
        name,
        email,
        phone
      )
    `);

  // 필터 적용
  if (status) {
    query = query.eq('status', status);
  }

  if (facility_id) {
    query = query.eq('facility_id', facility_id);
  }

  if (date_from) {
    query = query.gte('reservation_date', date_from);
  }

  if (date_to) {
    query = query.lte('reservation_date', date_to);
  }

  // 정렬 및 페이지네이션
  const { data: reservations, error: reservationsError } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (reservationsError) {
    console.error('Admin reservations fetch error:', reservationsError);
    throw ApiErrors.InternalServerError(
      '예약 목록을 가져올 수 없습니다.',
      'RESERVATIONS_FETCH_ERROR'
    );
  }

  // 전체 개수 조회 (같은 필터 조건 적용)
  let countQuery = supabaseAdmin
    .from('reservations')
    .select('*', { count: 'exact', head: true });

  if (status) countQuery = countQuery.eq('status', status);
  if (facility_id) countQuery = countQuery.eq('facility_id', facility_id);
  if (date_from) countQuery = countQuery.gte('reservation_date', date_from);
  if (date_to) countQuery = countQuery.lte('reservation_date', date_to);

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error('Admin reservations count error:', countError);
    throw ApiErrors.InternalServerError(
      '예약 수를 가져올 수 없습니다.',
      'RESERVATIONS_COUNT_ERROR'
    );
  }

  const totalPages = Math.ceil((count || 0) / limit);

  // 응답 데이터 구성
  const formattedReservations = reservations?.map(reservation => ({
    id: reservation.id,
    customer: {
      type: reservation.user_id ? 'member' : 'guest',
      name: reservation.user_id ? reservation.users?.name : reservation.guest_name,
      email: reservation.user_id ? reservation.users?.email : reservation.guest_email,
      phone: reservation.user_id ? reservation.users?.phone : reservation.guest_phone
    },
    facility: {
      id: reservation.facility_id,
      name: reservation.facilities?.name || 'Unknown',
      type: reservation.facilities?.type || 'Unknown'
    },
    site: {
      id: reservation.site_id,
      name: reservation.sites?.name || 'Unknown',
      site_number: reservation.sites?.site_number || 'Unknown',
      capacity: reservation.sites?.capacity || 0
    },
    reservation_details: {
      date: reservation.reservation_date,
      time_slots: reservation.time_slots,
      total_amount: reservation.total_amount,
      status: reservation.status,
      payment_status: reservation.payment_status,
      special_requests: reservation.special_requests,
      admin_memo: reservation.admin_memo
    },
    timestamps: {
      created_at: reservation.created_at,
      updated_at: reservation.updated_at
    }
  })) || [];

  return createSuccessResponse({
    reservations: formattedReservations,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: count || 0,
      limit: limit
    },
    filters_applied: {
      status,
      facility_id,
      date_from,
      date_to
    }
  }, '예약 목록 조회가 완료되었습니다.');
}

async function updateReservationStatusHandler(request: NextRequest) {
  // 관리자 권한 확인
  await requireManagerAccess(request);

  const body = await request.json();

  validateRequiredFields(body, ['reservation_id', 'status']);

  const {
    reservation_id,
    status,
    admin_memo,
    payment_status
  } = body;

  // 유효한 상태값인지 확인
  const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw ApiErrors.BadRequest(
      `유효하지 않은 상태값입니다. 가능한 값: ${validStatuses.join(', ')}`,
      'INVALID_STATUS'
    );
  }

  // 기존 예약 조회
  const { data: existingReservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', reservation_id)
    .single();

  if (fetchError || !existingReservation) {
    throw ApiErrors.NotFound(
      '예약을 찾을 수 없습니다.',
      'RESERVATION_NOT_FOUND'
    );
  }

  // 업데이트 데이터 준비
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (admin_memo !== undefined) {
    updateData.admin_memo = admin_memo;
  }

  if (payment_status) {
    const validPaymentStatuses = ['WAITING', 'COMPLETED', 'REFUNDED'];
    if (!validPaymentStatuses.includes(payment_status)) {
      throw ApiErrors.BadRequest(
        `유효하지 않은 결제 상태값입니다. 가능한 값: ${validPaymentStatuses.join(', ')}`,
        'INVALID_PAYMENT_STATUS'
      );
    }
    updateData.payment_status = payment_status;
  }

  // 예약 상태 업데이트
  const { data: updatedReservation, error: updateError } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', reservation_id)
    .select(`
      id,
      status,
      payment_status,
      admin_memo,
      updated_at,
      facilities!inner(id, name),
      sites!inner(id, name, site_number)
    `)
    .single();

  if (updateError) {
    console.error('Reservation status update error:', updateError);
    throw ApiErrors.InternalServerError(
      '예약 상태 변경에 실패했습니다.',
      'STATUS_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    reservation_id: updatedReservation.id,
    facility_name: updatedReservation.facilities.name,
    site_name: updatedReservation.sites.name,
    status: updatedReservation.status,
    payment_status: updatedReservation.payment_status,
    admin_memo: updatedReservation.admin_memo,
    updated_at: updatedReservation.updated_at
  }, '예약 상태가 성공적으로 변경되었습니다.');
}

export const GET = withErrorHandling(getReservationsHandler);
export const PUT = withErrorHandling(updateReservationStatusHandler);