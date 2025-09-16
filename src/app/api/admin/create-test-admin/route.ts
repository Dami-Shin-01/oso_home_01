import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createSuccessResponse,
  ApiErrors,
  withErrorHandling
} from '@/lib/api-response';

async function createTestAdminHandler(request: NextRequest) {
  // 테스트용 관리자 계정 생성
  const adminEmail = 'admin@osobbq.com';
  const adminPassword = 'admin123!';
  const adminName = '오소 관리자';

  try {
    // 1. Supabase Auth에 관리자 계정 생성
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true // 이메일 인증 건너뛰기
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        // 이미 존재하는 경우, users 테이블 정보만 확인
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', adminEmail)
          .single();

        if (existingUser) {
          return createSuccessResponse({
            message: '관리자 계정이 이미 존재합니다.',
            admin: {
              email: adminEmail,
              name: existingUser.name,
              role: existingUser.role
            }
          }, '테스트 관리자 계정 확인 완료');
        }
      } else {
        throw new Error(`Auth 계정 생성 실패: ${signUpError.message}`);
      }
    }

    // 2. users 테이블에 관리자 정보 추가
    if (authData?.user) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authData.user.id,
          email: adminEmail,
          name: adminName,
          role: 'ADMIN',
          status: 'ACTIVE',
          provider: 'email'
        });

      if (insertError) {
        console.error('Users table insert error:', insertError);
        // Auth 계정은 생성되었으므로 삭제
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(`사용자 테이블 생성 실패: ${insertError.message}`);
      }
    }

    return createSuccessResponse({
      message: '테스트 관리자 계정이 성공적으로 생성되었습니다.',
      admin: {
        email: adminEmail,
        name: adminName,
        role: 'ADMIN'
      },
      loginInfo: {
        email: adminEmail,
        password: adminPassword
      }
    }, '테스트 관리자 계정 생성 완료');

  } catch (error) {
    console.error('Test admin creation error:', error);
    throw ApiErrors.InternalServerError(
      `테스트 관리자 계정 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      'TEST_ADMIN_CREATION_FAILED'
    );
  }
}

export const POST = withErrorHandling(createTestAdminHandler);