import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// 서버 전용 환경 변수 안전하게 가져오기
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
};

const getSupabaseServiceKey = () => {
  // 서버 사이드에서만 실행되는지 확인
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side');
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key;
};

// 관리자용 클라이언트 (서버 사이드 전용)
export const supabaseAdmin = createClient<Database>(
  getSupabaseUrl(),
  getSupabaseServiceKey(),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 서버 전용임을 명시하는 타입
export type AdminClient = typeof supabaseAdmin;

// Re-export Database type for convenience
export type { Database } from '@/types/database';