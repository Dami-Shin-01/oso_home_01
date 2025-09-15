'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import { TestResult } from './page'; // 타입을 page.tsx에서 가져옵니다.

interface Props {
  initialConnectionStatus: 'connected' | 'failed';
  initialConnectionError: string | null;
  initialTestResults: Record<string, TestResult>;
}

// 클라이언트 컴포넌트: UI 렌더링과 사용자 상호작용을 담당합니다.
export default function TestDatabaseClientPage({ 
  initialConnectionStatus,
  initialConnectionError,
  initialTestResults 
}: Props) {
  const router = useRouter();

  // '다시 테스트' 버튼 클릭 시 서버 컴포넌트를 새로고침합니다.
  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Supabase 데이터베이스 테스트</h1>

      {/* 연결 상태 */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">연결 상태</h2>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${
            initialConnectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="font-medium">
            {initialConnectionStatus === 'connected' ? 'Supabase 연결 성공!' : 'Supabase 연결 실패'}
          </span>
          <Button size="sm" onClick={handleRefresh}>
            다시 테스트
          </Button>
        </div>
        
        {initialConnectionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm"><strong>오류:</strong> {initialConnectionError}</p>
          </div>
        )}
      </Card>

      {/* 프로젝트 정보 */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">프로젝트 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Project URL:</strong><br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </code>
          </div>
          <div>
            <strong>Anon Key (first 50 chars):</strong><br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...
            </code>
          </div>
        </div>
      </Card>

      {/* 테이블 상태 */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">테이블 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(initialTestResults).map(([tableName, result]) => (
            <div key={tableName} className={`p-4 border rounded-lg ${
              result.exists ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${result.exists ? 'bg-green-500' : 'bg-red-500'}`} />
                <h3 className="font-semibold">{tableName}</h3>
              </div>
              
              {result.exists ? (
                <div className="text-sm">
                  <p className="text-green-700">✅ 테이블 존재</p>
                  <p className="text-gray-600">데이터 수: {result.count}건</p>
                  {result.data.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">샘플 데이터 보기</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {JSON.stringify(result.data[0], null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-red-700">❌ 테이블 없음 또는 접근 불가</p>
                  <p className="text-red-600 text-xs mt-1">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 개발자 정보 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">개발자 정보</h3>
        <p className="text-blue-700 text-sm">
          이 페이지는 개발 중 데이터베이스 상태를 확인하기 위한 임시 페이지입니다. 
          운영 환경에서는 제거해야 합니다.
        </p>
      </div>
    </div>
  );
}
