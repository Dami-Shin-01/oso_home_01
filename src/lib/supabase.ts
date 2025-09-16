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

// 새로운 데이터베이스 스키마 타입 정의
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string | null;
          name: string;
          phone: string | null;
          role: 'USER' | 'MANAGER' | 'ADMIN';
          status: 'ACTIVE' | 'INACTIVE';
          provider: 'email' | 'kakao';
          provider_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password?: string | null;
          name: string;
          phone?: string | null;
          role?: 'USER' | 'MANAGER' | 'ADMIN';
          status?: 'ACTIVE' | 'INACTIVE';
          provider?: 'email' | 'kakao';
          provider_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string | null;
          name?: string;
          phone?: string | null;
          role?: 'USER' | 'MANAGER' | 'ADMIN';
          status?: 'ACTIVE' | 'INACTIVE';
          provider?: 'email' | 'kakao';
          provider_id?: string | null;
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
        Insert: {
          id?: string;
          name: string;
          description: string;
          type: string;
          capacity: number;
          weekday_price: number;
          weekend_price: number;
          amenities?: string[];
          images?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          type?: string;
          capacity?: number;
          weekday_price?: number;
          weekend_price?: number;
          amenities?: string[];
          images?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          facility_id: string;
          site_number: string;
          name: string;
          description: string | null;
          capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          site_number: string;
          name: string;
          description?: string | null;
          capacity: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          site_number?: string;
          name?: string;
          description?: string | null;
          capacity?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          user_id: string | null;
          guest_name: string | null;
          guest_phone: string | null;
          guest_email: string | null;
          facility_id: string;
          site_id: string;
          reservation_date: string;
          time_slots: number[];
          total_amount: number;
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED';
          special_requests: string | null;
          admin_memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          guest_email?: string | null;
          facility_id: string;
          site_id: string;
          reservation_date: string;
          time_slots: number[];
          total_amount: number;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          payment_status?: 'WAITING' | 'COMPLETED' | 'REFUNDED';
          special_requests?: string | null;
          admin_memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          guest_email?: string | null;
          facility_id?: string;
          site_id?: string;
          reservation_date?: string;
          time_slots?: number[];
          total_amount?: number;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
          payment_status?: 'WAITING' | 'COMPLETED' | 'REFUNDED';
          special_requests?: string | null;
          admin_memo?: string | null;
          updated_at?: string;
        };
      };
      notices: {
        Row: {
          id: string;
          title: string;
          content: string;
          is_important: boolean;
          is_published: boolean;
          author_id: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          is_important?: boolean;
          is_published?: boolean;
          author_id?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          is_important?: boolean;
          is_published?: boolean;
          author_id?: string | null;
          view_count?: number;
          updated_at?: string;
        };
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          order_index: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string;
          order_index?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          category?: string;
          order_index?: number;
          is_published?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'USER' | 'MANAGER' | 'ADMIN';
      user_status: 'ACTIVE' | 'INACTIVE';
      provider_type: 'email' | 'kakao';
      reservation_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
      payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};