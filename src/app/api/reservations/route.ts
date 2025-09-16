import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  validateEmail,
  withErrorHandling
} from '@/lib/api-response';

async function createReservationHandler(request: NextRequest) {
  const body = await request.json();

  // 입력값 검증
  validateRequiredFields(body, [
    'facility_id',
    'site_id',
    'reservation_date',
    'time_slots',
    'total_amount'
  ]);

  // 회원 또는 비회원 정보 검증
  if (!body.user_id && (!body.guest_name || !body.guest_phone)) {
    throw ApiErrors.BadRequest(
      '회원 ID 또는 비회원 정보(이름, 연락처)가 필요합니다.',
      'MISSING_USER_INFO'
    );
  }

  if (body.guest_email) {
    validateEmail(body.guest_email);
  }

  const {
    user_id,
    guest_name,
    guest_phone,
    guest_email,
    facility_id,
    site_id,
    reservation_date,
    time_slots,
    total_amount,
    special_requests
  } = body;

  // 시간대 배열 검증
  if (!Array.isArray(time_slots) || time_slots.length === 0) {
    throw ApiErrors.BadRequest(
      '시간대는 배열 형태로 입력해야 합니다.',
      'INVALID_TIME_SLOTS'
    );
  }

  // 시설과 사이트 존재 여부 확인
  const { data: facility } = await supabaseAdmin
    .from('facilities')
    .select('id, name, is_active')
    .eq('id', facility_id)
    .single();

  if (!facility || !facility.is_active) {
    throw ApiErrors.NotFound(
      '시설을 찾을 수 없거나 운영중이지 않습니다.',
      'FACILITY_NOT_FOUND'
    );
  }

  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('id, name, is_active, facility_id')
    .eq('id', site_id)
    .eq('facility_id', facility_id)
    .single();

  if (!site || !site.is_active) {
    throw ApiErrors.NotFound(
      '사이트를 찾을 수 없거나 운영중이지 않습니다.',
      'SITE_NOT_FOUND'
    );
  }

  // 예약 데이터 준비
  const reservationData: Database['public']['Tables']['reservations']['Insert'] = {
    user_id: user_id || null,
    guest_name: guest_name || null,
    guest_phone: guest_phone || null,
    guest_email: guest_email || null,
    facility_id,
    site_id,
    reservation_date,
    time_slots,
    total_amount,
    special_requests: special_requests || null,
    status: 'PENDING',
    payment_status: 'WAITING'
  };

  // 예약 생성 (트리거에서 중복 체크)
  const { data: reservation, error: insertError } = await supabaseAdmin
    .from('reservations')
    .insert([reservationData])
    .select('id, reservation_date, time_slots, total_amount, status, payment_status, created_at')
    .single();

  if (insertError) {
    if (insertError.message?.includes('중복 예약')) {
      throw ApiErrors.Conflict(
        '선택한 시간대에 이미 예약이 있습니다. 다른 시간대를 선택해주세요.',
        'RESERVATION_CONFLICT'
      );
    }

    console.error('Reservation insert error:', insertError);
    throw ApiErrors.InternalServerError(
      '예약 생성에 실패했습니다.',
      'RESERVATION_CREATE_ERROR'
    );
  }

  return createSuccessResponse({
    reservation_id: reservation.id,
    facility_name: facility.name,
    site_name: site.name,
    reservation_date: reservation.reservation_date,
    time_slots: reservation.time_slots,
    total_amount: reservation.total_amount,
    status: reservation.status,
    payment_status: reservation.payment_status,
    created_at: reservation.created_at
  }, '예약이 성공적으로 생성되었습니다.');
}

