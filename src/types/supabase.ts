/**
 * @deprecated This file contains legacy database types from the old SKU-based system.
 * Please use /src/types/database.ts instead, which contains the new facility-based schema.
 * This file will be removed in a future version.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: number
          ip_address: unknown | null
          target_id: number | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          target_id?: number | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          target_id?: number | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          available_slots: number | null
          block_reason: string | null
          blocked: boolean | null
          booked_slots: number | null
          created_at: string | null
          date: string
          id: string
          sku_code: string
          updated_at: string | null
        }
        Insert: {
          available_slots?: number | null
          block_reason?: string | null
          blocked?: boolean | null
          booked_slots?: number | null
          created_at?: string | null
          date: string
          id?: string
          sku_code: string
          updated_at?: string | null
        }
        Update: {
          available_slots?: number | null
          block_reason?: string | null
          blocked?: boolean | null
          booked_slots?: number | null
          created_at?: string | null
          date?: string
          id?: string
          sku_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["sku_code"]
          },
          {
            foreignKeyName: "availability_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "sku_catalog"
            referencedColumns: ["sku_code"]
          },
        ]
      }
      bookings: {
        Row: {
          base_price: number
          booking_date: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          guest_count: number
          id: string
          payment_method: string | null
          payment_status: string | null
          sku_code: string
          special_requests: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          base_price: number
          booking_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          guest_count?: number
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          sku_code: string
          special_requests?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          booking_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          guest_count?: number
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          sku_code?: string
          special_requests?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["sku_code"]
          },
          {
            foreignKeyName: "bookings_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "sku_catalog"
            referencedColumns: ["sku_code"]
          },
        ]
      }
      "reservation_add-ons": {
        Row: {
          addon_name: string
          addon_type: string
          created_at: string | null
          id: string
          quantity: number
          reservation_id: string
          total_price: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          addon_name: string
          addon_type: string
          created_at?: string | null
          id?: string
          quantity?: number
          reservation_id: string
          total_price: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          addon_name?: string
          addon_type?: string
          created_at?: string | null
          id?: string
          quantity?: number
          reservation_id?: string
          total_price?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_add-ons_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_add-ons_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_add-ons_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          admin_notes: string | null
          cancellation_reason: string | null
          created_at: string | null
          email: string | null
          guest_count: number | null
          id: string
          message: string | null
          name: string
          phone: string
          reservation_date: string
          reservation_number: string | null
          reservation_time: string | null
          service_type: string | null
          sku_code: string | null
          special_requests: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          email?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          name: string
          phone: string
          reservation_date: string
          reservation_number?: string | null
          reservation_time?: string | null
          service_type?: string | null
          sku_code?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          cancellation_reason?: string | null
          created_at?: string | null
          email?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          reservation_date?: string
          reservation_number?: string | null
          reservation_time?: string | null
          service_type?: string | null
          sku_code?: string | null
          special_requests?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["sku_code"]
          },
          {
            foreignKeyName: "reservations_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "sku_catalog"
            referencedColumns: ["sku_code"]
          },
        ]
      }
      resource_catalog: {
        Row: {
          active: boolean
          category_code: string
          created_at: string | null
          description: string | null
          display_name: string
          internal_code: string
          label: string | null
          max_guests: number | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          category_code: string
          created_at?: string | null
          description?: string | null
          display_name: string
          internal_code: string
          label?: string | null
          max_guests?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          category_code?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          internal_code?: string
          label?: string | null
          max_guests?: number | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sku_catalog: {
        Row: {
          active: boolean | null
          created_at: string | null
          internal_code: string
          sku_code: string
          slot_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          internal_code: string
          sku_code: string
          slot_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          internal_code?: string
          sku_code?: string
          slot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_catalog_internal_code_fkey"
            columns: ["internal_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["internal_code"]
          },
          {
            foreignKeyName: "sku_catalog_internal_code_fkey"
            columns: ["internal_code"]
            isOneToOne: false
            referencedRelation: "resource_catalog"
            referencedColumns: ["internal_code"]
          },
          {
            foreignKeyName: "sku_catalog_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "time_slot_catalog"
            referencedColumns: ["slot_id"]
          },
        ]
      }
      time_slot_catalog: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          end_local: string
          part_name: string
          price_multiplier: number | null
          slot_id: string
          slot_name: string
          start_local: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          end_local: string
          part_name: string
          price_multiplier?: number | null
          slot_id: string
          slot_name: string
          start_local: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          end_local?: string
          part_name?: string
          price_multiplier?: number | null
          slot_id?: string
          slot_name?: string
          start_local?: string
        }
        Relationships: []
      }
    }
    Views: {
      available_slots: {
        Row: {
          active: boolean | null
          base_price: number | null
          category_code: string | null
          duration_minutes: number | null
          end_local: string | null
          internal_code: string | null
          max_guests: number | null
          part_name: string | null
          resource_name: string | null
          sku_code: string | null
          slot_name: string | null
          start_local: string | null
        }
        Relationships: []
      }
      booking_details: {
        Row: {
          base_price: number | null
          booking_date: string | null
          category_code: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          end_local: string | null
          guest_count: number | null
          id: string | null
          payment_method: string | null
          payment_status: string | null
          resource_name: string | null
          sku_code: string | null
          slot_name: string | null
          special_requests: string | null
          start_local: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["sku_code"]
          },
          {
            foreignKeyName: "bookings_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "sku_catalog"
            referencedColumns: ["sku_code"]
          },
        ]
      }
      reservation_details: {
        Row: {
          base_price: number | null
          category_code: string | null
          created_at: string | null
          email: string | null
          end_local: string | null
          guest_count: number | null
          id: string | null
          name: string | null
          phone: string | null
          reservation_date: string | null
          resource_name: string | null
          sku_code: string | null
          slot_name: string | null
          special_requests: string | null
          start_local: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "available_slots"
            referencedColumns: ["sku_code"]
          },
          {
            foreignKeyName: "reservations_sku_code_fkey"
            columns: ["sku_code"]
            isOneToOne: false
            referencedRelation: "sku_catalog"
            referencedColumns: ["sku_code"]
          },
        ]
      }
      reservations_legacy: {
        Row: {
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          guest_count: number | null
          id: string | null
          message: string | null
          reservation_date: string | null
          reservation_number: string | null
          reservation_time: string | null
          service_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          guest_count?: number | null
          id?: string | null
          message?: string | null
          reservation_date?: string | null
          reservation_number?: string | null
          reservation_time?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          guest_count?: number | null
          id?: string | null
          message?: string | null
          reservation_date?: string | null
          reservation_number?: string | null
          reservation_time?: string | null
          service_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_cancel_reservation: {
        Args: {
          p_admin_notes?: string
          p_cancellation_reason?: string
          p_reservation_id: string
        }
        Returns: {
          error_msg: string
          reservation_data: Json
          success: boolean
        }[]
      }
      admin_confirm_reservation: {
        Args: { p_admin_notes?: string; p_reservation_id: string }
        Returns: {
          error_msg: string
          reservation_data: Json
          success: boolean
        }[]
      }
      admin_delete_reservation: {
        Args: { p_deletion_reason?: string; p_reservation_id: string }
        Returns: {
          error_msg: string
          reservation_data: Json
          success: boolean
        }[]
      }
      create_reservation_atomic: {
        Args: {
          p_email?: string
          p_guest_count?: number
          p_message?: string
          p_name: string
          p_phone: string
          p_reservation_date: string
          p_reservation_time: string
          p_service_type?: string
        }
        Returns: {
          error_msg: string
          reservation_id: string
          reservation_number: string
          success: boolean
        }[]
      }
      create_test_admin: {
        Args: { admin_email: string; admin_name?: string; admin_role?: string }
        Returns: boolean
      }
      fix_admin_account: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_user_id: string
          is_active: boolean
          message: string
          profile_exists: boolean
        }[]
      }
      get_admin_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      verify_admin_by_email: {
        Args: { p_email: string }
        Returns: {
          is_admin: boolean
          permissions: Json
          role: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
