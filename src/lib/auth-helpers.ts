import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiErrors } from '@/lib/api-response';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * 요청에서 인증된 사용자 정보를 가져옵니다.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser> {
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

  // users 테이블에서 추가 정보 조회
  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, email, name, role, status')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile) {
    throw ApiErrors.NotFound(
      '사용자 프로필을 찾을 수 없습니다.',
      'PROFILE_NOT_FOUND'
    );
  }

  if (userProfile.status !== 'ACTIVE') {
    throw ApiErrors.Forbidden(
      '비활성화된 계정입니다.',
      'ACCOUNT_INACTIVE'
    );
  }

  return {
    id: userProfile.id,
    email: userProfile.email,
    name: userProfile.name,
    role: userProfile.role,
    status: userProfile.status
  };
}

/**
 * 관리자 권한을 확인합니다.
 */
export async function requireAdminAccess(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw ApiErrors.Forbidden(
      '관리자 권한이 필요합니다.',
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  return user;
}

/**
 * 매니저 이상 권한을 확인합니다.
 */
export async function requireManagerAccess(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (user.role === 'USER') {
    throw ApiErrors.Forbidden(
      '매니저 이상의 권한이 필요합니다.',
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  return user;
}

/**
 * 특정 역할 권한을 확인합니다.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: ('USER' | 'MANAGER' | 'ADMIN')[]
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);

  if (!allowedRoles.includes(user.role)) {
    throw ApiErrors.Forbidden(
      `다음 권한 중 하나가 필요합니다: ${allowedRoles.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS'
    );
  }

  return user;
}