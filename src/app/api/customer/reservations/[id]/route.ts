import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

interface Params {
  id: string;
}

// 특정 예약 조회
async function getReservationHandler(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      facilities (
        name,
        type,
        weekday_price,
        weekend_price,
        amenities
      ),
      sites (
        name,
        type,
        capacity
      ),
      reservation_payments (
        id,
        payment_method,
        amount,
        status as payment_status,
        bank_account,
        created_at as payment_created_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id) // 본인 예약만 조회 가능
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.NotFound('예약을 찾을 수 없습니다.');
    }
    console.error('Reservation fetch error:', fetchError);
    throw ApiErrors.InternalServerError(
      '예약 조회에 실패했습니다.',
      'RESERVATION_FETCH_ERROR'
    );
  }

  return createSuccessResponse({ reservation });
}

// 예약 수정 (제한적)
async function updateReservationHandler(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const body = await request.json();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  // 기존 예약 확인
  const { data: existingReservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.NotFound('예약을 찾을 수 없습니다.');
    }
    throw ApiErrors.InternalServerError('예약 조회에 실패했습니다.');
  }

  // 확정된 예약은 수정 불가
  if (existingReservation.status === 'CONFIRMED') {
    throw ApiErrors.BadRequest(
      '확정된 예약은 수정할 수 없습니다. 취소 후 새로 예약해주세요.',
      'CONFIRMED_RESERVATION_CANNOT_MODIFY'
    );
  }

  // 예약일이 지난 경우 수정 불가
  const reservationDate = new Date(existingReservation.reservation_date);
  const today = new Date();
  if (reservationDate <= today) {
    throw ApiErrors.BadRequest(
      '예약일이 지난 예약은 수정할 수 없습니다.',
      'PAST_RESERVATION_CANNOT_MODIFY'
    );
  }

  // 수정 가능한 필드만 허용
  const allowedFields = ['special_requests'];
  const updateData: any = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data: updatedReservation, error: updateError } = await supabaseAdmin
    .from('reservations')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Reservation update error:', updateError);
    throw ApiErrors.InternalServerError(
      '예약 수정에 실패했습니다.',
      'RESERVATION_UPDATE_ERROR'
    );
  }

  return createSuccessResponse({
    reservation: updatedReservation
  }, '예약이 수정되었습니다.');
}

// 예약 취소
async function cancelReservationHandler(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  // 기존 예약 확인
  const { data: existingReservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.NotFound('예약을 찾을 수 없습니다.');
    }
    throw ApiErrors.InternalServerError('예약 조회에 실패했습니다.');
  }

  // 이미 취소된 예약
  if (existingReservation.status === 'CANCELLED') {
    throw ApiErrors.BadRequest(
      '이미 취소된 예약입니다.',
      'ALREADY_CANCELLED'
    );
  }

  // 예약일 당일 취소 제한
  const reservationDate = new Date(existingReservation.reservation_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reservationDate.setHours(0, 0, 0, 0);

  if (reservationDate.getTime() <= today.getTime()) {
    throw ApiErrors.BadRequest(
      '예약일 당일 및 이후에는 취소할 수 없습니다.',
      'SAME_DAY_CANCELLATION_NOT_ALLOWED'
    );
  }

  // 예약 취소 처리
  const { data: cancelledReservation, error: cancelError } = await supabaseAdmin
    .from('reservations')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (cancelError) {
    console.error('Reservation cancellation error:', cancelError);
    throw ApiErrors.InternalServerError(
      '예약 취소에 실패했습니다.',
      'RESERVATION_CANCEL_ERROR'
    );
  }

  // 결제 정보도 취소 상태로 변경
  const { error: paymentCancelError } = await supabaseAdmin
    .from('reservation_payments')
    .update({
      status: 'CANCELLED',
      updated_at: new Date().toISOString()
    })
    .eq('reservation_id', id);

  if (paymentCancelError) {
    console.error('Payment cancellation error:', paymentCancelError);
    // 결제 정보 취소 실패는 로그만 남기고 계속 진행
  }

  return createSuccessResponse({
    reservation: cancelledReservation
  }, '예약이 취소되었습니다.');
}

export const GET = withErrorHandling(getReservationHandler);
export const PATCH = withErrorHandling(updateReservationHandler);
export const DELETE = withErrorHandling(cancelReservationHandler);