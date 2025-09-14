import { createClient } from '@supabase/supabase-js';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import TestDatabaseClientPage from './TestDatabaseClientPage';

// 테스트 결과 타입을 정의합니다.
export interface TestResult {
  exists: boolean;
  error?: string;
  data: unknown[];
  count: number;
}

// 서버 컴포넌트: 데이터베이스 연결 및 테스트를 수행합니다.
export default async function TestDatabasePage() {
  // 서버 사이드에서만 사용될 Supabase Admin 클라이언트를 생성합니다.
  // 이 로직은 클라이언트로 절대 전송되지 않습니다.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let connectionStatus: 'connected' | 'failed' = 'failed';
  let connectionError: string | null = null;
  const testResults: Record<string, TestResult> = {};

  const tableNames = [
    'users',
    'facilities',
    'sites',
    'reservations',
    'announcements',
    'faqs',
  ];

  try {
    // 1. 기본 연결 테스트 (가장 간단한 쿼리 실행)
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);

    if (error) {
      throw new Error(error.message);
    }
    connectionStatus = 'connected';

    // 2. 각 테이블의 존재 여부 및 데이터 샘플링
    for (const tableName of tableNames) {
      try {
        const { data, error: tableError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (tableError) throw tableError;

        testResults[tableName] = {
          exists: true,
          data: data || [],
          count: data?.length || 0,
        };
      } catch (err: any) {
        testResults[tableName] = {
          exists: false,
          error: err.message,
          data: [],
          count: 0,
        };
      }
    }
  } catch (err: any) {
    connectionStatus = 'failed';
    connectionError = err.message;
  }

  // 서버에서 가져온 데이터를 클라이언트 컴포넌트로 전달합니다.
  return (
    <TestDatabaseClientPage
      initialConnectionStatus={connectionStatus}
      initialConnectionError={connectionError}
      initialTestResults={testResults}
    />
  );
}
