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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          category: string
          created_at: string | null
          id: string
          metadata: Json | null
          query: string
          response: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query: string
          response: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          query?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_diagnostics: {
        Row: {
          created_at: string | null
          detection_type: string | null
          id: string
          image_url: string | null
          organic_options: string | null
          result_title: string | null
          treatment_plan: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detection_type?: string | null
          id?: string
          image_url?: string | null
          organic_options?: string | null
          result_title?: string | null
          treatment_plan?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detection_type?: string | null
          id?: string
          image_url?: string | null
          organic_options?: string | null
          result_title?: string | null
          treatment_plan?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_diagnostics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          likes_count: number | null
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          location_tag: string | null
          media_url: string | null
          upvotes_count: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          location_tag?: string | null
          media_url?: string | null
          upvotes_count?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          location_tag?: string | null
          media_url?: string | null
          upvotes_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string | null
          gps_coordinates: unknown
          id: string
          land_size_acres: number | null
          primary_crop: string | null
          soil_type_manual: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gps_coordinates?: unknown
          id?: string
          land_size_acres?: number | null
          primary_crop?: string | null
          soil_type_manual?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gps_coordinates?: unknown
          id?: string
          land_size_acres?: number | null
          primary_crop?: string | null
          soil_type_manual?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      govt_schemes: {
        Row: {
          application_deadline: string | null
          application_form_url: string | null
          application_method: string | null
          application_portal_url: string | null
          application_start_date: string | null
          benefit_description: string | null
          benefit_description_hindi: string | null
          benefit_description_marathi: string | null
          created_at: string | null
          eligibility_criteria: Json | null
          eligible_states: string[] | null
          helpline_number: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          max_benefit_amount: number | null
          ministry: string
          recurrence_pattern: string | null
          required_documents: string[] | null
          scheme_code: string
          scheme_name: string
          scheme_name_hindi: string
          scheme_name_marathi: string
          scheme_type: string | null
          tags: string[] | null
          target_beneficiary: string[] | null
          updated_at: string | null
        }
        Insert: {
          application_deadline?: string | null
          application_form_url?: string | null
          application_method?: string | null
          application_portal_url?: string | null
          application_start_date?: string | null
          benefit_description?: string | null
          benefit_description_hindi?: string | null
          benefit_description_marathi?: string | null
          created_at?: string | null
          eligibility_criteria?: Json | null
          eligible_states?: string[] | null
          helpline_number?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_benefit_amount?: number | null
          ministry: string
          recurrence_pattern?: string | null
          required_documents?: string[] | null
          scheme_code: string
          scheme_name: string
          scheme_name_hindi: string
          scheme_name_marathi: string
          scheme_type?: string | null
          tags?: string[] | null
          target_beneficiary?: string[] | null
          updated_at?: string | null
        }
        Update: {
          application_deadline?: string | null
          application_form_url?: string | null
          application_method?: string | null
          application_portal_url?: string | null
          application_start_date?: string | null
          benefit_description?: string | null
          benefit_description_hindi?: string | null
          benefit_description_marathi?: string | null
          created_at?: string | null
          eligibility_criteria?: Json | null
          eligible_states?: string[] | null
          helpline_number?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          max_benefit_amount?: number | null
          ministry?: string
          recurrence_pattern?: string | null
          required_documents?: string[] | null
          scheme_code?: string
          scheme_name?: string
          scheme_name_hindi?: string
          scheme_name_marathi?: string
          scheme_type?: string | null
          tags?: string[] | null
          target_beneficiary?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string
          id: string
          location_village: string | null
          phone_number: string | null
          preferred_language: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          location_village?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          location_village?: string | null
          phone_number?: string | null
          preferred_language?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scheme_applications: {
        Row: {
          application_date: string | null
          application_reference_number: string | null
          approved_at: string | null
          benefit_amount_received: number | null
          created_at: string | null
          disbursed_at: string | null
          documents_uploaded: string[] | null
          id: string
          next_action: string | null
          next_action_due_date: string | null
          notes: string | null
          rejection_reason: string | null
          reminder_enabled: boolean | null
          scheme_id: string
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_date?: string | null
          application_reference_number?: string | null
          approved_at?: string | null
          benefit_amount_received?: number | null
          created_at?: string | null
          disbursed_at?: string | null
          documents_uploaded?: string[] | null
          id?: string
          next_action?: string | null
          next_action_due_date?: string | null
          notes?: string | null
          rejection_reason?: string | null
          reminder_enabled?: boolean | null
          scheme_id: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_date?: string | null
          application_reference_number?: string | null
          approved_at?: string | null
          benefit_amount_received?: number | null
          created_at?: string | null
          disbursed_at?: string | null
          documents_uploaded?: string[] | null
          id?: string
          next_action?: string | null
          next_action_due_date?: string | null
          notes?: string | null
          rejection_reason?: string | null
          reminder_enabled?: boolean | null
          scheme_id?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheme_applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "govt_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheme_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          created_at: string | null
          feature: string | null
          id: string
          query: string | null
          result_summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature?: string | null
          id?: string
          query?: string | null
          result_summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string | null
          id?: string
          query?: string | null
          result_summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_comment: {
        Args: { p_comment: string; p_post_id: string; p_user_id: string }
        Returns: string
      }
      toggle_post_like: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: Json
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
