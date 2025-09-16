import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  validateRequiredFields,
  withErrorHandling
} from '@/lib/api-response';

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw ApiErrors.Unauthorized(
      '인증이 필요합니다.',
      'MISSING_TOKEN'
    );
  }

  const token = authorization.substring(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw ApiErrors.Unauthorized(
      '유효하지 않은 토큰입니다.',
      'INVALID_TOKEN'
    );
  }

  return user;
}

async function changePasswordHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const body = await request.json();

  // 입력값 검증
  validateRequiredFields(body, ['currentPassword', 'newPassword']);

  const { currentPassword, newPassword } = body;

  // 새 비밀번호 강도 검증
  if (newPassword.length < 8) {
    throw ApiErrors.BadRequest(
      '새 비밀번호는 8자 이상이어야 합니다.',
      'WEAK_PASSWORD'
    );
  }

  // 현재 비밀번호 확인
  const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword
  });

  if (signInError) {
    throw ApiErrors.Unauthorized(
      '현재 비밀번호가 일치하지 않습니다.',
      'INVALID_CURRENT_PASSWORD'
    );
  }

  // 비밀번호 업데이트
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      password: newPassword
    }
  );

  if (updateError) {
    console.error('Password update error:', updateError);
    throw ApiErrors.InternalServerError(
      '비밀번호 변경에 실패했습니다.',
      'PASSWORD_UPDATE_FAILED'
    );
  }

  return createSuccessResponse(
    {},
    '비밀번호가 성공적으로 변경되었습니다.'
  );
}

export const POST = withErrorHandling(changePasswordHandler);