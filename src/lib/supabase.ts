import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

// 클라이언트에서 안전하게 사용할 수 있는 환경 변수들 (NEXT_PUBLIC_ 접두사)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

// 서버 사이드용 클라이언트 (타입 안전성 보장)
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// 클라이언트 컴포넌트용 클라이언트
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

// Re-export Database type and convenience types for easy access
export type { Database } from '@/types/database';