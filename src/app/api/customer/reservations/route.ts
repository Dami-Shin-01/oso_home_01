import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  withErrorHandling
} from '@/lib/api-response';

// 고객 예약 생성 (인증된 사용자만)
async function createCustomerReservationHandler(request: NextRequest) {
  const body = await request.json();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  // 고객 정보 확인
  const { data: customerData, error: customerError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .eq('role', 'CUSTOMER')
    .single();

  if (customerError || !customerData) {
    throw ApiErrors.Forbidden('고객 권한이 필요합니다.');
  }

  // 입력값 검증
  validateRequiredFields(body, [
    'facility_id',
    'site_id',
    'reservation_date',
    'time_slots',
    'total_amount'
  ]);

  const {
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
      '유효한 시간대를 선택해주세요.',
      'INVALID_TIME_SLOTS'
    );
  }

  // 예약 가능 여부 확인
  const { data: conflictingReservations, error: conflictError } = await supabaseAdmin
    .from('reservations')
    .select('id')
    .eq('facility_id', facility_id)
    .eq('site_id', site_id)
    .eq('reservation_date', reservation_date)
    .overlaps('time_slots', time_slots)
    .in('status', ['PENDING', 'CONFIRMED']);

  if (conflictError) {
    throw ApiErrors.InternalServerError(
      '예약 가능 여부를 확인할 수 없습니다.',
      'AVAILABILITY_CHECK_ERROR'
    );
  }

  if (conflictingReservations && conflictingReservations.length > 0) {
    throw ApiErrors.Conflict(
      '선택한 시간대에 이미 예약이 있습니다.',
      'TIME_SLOT_CONFLICT'
    );
  }

  // 예약 생성
  const { data: reservation, error: insertError } = await supabaseAdmin
    .from('reservations')
    .insert({
      user_id: user.id,
      facility_id,
      site_id,
      reservation_date,
      time_slots,
      total_amount,
      special_requests,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      facilities (
        name,
        type
      ),
      sites (
        name,
        type
      )
    `)
    .single();

  if (insertError) {
    console.error('Reservation creation error:', insertError);
    throw ApiErrors.InternalServerError(
      '예약 생성에 실패했습니다.',
      'RESERVATION_CREATE_ERROR'
    );
  }

  // 결제 정보 생성
  const { error: paymentError } = await supabaseAdmin
    .from('reservation_payments')
    .insert({
      reservation_id: reservation.id,
      payment_method: 'BANK_TRANSFER',
      amount: total_amount,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });

  if (paymentError) {
    console.error('Payment record creation error:', paymentError);
    // 예약은 생성되었지만 결제 정보 생성 실패
    // 이 경우 경고 로그만 남기고 예약은 성공으로 처리
  }

  return createSuccessResponse({
    reservation: {
      ...reservation,
      payment_info: {
        method: 'BANK_TRANSFER',
        amount: total_amount,
        status: 'PENDING',
        bank_account: process.env.BANK_ACCOUNT_INFO || '계좌 정보를 확인해주세요.'
      }
    }
  }, '예약이 성공적으로 생성되었습니다. 입금 안내를 확인해주세요.');
}

// 고객 예약 목록 조회
async function getCustomerReservationsHandler(request: NextRequest) {
  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabaseAdmin
    .from('reservations')
    .select(`
      *,
      facilities (
        name,
        type
      ),
      sites (
        name,
        type
      ),
      reservation_payments (
        payment_method,
        amount,
        status as payment_status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
    query = query.eq('status', status as 'PENDING' | 'CONFIRMED' | 'CANCELLED');
  }

  const { data: reservations, error: fetchError } = await query;

  if (fetchError) {
    console.error('Customer reservations fetch error:', fetchError);
    throw ApiErrors.InternalServerError(
      '예약 내역을 조회할 수 없습니다.',
      'RESERVATIONS_FETCH_ERROR'
    );
  }

  return createSuccessResponse({
    reservations: reservations || [],
    pagination: {
      limit,
      offset,
      total: reservations?.length || 0
    }
  });
}

export const POST = withErrorHandling(createCustomerReservationHandler);
export const GET = withErrorHandling(getCustomerReservationsHandler);