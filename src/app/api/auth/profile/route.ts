import { NextRequest } from 'next/server';
import { supabaseAdmin, type Database } from '@/lib/supabase-admin';
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

async function getProfileHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  // users 테이블에서 프로필 조회 (타입 안전성 보장)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, phone, role, status, provider, created_at, updated_at')
    .eq('id', user.id)
    .single() as {
      data: Database['public']['Tables']['users']['Row'] | null;
      error: any;
    };

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError);
    throw ApiErrors.NotFound(
      '사용자 프로필을 찾을 수 없습니다.',
      'PROFILE_NOT_FOUND'
    );
  }

  return createSuccessResponse({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      status: profile.status,
      provider: profile.provider,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }
  }, '프로필 조회가 완료되었습니다.');
}

async function updateProfileHandler(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  const body = await request.json();

  // 업데이트 가능한 필드만 허용
  const allowedFields = ['name', 'phone'];
  const updateData: Partial<Database['public']['Tables']['users']['Update']> = {};

  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      updateData[field as keyof typeof updateData] = body[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw ApiErrors.BadRequest(
      '업데이트할 정보가 없습니다.',
      'NO_UPDATE_DATA'
    );
  }

  // 업데이트 시간 추가
  updateData.updated_at = new Date().toISOString();

  // users 테이블 업데이트
  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', user.id)
    .select('id, email, name, phone, role, status, provider, created_at, updated_at')
    .single() as {
      data: Database['public']['Tables']['users']['Row'] | null;
      error: any;
    };

  if (updateError || !updatedProfile) {
    console.error('Profile update error:', updateError);
    throw ApiErrors.InternalServerError(
      '프로필 업데이트에 실패했습니다.',
      'PROFILE_UPDATE_FAILED'
    );
  }

  return createSuccessResponse({
    user: {
      id: updatedProfile.id,
      email: updatedProfile.email,
      name: updatedProfile.name,
      phone: updatedProfile.phone,
      role: updatedProfile.role,
      status: updatedProfile.status,
      provider: updatedProfile.provider,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at
    }
  }, '프로필이 성공적으로 업데이트되었습니다.');
}

export const GET = withErrorHandling(getProfileHandler);
export const PUT = withErrorHandling(updateProfileHandler);