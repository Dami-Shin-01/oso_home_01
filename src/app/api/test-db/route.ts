import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-response';

async function testDatabaseHandler(request: NextRequest) {
  const supabase = createAdminClient();

  // store_settings 테이블의 모든 데이터 조회
  const { data: settings, error: settingsError } = await supabase
    .from('store_settings')
    .select('*')
    .order('category', { ascending: true });

  if (settingsError) {
    console.error('Settings fetch error:', settingsError);
  }

  // users 테이블에서 관리자 계정 확인
  const { data: adminUser, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('email', 'admin@osobbq.com')
    .single();

  if (userError) {
    console.error('Admin user fetch error:', userError);
  }

  return createSuccessResponse({
    settings: settings || [],
    settingsCount: settings?.length || 0,
    settingsError: settingsError?.message || null,
    adminUser: adminUser || null,
    userError: userError?.message || null
  }, '데이터베이스 상태 확인 완료');
}

export const GET = withErrorHandling(testDatabaseHandler);