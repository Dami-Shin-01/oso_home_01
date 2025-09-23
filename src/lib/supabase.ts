import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// 환경 변수 안전하게 가져오기
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  return key;
};

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  return key;
};

// 서버 사이드용 클라이언트 (타입 안전성 보장)
export const supabase = createClient<Database>(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);

// 관리자용 클라이언트 (서비스 롤 키 사용)
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

// 클라이언트 컴포넌트용 클라이언트
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

// Re-export Database type and convenience types for easy access
export type { Database } from '@/types/database';