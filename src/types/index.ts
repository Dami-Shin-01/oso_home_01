import type { Database } from '@/lib/supabase';

// DB 타입에서 파생된 엔티티 타입들
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Facility = Database['public']['Tables']['facilities']['Row'];
export type FacilityInsert = Database['public']['Tables']['facilities']['Insert'];
export type FacilityUpdate = Database['public']['Tables']['facilities']['Update'];

export type Site = Database['public']['Tables']['sites']['Row'];
export type SiteInsert = Database['public']['Tables']['sites']['Insert'];
export type SiteUpdate = Database['public']['Tables']['sites']['Update'];

export type Reservation = Database['public']['Tables']['reservations']['Row'];
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert'];
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update'];

export type Notice = Database['public']['Tables']['notices']['Row'];
export type NoticeInsert = Database['public']['Tables']['notices']['Insert'];
export type NoticeUpdate = Database['public']['Tables']['notices']['Update'];

export type FAQ = Database['public']['Tables']['faqs']['Row'];
export type FAQInsert = Database['public']['Tables']['faqs']['Insert'];
export type FAQUpdate = Database['public']['Tables']['faqs']['Update'];

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 폼 관련 타입
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

export interface ReservationForm {
  facility_id: string;
  site_id: string;
  reservation_date: string;
  time_slots: number[];
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  special_requests?: string;
}