// 예약 수정 핸들러
async function updateReservationHandler(request: NextRequest) {
  const body = await request.json();

  validateRequiredFields(body, ['reservation_id']);

  const {
    reservation_id,
    user_id,
    guest_phone,
    facility_id,
    site_id,
    reservation_date,
    time_slots,
    total_amount,
    special_requests
  } = body;

  // 기존 예약 조회 및 권한 확인
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

  // 권한 확인 (회원은 user_id, 비회원은 guest_phone으로)
  if (existingReservation.user_id) {
    if (existingReservation.user_id !== user_id) {
      throw ApiErrors.Forbidden(
        '본인의 예약만 수정할 수 있습니다.',
        'UNAUTHORIZED_ACCESS'
      );
    }
  } else {
    if (existingReservation.guest_phone !== guest_phone) {
      throw ApiErrors.Forbidden(
        '예약 시 등록한 연락처가 일치하지 않습니다.',
        'UNAUTHORIZED_ACCESS'
      );
    }
  }

  // 취소된 예약은 수정 불가
  if (existingReservation.status === 'CANCELLED') {
    throw ApiErrors.BadRequest(
      '취소된 예약은 수정할 수 없습니다.',
      'RESERVATION_CANCELLED'
    );
  }

  // 업데이트할 데이터 준비 (변경된 필드만)
  const updateData: Partial<Database['public']['Tables']['reservations']['Update']> = {};

  if (facility_id) updateData.facility_id = facility_id;
  if (site_id) updateData.site_id = site_id;
  if (reservation_date) updateData.reservation_date = reservation_date;
  if (time_slots) updateData.time_slots = time_slots;
  if (total_amount) updateData.total_amount = total_amount;
  if (special_requests !== undefined) updateData.special_requests = special_requests;

  // 변경사항이 있을 때만 업데이트
  if (Object.keys(updateData).length === 0) {
    throw ApiErrors.BadRequest(
      '변경할 내용이 없습니다.',
      'NO_CHANGES'
    );
  }

  // 예약 수정 (트리거에서 중복 체크)
  const { data: updatedReservation, error: updateError } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', reservation_id)
    .select(`
      id,
      reservation_date,
      time_slots,
      total_amount,
      status,
      payment_status,
      updated_at,
      facilities!inner(id, name),
      sites!inner(id, name, site_number)
    `)
    .single();

  if (updateError) {
    if (updateError.message?.includes('중복 예약')) {
      throw ApiErrors.Conflict(
        '변경하려는 시간대에 이미 예약이 있습니다.',
        'RESERVATION_CONFLICT'
      );
    }

    console.error('Reservation update error:', updateError);
    throw ApiErrors.InternalServerError(
      '예약 수정에 실패했습니다.',
      'RESERVATION_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    reservation_id: updatedReservation.id,
    facility_name: updatedReservation.facilities.name,
    site_name: updatedReservation.sites.name,
    reservation_date: updatedReservation.reservation_date,
    time_slots: updatedReservation.time_slots,
    total_amount: updatedReservation.total_amount,
    status: updatedReservation.status,
    payment_status: updatedReservation.payment_status,
    updated_at: updatedReservation.updated_at
  }, '예약이 성공적으로 수정되었습니다.');
}

// 예약 취소 핸들러
async function cancelReservationHandler(request: NextRequest) {
  const body = await request.json();

  validateRequiredFields(body, ['reservation_id']);

  const {
    reservation_id,
    user_id,
    guest_phone,
    cancellation_reason
  } = body;

  // 기존 예약 조회 및 권한 확인
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

  // 권한 확인
  if (existingReservation.user_id) {
    if (existingReservation.user_id !== user_id) {
      throw ApiErrors.Forbidden(
        '본인의 예약만 취소할 수 있습니다.',
        'UNAUTHORIZED_ACCESS'
      );
    }
  } else {
    if (existingReservation.guest_phone !== guest_phone) {
      throw ApiErrors.Forbidden(
        '예약 시 등록한 연락처가 일치하지 않습니다.',
        'UNAUTHORIZED_ACCESS'
      );
    }
  }

  // 이미 취소된 예약인지 확인
  if (existingReservation.status === 'CANCELLED') {
    throw ApiErrors.BadRequest(
      '이미 취소된 예약입니다.',
      'ALREADY_CANCELLED'
    );
  }

  // 예약 취소
  const { data: cancelledReservation, error: cancelError } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'CANCELLED',
      admin_memo: cancellation_reason ? `[취소사유] ${cancellation_reason}` : '[사용자 취소]'
    })
    .eq('id', reservation_id)
    .select(`
      id,
      reservation_date,
      time_slots,
      status,
      payment_status,
      updated_at,
      facilities!inner(id, name),
      sites!inner(id, name, site_number)
    `)
    .single();

  if (cancelError) {
    console.error('Reservation cancellation error:', cancelError);
    throw ApiErrors.InternalServerError(
      '예약 취소에 실패했습니다.',
      'RESERVATION_CANCEL_ERROR'
    );
  }

  return createSuccessResponse({
    reservation_id: cancelledReservation.id,
    facility_name: cancelledReservation.facilities.name,
    site_name: cancelledReservation.sites.name,
    reservation_date: cancelledReservation.reservation_date,
    time_slots: cancelledReservation.time_slots,
    status: cancelledReservation.status,
    payment_status: cancelledReservation.payment_status,
    updated_at: cancelledReservation.updated_at
  }, '예약이 성공적으로 취소되었습니다.');
}

export const POST = withErrorHandling(createReservationHandler);
export const PUT = withErrorHandling(updateReservationHandler);
export const DELETE = withErrorHandling(cancelReservationHandler);