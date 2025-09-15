// 실제 Supabase 데이터베이스 구조에 맞춘 타입 정의
import { Database } from './supabase';

// 기본 테이블 타입들
export type ReservationRow = Database['public']['Tables']['reservations']['Row'];
export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type ResourceCatalogRow = Database['public']['Tables']['resource_catalog']['Row'];
export type SkuCatalogRow = Database['public']['Tables']['sku_catalog']['Row'];
export type TimeSlotCatalogRow = Database['public']['Tables']['time_slot_catalog']['Row'];
export type AvailabilityRow = Database['public']['Tables']['availability']['Row'];

// 예약 관련 확장 타입들
export interface ReservationWithDetails extends ReservationRow {
  resource?: ResourceCatalogRow;
  sku?: SkuCatalogRow;
  time_slot?: TimeSlotCatalogRow;
}

export interface BookingWithDetails extends BookingRow {
  resource?: ResourceCatalogRow;
  sku?: SkuCatalogRow;
}

// API 응답용 타입들
export interface ReservationDetail {
  id: string;
  status: string;
  reservation_date: string;
  reservation_time: string | null;
  guest_count: number | null;
  name: string;
  phone: string;
  email: string | null;
  service_type: string | null;
  sku_code: string | null;
  special_requests: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BookingDetail {
  id: string;
  status: string;
  booking_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  guest_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  sku_code: string;
  base_price: number;
  total_amount: number;
  payment_status: string | null;
  payment_method: string | null;
  special_requests: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// 대시보드용 통계 타입
export interface DashboardStats {
  total_reservations: number;
  total_bookings: number;
  total_revenue: number;
  occupancy_rate: number;
}

// 기존 호환성을 위한 타입 별칭들
export type FlexibleReservation = ReservationWithDetails;
export type AdminReservationDetail = ReservationDetail;
export type DashboardReservationData = ReservationDetail;
export type UserReservationData = ReservationDetail;
export type AdminReservationData = ReservationDetail;