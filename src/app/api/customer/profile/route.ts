import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  validateEmail,
  withErrorHandling
} from '@/lib/api-response';

// 고객 프로필 조회
async function getCustomerProfileHandler(request: NextRequest) {
  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  // 고객 정보 조회 (users + customer_profiles 조인)
  const { data: customerProfile, error: fetchError } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      status,
      provider,
      created_at,
      updated_at,
      customer_profiles (
        address,
        marketing_consent,
        preferred_contact,
        notes,
        created_at as profile_created_at,
        updated_at as profile_updated_at
      )
    `)
    .eq('id', user.id)
    .eq('role', 'CUSTOMER')
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.NotFound('고객 정보를 찾을 수 없습니다.');
    }
    console.error('Customer profile fetch error:', fetchError);
    throw ApiErrors.InternalServerError(
      '프로필 조회에 실패했습니다.',
      'PROFILE_FETCH_ERROR'
    );
  }

  // 예약 통계 정보 추가 조회
  const { data: reservationStats, error: statsError } = await supabaseAdmin
    .from('reservations')
    .select('status')
    .eq('user_id', user.id);

  let stats = {
    total_reservations: 0,
    confirmed_reservations: 0,
    pending_reservations: 0,
    cancelled_reservations: 0
  };

  if (!statsError && reservationStats) {
    stats.total_reservations = reservationStats.length;
    stats.confirmed_reservations = reservationStats.filter(r => r.status === 'CONFIRMED').length;
    stats.pending_reservations = reservationStats.filter(r => r.status === 'PENDING').length;
    stats.cancelled_reservations = reservationStats.filter(r => r.status === 'CANCELLED').length;
  }

  return createSuccessResponse({
    profile: customerProfile,
    statistics: stats
  });
}

// 고객 프로필 수정
async function updateCustomerProfileHandler(request: NextRequest) {
  const body = await request.json();

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw ApiErrors.Unauthorized('로그인이 필요합니다.');
  }

  // 기존 고객 정보 확인
  const { data: existingCustomer, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .eq('role', 'CUSTOMER')
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw ApiErrors.NotFound('고객 정보를 찾을 수 없습니다.');
    }
    throw ApiErrors.InternalServerError('고객 정보 조회에 실패했습니다.');
  }

  // users 테이블 수정 가능한 필드
  const userUpdateData: any = { updated_at: new Date().toISOString() };
  const userAllowedFields = ['name', 'phone'];

  for (const field of userAllowedFields) {
    if (body[field] !== undefined) {
      if (field === 'name' && (!body[field] || body[field].trim().length < 2)) {
        throw ApiErrors.BadRequest('이름은 2글자 이상이어야 합니다.');
      }
      userUpdateData[field] = body[field];
    }
  }

  // 이메일은 별도 처리 (Supabase Auth 연동 필요)
  if (body.email && body.email !== existingCustomer.email) {
    validateEmail(body.email);

    // 이메일 중복 확인
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', body.email)
      .neq('id', user.id);

    if (emailCheckError) {
      throw ApiErrors.InternalServerError('이메일 중복 확인에 실패했습니다.');
    }

    if (existingEmail && existingEmail.length > 0) {
      throw ApiErrors.Conflict('이미 사용 중인 이메일입니다.');
    }

    userUpdateData.email = body.email;
  }

  // users 테이블 업데이트
  let updatedUser = null;
  if (Object.keys(userUpdateData).length > 1) { // updated_at만 있는 경우 제외
    const { data, error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update(userUpdateData)
      .eq('id', user.id)
      .eq('role', 'CUSTOMER')
      .select()
      .single();

    if (userUpdateError) {
      console.error('User update error:', userUpdateError);
      throw ApiErrors.InternalServerError(
        '사용자 정보 수정에 실패했습니다.',
        'USER_UPDATE_ERROR'
      );
    }
    updatedUser = data;
  }

  // customer_profiles 테이블 수정
  const profileUpdateData: any = { updated_at: new Date().toISOString() };
  const profileAllowedFields = ['address', 'marketing_consent', 'preferred_contact', 'notes'];

  for (const field of profileAllowedFields) {
    if (body[field] !== undefined) {
      profileUpdateData[field] = body[field];
    }
  }

  let updatedProfile = null;
  if (Object.keys(profileUpdateData).length > 1) { // updated_at만 있는 경우 제외
    // customer_profiles 테이블에 레코드가 있는지 확인
    const { data: existingProfile, error: profileFetchError } = await supabaseAdmin
      .from('customer_profiles')
      .select('customer_id')
      .eq('customer_id', user.id)
      .single();

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      throw ApiErrors.InternalServerError('프로필 정보 조회에 실패했습니다.');
    }

    if (existingProfile) {
      // 기존 프로필 업데이트
      const { data, error: profileUpdateError } = await supabaseAdmin
        .from('customer_profiles')
        .update(profileUpdateData)
        .eq('customer_id', user.id)
        .select()
        .single();

      if (profileUpdateError) {
        console.error('Profile update error:', profileUpdateError);
        throw ApiErrors.InternalServerError(
          '프로필 수정에 실패했습니다.',
          'PROFILE_UPDATE_ERROR'
        );
      }
      updatedProfile = data;
    } else {
      // 새 프로필 생성
      profileUpdateData.customer_id = user.id;
      profileUpdateData.created_at = new Date().toISOString();

      const { data, error: profileCreateError } = await supabaseAdmin
        .from('customer_profiles')
        .insert(profileUpdateData)
        .select()
        .single();

      if (profileCreateError) {
        console.error('Profile creation error:', profileCreateError);
        throw ApiErrors.InternalServerError(
          '프로필 생성에 실패했습니다.',
          'PROFILE_CREATE_ERROR'
        );
      }
      updatedProfile = data;
    }
  }

  // 업데이트된 전체 프로필 조회
  const { data: fullProfile, error: fullFetchError } = await supabaseAdmin
    .from('users')
    .select(`
      id,
      email,
      name,
      phone,
      role,
      status,
      provider,
      created_at,
      updated_at,
      customer_profiles (
        address,
        marketing_consent,
        preferred_contact,
        notes,
        created_at as profile_created_at,
        updated_at as profile_updated_at
      )
    `)
    .eq('id', user.id)
    .eq('role', 'CUSTOMER')
    .single();

  if (fullFetchError) {
    console.error('Full profile fetch error:', fullFetchError);
    throw ApiErrors.InternalServerError('업데이트된 프로필 조회에 실패했습니다.');
  }

  return createSuccessResponse({
    profile: fullProfile
  }, '프로필이 성공적으로 수정되었습니다.');
}

export const GET = withErrorHandling(getCustomerProfileHandler);
export const PATCH = withErrorHandling(updateCustomerProfileHandler);