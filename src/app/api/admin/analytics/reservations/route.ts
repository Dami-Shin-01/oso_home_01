import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function getReservationAnalyticsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status') as 'PENDING' | 'CONFIRMED' | 'CANCELLED' | null;
  const facility_id = searchParams.get('facility_id');

  if (limit < 1 || limit > 100) {
    throw ApiErrors.BadRequest('limit은 1-100 사이여야 합니다.');
  }

  // 상태 값 검증
  if (status && !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    throw ApiErrors.BadRequest('유효하지 않은 상태값입니다.');
  }

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
        site_number
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

  // 최신순 정렬 및 제한
  const { data: reservations, error: reservationsError } = await query
    .order('created_at', { ascending: false })
    .limit(limit);

  if (reservationsError) {
    console.error('Reservations analytics fetch error:', reservationsError);
    throw ApiErrors.InternalServerError(
      '예약 분석 데이터를 가져올 수 없습니다.',
      'RESERVATION_ANALYTICS_ERROR'
    );
  }

  // 응답 데이터 구성
  const analyticsData = reservations?.map(reservation => ({
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
      site_number: reservation.sites?.site_number || 'Unknown'
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
    reservations: analyticsData,
    meta: {
      total_returned: analyticsData.length,
      filters_applied: {
        status,
        facility_id,
        limit
      }
    }
  }, '예약 분석 데이터 조회가 완료되었습니다.');
}

export const GET = withErrorHandling(getReservationAnalyticsHandler);