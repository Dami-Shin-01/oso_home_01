// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

// 시설 관련 타입
export interface Facility {
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
}

export interface Site {
  id: string;
  facility_id: string;
  site_number: string;
  site_name: string;
  features: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 예약 관련 타입
export interface Reservation {
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
}

// 콘텐츠 관련 타입
export interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  is_published: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

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