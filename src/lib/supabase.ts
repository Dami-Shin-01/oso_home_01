import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { env } from './env';

// 서버 사이드용 클라이언트 (타입 안전성 보장)
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 관리자용 클라이언트 (서비스 롤 키 사용)
export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
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

// 타입 정의 (Supabase에서 생성된 타입을 여기에 추가)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          role: 'USER' | 'MANAGER' | 'ADMIN';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone: string;
          role?: 'USER' | 'MANAGER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          role?: 'USER' | 'MANAGER' | 'ADMIN';
          updated_at?: string;
        };
      };
      facilities: {
        Row: {
          id: string;
          name: string;
          description: string;
          type: string;
          capacity: number;
          weekday_price: number;
          weekend_price: number;
          amenities: string[];
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          user_id?: string;
          guest_name?: string;
          guest_phone?: string;
          guest_email?: string;
          facility_id: string;
          site_id: string;
          reservation_date: string;
          time_slots: number[];
          total_amount: number;
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED';
          special_requests?: string;
          admin_memo?: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};