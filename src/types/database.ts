// Generated TypeScript types based on database_rebuild.sql
// This file is the single source of truth for all database type definitions

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string | null
          name: string
          phone: string | null
          role: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
          status: 'ACTIVE' | 'INACTIVE'
          provider: 'email' | 'kakao'
          provider_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password?: string | null
          name: string
          phone?: string | null
          role?: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
          status?: 'ACTIVE' | 'INACTIVE'
          provider?: 'email' | 'kakao'
          provider_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string | null
          name?: string
          phone?: string | null
          role?: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
          status?: 'ACTIVE' | 'INACTIVE'
          provider?: 'email' | 'kakao'
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          id: string
          name: string
          description: string
          type: string
          capacity: number
          weekday_price: number
          weekend_price: number
          amenities: string[]
          images: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          type: string
          capacity: number
          weekday_price: number
          weekend_price: number
          amenities?: string[]
          images?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          type?: string
          capacity?: number
          weekday_price?: number
          weekend_price?: number
          amenities?: string[]
          images?: string[]
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          id: string
          facility_id: string
          site_number: string
          name: string
          description: string | null
          capacity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_id: string
          site_number: string
          name: string
          description?: string | null
          capacity: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_id?: string
          site_number?: string
          name?: string
          description?: string | null
          capacity?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          }
        ]
      }
      reservations: {
        Row: {
          id: string
          user_id: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_email: string | null
          facility_id: string
          site_id: string
          reservation_date: string
          time_slots: number[]
          total_amount: number
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
          payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED'
          special_requests: string | null
          admin_memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_email?: string | null
          facility_id: string
          site_id: string
          reservation_date: string
          time_slots: number[]
          total_amount: number
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
          payment_status?: 'WAITING' | 'COMPLETED' | 'REFUNDED'
          special_requests?: string | null
          admin_memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_email?: string | null
          facility_id?: string
          site_id?: string
          reservation_date?: string
          time_slots?: number[]
          total_amount?: number
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
          payment_status?: 'WAITING' | 'COMPLETED' | 'REFUNDED'
          special_requests?: string | null
          admin_memo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
        ]
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          is_important: boolean
          is_published: boolean
          author_id: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          is_important?: boolean
          is_published?: boolean
          author_id?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          is_important?: boolean
          is_published?: boolean
          author_id?: string | null
          view_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      faqs: {
        Row: {
          id: string
          question: string
          answer: string
          category: string
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          answer: string
          category?: string
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          answer?: string
          category?: string
          order_index?: number
          is_published?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          id: string
          customer_id: string
          birth_date: string | null
          address: string | null
          marketing_consent: boolean
          preferred_contact: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          birth_date?: string | null
          address?: string | null
          marketing_consent?: boolean
          preferred_contact?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          birth_date?: string | null
          address?: string | null
          marketing_consent?: boolean
          preferred_contact?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      reservation_payments: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          payment_method: string
          payment_status: string
          transaction_id: string | null
          paid_at: string | null
          refunded_at: string | null
          refund_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          payment_method: string
          payment_status?: string
          transaction_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
          paid_at?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      store_settings: {
        Row: {
          id: string
          key: string
          value: string
          category: 'store' | 'operation' | 'payment' | 'policy' | 'marketing' | 'social'
          description: string | null
          data_type: 'string' | 'number' | 'boolean' | 'json'
          is_required: boolean
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          category: 'store' | 'operation' | 'payment' | 'policy' | 'marketing' | 'social'
          description?: string | null
          data_type?: 'string' | 'number' | 'boolean' | 'json'
          is_required?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          category?: 'store' | 'operation' | 'payment' | 'policy' | 'marketing' | 'social'
          description?: string | null
          data_type?: 'string' | 'number' | 'boolean' | 'json'
          is_required?: boolean
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'ADMIN' | 'MANAGER' | 'CUSTOMER'
      user_status: 'ACTIVE' | 'INACTIVE'
      provider_type: 'email' | 'kakao'
      reservation_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
      payment_status: 'WAITING' | 'COMPLETED' | 'REFUNDED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type exports for easy access
export type UserRow = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type FacilityRow = Database['public']['Tables']['facilities']['Row']
export type FacilityInsert = Database['public']['Tables']['facilities']['Insert']
export type FacilityUpdate = Database['public']['Tables']['facilities']['Update']

export type SiteRow = Database['public']['Tables']['sites']['Row']
export type SiteInsert = Database['public']['Tables']['sites']['Insert']
export type SiteUpdate = Database['public']['Tables']['sites']['Update']

export type ReservationRow = Database['public']['Tables']['reservations']['Row']
export type ReservationInsert = Database['public']['Tables']['reservations']['Insert']
export type ReservationUpdate = Database['public']['Tables']['reservations']['Update']

export type NoticeRow = Database['public']['Tables']['notices']['Row']
export type NoticeInsert = Database['public']['Tables']['notices']['Insert']
export type NoticeUpdate = Database['public']['Tables']['notices']['Update']

export type FaqRow = Database['public']['Tables']['faqs']['Row']
export type FaqInsert = Database['public']['Tables']['faqs']['Insert']
export type FaqUpdate = Database['public']['Tables']['faqs']['Update']


export type CustomerProfileRow = Database['public']['Tables']['customer_profiles']['Row']
export type CustomerProfileInsert = Database['public']['Tables']['customer_profiles']['Insert']
export type CustomerProfileUpdate = Database['public']['Tables']['customer_profiles']['Update']

export type ReservationPaymentRow = Database['public']['Tables']['reservation_payments']['Row']
export type ReservationPaymentInsert = Database['public']['Tables']['reservation_payments']['Insert']
export type ReservationPaymentUpdate = Database['public']['Tables']['reservation_payments']['Update']

export type StoreSettingRow = Database['public']['Tables']['store_settings']['Row']
export type StoreSettingInsert = Database['public']['Tables']['store_settings']['Insert']
export type StoreSettingUpdate = Database['public']['Tables']['store_settings']['Update']

// Extended types for API responses and complex queries
export interface ReservationWithDetails extends ReservationRow {
  facilities?: FacilityRow
  sites?: SiteRow
  users?: UserRow
}

export interface FacilityWithSites extends FacilityRow {
  sites: SiteRow[]
}

export interface SiteWithFacility extends SiteRow {
  facilities: FacilityRow
}

export interface NoticeWithAuthor extends NoticeRow {
  users?: Pick<UserRow, 'id' | 'name' | 'email'>
}

// Time slot related types
export interface TimeSlotInfo {
  id: number
  name: string
  time_range: string
  available: boolean
}

export interface SiteAvailability {
  site_id: string
  site_name: string
  site_number: string
  capacity: number
  occupied_time_slots: number[]
  available_time_slots: number[]
}

export interface FacilityAvailability {
  facility_id: string
  facility_name: string
  facility_type: string
  sites: Record<string, SiteAvailability>
}

// API Request/Response types
export interface CreateReservationRequest {
  user_id?: string
  guest_name?: string
  guest_phone?: string
  guest_email?: string
  facility_id: string
  site_id: string
  reservation_date: string
  time_slots: number[]
  total_amount: number
  special_requests?: string
}

export interface UpdateReservationRequest {
  reservation_id: string
  user_id?: string
  guest_phone?: string
  facility_id?: string
  site_id?: string
  reservation_date?: string
  time_slots?: number[]
  total_amount?: number
  special_requests?: string
}

export interface CancelReservationRequest {
  reservation_id: string
  user_id?: string
  guest_phone?: string
  cancellation_reason?: string
}

export interface AvailabilityRequest {
  date: string
  facility_id?: string
}

export interface ReservationLookupRequest {
  reservation_id?: string
  guest_phone?: string
  date?: string
  facility_id?: string
}

// Dashboard and analytics types
export interface DashboardStats {
  total_reservations: number
  total_facilities: number
  total_revenue: number
  occupancy_rate: number
  recent_reservations: ReservationWithDetails[]
}

export interface RevenueByPeriod {
  period: string
  total_amount: number
  reservation_count: number
}

export interface FacilityUsageStats {
  facility_id: string
  facility_name: string
  total_reservations: number
  total_revenue: number
  occupancy_rate: number
}