import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CUSTOMER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

/**
 * JWT 토큰에서 사용자 정보 추출
 */
export function extractTokenPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Token extraction error:', error);
    return null;
  }
}

/**
 * 요청에서 액세스 토큰 추출
 */
export function extractAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * 사용자 인증 확인
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = extractAccessToken(request);

    if (!token) {
      return null;
    }

    // Supabase Auth로 토큰 검증
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('Auth verification error:', error);
      return null;
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User data fetch error:', userError);
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: userData.status
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * 관리자 권한 확인
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AuthUser | null> {
  const user = await verifyAuth(request);

  if (!user) {
    return null;
  }

  // 관리자 권한 확인
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return null;
  }

  // 활성 상태 확인
  if (user.status !== 'ACTIVE') {
    return null;
  }

  return user;
}

/**
 * 고객 권한 확인
 */
export async function verifyCustomerAuth(request: NextRequest): Promise<AuthUser | null> {
  const user = await verifyAuth(request);

  if (!user) {
    return null;
  }

  // 고객 권한 확인
  if (user.role !== 'CUSTOMER') {
    return null;
  }

  // 활성 상태 확인
  if (user.status !== 'ACTIVE') {
    return null;
  }

  return user;
}

/**
 * 특정 역할 권한 확인
 */
export async function verifyRoleAuth(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthUser | null> {
  const user = await verifyAuth(request);

  if (!user) {
    return null;
  }

  // 역할 권한 확인
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  // 활성 상태 확인
  if (user.status !== 'ACTIVE') {
    return null;
  }

  return user;
}

/**
 * 리프레시 토큰으로 새 액세스 토큰 생성
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
  error?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session || !data.user) {
      return { error: 'Invalid refresh token' };
    }

    // 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, status')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return { error: 'User data not found' };
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status
      }
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return { error: 'Token refresh failed' };
  }
}

/**
 * 로그아웃 (토큰 무효화)
 */
export async function logout(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'Logout failed' };
  }
}