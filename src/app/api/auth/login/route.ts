import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  validateEmail,
  withErrorHandling
} from '@/lib/api-response';

async function loginHandler(request: NextRequest) {
  const body = await request.json();

  // 입력값 검증
  validateRequiredFields(body, ['email', 'password']);
  validateEmail(body.email);

  const { email, password } = body;

  // 인증 시도
  const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    throw ApiErrors.Unauthorized(
      '이메일 또는 비밀번호가 일치하지 않습니다.',
      'INVALID_CREDENTIALS'
    );
  }

  // 사용자 프로필 조회
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw ApiErrors.InternalServerError(
      '사용자 정보를 가져올 수 없습니다.',
      'PROFILE_FETCH_ERROR'
    );
  }

  return createSuccessResponse({
    accessToken: authData.session?.access_token,
    refreshToken: authData.session?.refresh_token,
    user: {
      id: authData.user.id,
      email: authData.user.email,
      name: profile.name,
      role: profile.role
    }
  }, '로그인에 성공했습니다.');
}

export const POST = withErrorHandling(loginHandler);