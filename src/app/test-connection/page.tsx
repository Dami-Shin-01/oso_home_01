'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string>('');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError('');
    setResults({});

    try {
      // 1. 환경변수 확인
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
      }

      console.log('Testing connection to:', SUPABASE_URL);

      // 2. REST API로 직접 연결 테스트
      const testUrl = `${SUPABASE_URL}/rest/v1/users?select=*&limit=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      setResults({
        status: response.status,
        data: data,
        dataLength: Array.isArray(data) ? data.length : 'Not an array',
        headers: Object.fromEntries([...response.headers.entries()])
      });

      setConnectionStatus('success');

    } catch (err) {
      console.error('Connection test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConnectionStatus('failed');
    }
  };

  const testTables = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setError('환경변수가 설정되지 않았습니다.');
      return;
    }

    const tables = ['users', 'facilities', 'sites', 'reservations', 'announcements', 'faqs'];
    const tableResults: {[key: string]: any} = {};

    for (const table of tables) {
      try {
        const testUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=3`;
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          tableResults[table] = {
            status: 'success',
            count: Array.isArray(data) ? data.length : 0,
            sample: data.length > 0 ? data[0] : null
          };
        } else {
          const errorText = await response.text();
          tableResults[table] = {
            status: 'error',
            error: `${response.status}: ${errorText}`
          };
        }
      } catch (err) {
        tableResults[table] = {
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }

    setResults({
      ...results,
      tables: tableResults
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Supabase 연결 테스트</h1>

      {/* 환경변수 정보 */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">환경변수 확인</h2>
        <div className="space-y-2 text-sm">
          <div>
            <strong>SUPABASE_URL:</strong> 
            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
              {SUPABASE_URL || 'NOT SET'}
            </code>
          </div>
          <div>
            <strong>ANON_KEY (first 50 chars):</strong> 
            <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
              {SUPABASE_ANON_KEY?.substring(0, 50) || 'NOT SET'}...
            </code>
          </div>
        </div>
      </Card>

      {/* 연결 테스트 */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">기본 연결 테스트</h2>
        
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
            {connectionStatus === 'testing' ? '테스트 중...' : '연결 테스트'}
          </Button>
          
          <div className={`flex items-center gap-2`}>
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'idle' ? 'bg-gray-300' :
              connectionStatus === 'testing' ? 'bg-yellow-500' :
              connectionStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              {connectionStatus === 'idle' ? '테스트 대기' :
               connectionStatus === 'testing' ? '테스트 중...' :
               connectionStatus === 'success' ? '연결 성공' : '연결 실패'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm"><strong>오류:</strong> {error}</p>
          </div>
        )}

        {connectionStatus === 'success' && (
          <div className="mb-4">
            <Button onClick={testTables} variant="secondary">
              테이블 상태 확인
            </Button>
          </div>
        )}
      </Card>

      {/* 결과 표시 */}
      {Object.keys(results).length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-4">테스트 결과</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </Card>
      )}

      {/* 안내 메시지 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">📋 테스트 정보</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• 이 페이지는 npm 패키지 문제를 우회하여 fetch API로 직접 테스트합니다</li>
          <li>• 성공하면 Supabase 연결과 데이터베이스 테이블 상태를 확인할 수 있습니다</li>
          <li>• URL: /test-connection (개발 전용)</li>
        </ul>
      </div>
    </div>
  );
}