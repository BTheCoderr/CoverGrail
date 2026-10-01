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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      beta_feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          rating: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          rating?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      comic_scans: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_raw_value: number | null
          grading_started_at: string | null
          id: string
          issue_number: string | null
          notes: string | null
          publication_year: number | null
          publisher: string | null
          quota_consumed_at: string | null
          status: string
          title: string
          user_id: string
          user_saved_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_raw_value?: number | null
          grading_started_at?: string | null
          grading_started_at?: string | null
          id?: string
          issue_number?: string | null
          notes?: string | null
          publication_year?: number | null
          publisher?: string | null
          quota_consumed_at?: string | null
          status?: string
          title: string
          user_id: string
          user_saved_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_raw_value?: number | null
          id?: string
          issue_number?: string | null
          notes?: string | null
          publication_year?: number | null
          publisher?: string | null
          quota_consumed_at?: string | null
          status?: string
          title?: string
          user_id?: string
          user_saved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comic_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmed_grades: {
        Row: {
          certification_number: string | null
          confirmed_grade: number
          created_at: string
          grading_company: string
          id: string
          notes: string | null
          returned_at: string | null
          scan_id: string
          submitted_at: string | null
        }
        Insert: {
          certification_number?: string | null
          confirmed_grade: number
          created_at?: string
          grading_company: string
          id?: string
          notes?: string | null
          returned_at?: string | null
          scan_id: string
          submitted_at?: string | null
        }
        Update: {
          certification_number?: string | null
          confirmed_grade?: number
          created_at?: string
          grading_company?: string
          id?: string
          notes?: string | null
          returned_at?: string | null
          scan_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmed_grades_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: true
            referencedRelation: "comic_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          created_at: string
          event_name: string
          id: number
          metadata: Json
          scan_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: number
          metadata?: Json
          scan_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: number
          metadata?: Json
          scan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_events_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "comic_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          email: string | null
          free_scans_remaining: number
          full_name: string | null
          id: string
          monthly_scan_limit: number
          paid_scan_credits: number
          plan: string
          scans_used_this_period: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          email?: string | null
          free_scans_remaining?: number
          full_name?: string | null
          id: string
          monthly_scan_limit?: number
          paid_scan_credits?: number
          plan?: string
          scans_used_this_period?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          email?: string | null
          free_scans_remaining?: number
          full_name?: string | null
          id?: string
          monthly_scan_limit?: number
          paid_scan_credits?: number
          plan?: string
          scans_used_this_period?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
        }
        Relationships: []
      }
      scan_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          scan_id: string
          sort_order: number
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type: string
          scan_id: string
          sort_order?: number
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          scan_id?: string
          sort_order?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_images_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "comic_scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_results: {
        Row: {
          confidence: string
          created_at: string
          detected_defects: Json
          estimated_grading_cost: number | null
          estimated_upside: number | null
          id: string
          next_steps: string[]
          photo_quality_score: number
          predicted_grade_high: number
          predicted_grade_low: number
          raw_ai_response: Json | null
          reasoning_summary: string
          recommendation: string
          scan_id: string
        }
        Insert: {
          confidence: string
          created_at?: string
          detected_defects?: Json
          estimated_grading_cost?: number | null
          estimated_upside?: number | null
          id?: string
          next_steps?: string[]
          photo_quality_score: number
          predicted_grade_high: number
          predicted_grade_low: number
          raw_ai_response?: Json | null
          reasoning_summary: string
          recommendation: string
          scan_id: string
        }
        Update: {
          confidence?: string
          created_at?: string
          detected_defects?: Json
          estimated_grading_cost?: number | null
          estimated_upside?: number | null
          id?: string
          next_steps?: string[]
          photo_quality_score?: number
          predicted_grade_high?: number
          predicted_grade_low?: number
          raw_ai_response?: Json | null
          reasoning_summary?: string
          recommendation?: string
          scan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_results_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: true
            referencedRelation: "comic_scans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_scan_quota: { Args: { p_scan_id: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
