'use client';

import { useState } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export default function TestStoreSettingsPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [loading, setLoading] = useState(false);

  const createTable = async () => {
    setLoading(true);
    setStatus('Creating store_settings table...');

    try {
      const supabase = createAdminClient();

      // 테이블 생성 SQL 실행
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          -- 매장 설정 관리 테이블
          CREATE TABLE IF NOT EXISTS store_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            category TEXT NOT NULL CHECK (category IN ('store', 'operation', 'payment', 'policy', 'marketing', 'social')),
            description TEXT,
            data_type TEXT DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
            is_required BOOLEAN DEFAULT false,
            is_public BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID,
            updated_by UUID
          );

          -- 인덱스 생성
          CREATE INDEX IF NOT EXISTS idx_store_settings_key ON store_settings(key);
          CREATE INDEX IF NOT EXISTS idx_store_settings_category ON store_settings(category);
          CREATE INDEX IF NOT EXISTS idx_store_settings_public ON store_settings(is_public);

          -- RLS 정책 설정
          ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
        `
      });

      if (tableError) {
        console.error('Table creation error:', tableError);
        setStatus(`Error creating table: ${tableError.message}`);
        return;
      }

      setStatus('Table created successfully! Adding RLS policies...');

      // RLS 정책 추가
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          -- 기존 정책 삭제 (있다면)
          DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON store_settings;
          DROP POLICY IF EXISTS "Admins can view all settings" ON store_settings;
          DROP POLICY IF EXISTS "Admins can modify settings" ON store_settings;

          -- 공개 설정은 모든 사용자가 읽기 가능
          CREATE POLICY "Public settings are viewable by everyone"
          ON store_settings FOR SELECT
          USING (is_public = true);

          -- 관리자만 모든 설정 조회 가능
          CREATE POLICY "Admins can view all settings"
          ON store_settings FOR SELECT
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('ADMIN', 'MANAGER')
            )
          );

          -- 관리자만 설정 수정 가능
          CREATE POLICY "Admins can modify settings"
          ON store_settings FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.id = auth.uid()
              AND users.role IN ('ADMIN', 'MANAGER')
            )
          );
        `
      });

      if (policyError) {
        console.error('Policy creation error:', policyError);
        setStatus(`Warning: Policies might not be set correctly: ${policyError.message}`);
      } else {
        setStatus('RLS policies created successfully! Inserting default data...');
      }

      // 기본 데이터 삽입
      const { error: dataError } = await supabase
        .from('store_settings')
        .upsert([
          // 매장 기본 정보
          { key: 'STORE_NAME', value: '오소 바베큐장', category: 'store', description: '매장 이름', data_type: 'string', is_required: true, is_public: true },
          { key: 'STORE_PHONE', value: '02-1234-5678', category: 'store', description: '매장 전화번호', data_type: 'string', is_required: true, is_public: true },
          { key: 'STORE_EMAIL', value: 'info@osobbq.com', category: 'store', description: '매장 이메일', data_type: 'string', is_required: true, is_public: true },
          { key: 'STORE_NOREPLY_EMAIL', value: 'noreply@osobbq.com', category: 'store', description: '자동 발송 이메일 주소', data_type: 'string', is_required: true, is_public: false },
          { key: 'STORE_ADMIN_EMAIL', value: 'admin@osobbq.com', category: 'store', description: '관리자 이메일', data_type: 'string', is_required: true, is_public: false },

          // 매장 위치 및 운영 정보
          { key: 'STORE_ADDRESS', value: '서울특별시 강남구 테헤란로 123', category: 'store', description: '매장 주소', data_type: 'string', is_required: true, is_public: true },
          { key: 'STORE_DETAILED_ADDRESS', value: '서울특별시 강남구 역삼동 123-45', category: 'store', description: '매장 상세 주소', data_type: 'string', is_required: false, is_public: true },
          { key: 'STORE_BUSINESS_HOURS', value: '오전 10시 - 오후 10시', category: 'store', description: '영업 시간', data_type: 'string', is_required: true, is_public: true },
          { key: 'STORE_CLOSED_DAY', value: '매주 월요일', category: 'store', description: '정기 휴무일', data_type: 'string', is_required: false, is_public: true },

          // 시간대 설정
          { key: 'TIME_SLOT_1', value: '10:00-14:00', category: 'operation', description: '1시간대 (예: 10:00-14:00)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_2', value: '14:00-18:00', category: 'operation', description: '2시간대 (예: 14:00-18:00)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_3', value: '18:00-22:00', category: 'operation', description: '3시간대 (예: 18:00-22:00)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_4', value: '22:00-02:00', category: 'operation', description: '4시간대 (예: 22:00-02:00)', data_type: 'string', is_required: false, is_public: true },
          { key: 'TIME_SLOT_1_NAME', value: '1부', category: 'operation', description: '1시간대 이름 (예: 1부)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_2_NAME', value: '2부', category: 'operation', description: '2시간대 이름 (예: 2부)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_3_NAME', value: '3부', category: 'operation', description: '3시간대 이름 (예: 3부)', data_type: 'string', is_required: true, is_public: true },
          { key: 'TIME_SLOT_4_NAME', value: '4부', category: 'operation', description: '4시간대 이름 (예: 4부)', data_type: 'string', is_required: false, is_public: true },

          // 은행 계좌 정보
          { key: 'BANK_NAME', value: '국민은행', category: 'payment', description: '은행명', data_type: 'string', is_required: true, is_public: true },
          { key: 'BANK_ACCOUNT_NUMBER', value: '123456-78-901234', category: 'payment', description: '계좌번호', data_type: 'string', is_required: true, is_public: true },
          { key: 'BANK_ACCOUNT_HOLDER', value: '오소바베큐장', category: 'payment', description: '예금주', data_type: 'string', is_required: true, is_public: true },

          // 비즈니스 정책
          { key: 'CANCELLATION_POLICY', value: '예약일 1일 전까지 취소 가능합니다', category: 'policy', description: '취소 정책', data_type: 'string', is_required: true, is_public: true },
          { key: 'REFUND_POLICY', value: '취소 시점에 따라 환불 정책이 적용됩니다', category: 'policy', description: '환불 정책', data_type: 'string', is_required: true, is_public: true },
          { key: 'MAX_ADVANCE_BOOKING_DAYS', value: '30', category: 'policy', description: '최대 예약 가능 일수', data_type: 'number', is_required: true, is_public: false },
          { key: 'MIN_ADVANCE_BOOKING_HOURS', value: '2', category: 'policy', description: '최소 예약 선행 시간', data_type: 'number', is_required: true, is_public: false },

          // SEO 및 마케팅
          { key: 'SITE_TITLE', value: '오소 바베큐장 예약 시스템', category: 'marketing', description: '사이트 제목', data_type: 'string', is_required: true, is_public: true },
          { key: 'SITE_DESCRIPTION', value: '바베큐장 시설 대여를 위한 간편한 예약 시스템', category: 'marketing', description: '사이트 설명', data_type: 'string', is_required: true, is_public: true },
          { key: 'SITE_KEYWORDS', value: '바베큐,예약,바베큐장,가족모임,야외활동', category: 'marketing', description: '사이트 키워드', data_type: 'string', is_required: false, is_public: true },

          // 소셜 미디어
          { key: 'SOCIAL_INSTAGRAM_URL', value: 'https://instagram.com/osobbq', category: 'social', description: '인스타그램 URL', data_type: 'string', is_required: false, is_public: true },
          { key: 'SOCIAL_FACEBOOK_URL', value: 'https://facebook.com/osobbq', category: 'social', description: '페이스북 URL', data_type: 'string', is_required: false, is_public: true },
          { key: 'SOCIAL_BLOG_URL', value: 'https://blog.naver.com/osobbq', category: 'social', description: '블로그 URL', data_type: 'string', is_required: false, is_public: true }
        ], { onConflict: 'key' });

      if (dataError) {
        console.error('Data insertion error:', dataError);
        setStatus(`Error inserting default data: ${dataError.message}`);
      } else {
        setStatus('✅ Store settings table created successfully with default data!');
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      setStatus(`Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testRead = async () => {
    setLoading(true);
    setStatus('Testing data read...');

    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(5);

      if (error) {
        setStatus(`Read error: ${error.message}`);
      } else {
        setStatus(`✅ Successfully read ${data?.length || 0} settings records!`);
        console.log('Sample data:', data);
      }

    } catch (error) {
      setStatus(`Read error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Store Settings Table Setup</h1>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Setup</h2>

        <div className="space-y-4">
          <button
            onClick={createTable}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Store Settings Table'}
          </button>

          <button
            onClick={testRead}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Read Data'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Status:</h3>
          <p className="text-sm">{status}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h3 className="font-medium text-yellow-800">Note:</h3>
        <p className="text-sm text-yellow-700">
          This page creates the store_settings table and populates it with default data.
          Run this once to set up the database-based settings system.
        </p>
      </div>
    </div>
  );
}