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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          correct_answers: number
          created_at: string
          duration_seconds: number | null
          id: string
          score: number
          topic: string
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          score: number
          topic: string
          total_questions: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          score?: number
          topic?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      mock_interviews: {
        Row: {
          completed_at: string | null
          created_at: string
          feedback: Json | null
          id: string
          interview_type: string
          overall_score: number | null
          role: string
          status: string
          transcript: Json
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interview_type?: string
          overall_score?: number | null
          role: string
          status?: string
          transcript?: Json
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interview_type?: string
          overall_score?: number | null
          role?: string
          status?: string
          transcript?: Json
          user_id?: string
        }
        Relationships: []
      }
      practice_attempts: {
        Row: {
          category: string
          created_at: string
          feedback: string | null
          id: string
          question_id: string | null
          question_text: string
          score: number
          topic: string | null
          user_answer: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          feedback?: string | null
          id?: string
          question_id?: string | null
          question_text: string
          score?: number
          topic?: string | null
          user_answer: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          feedback?: string | null
          id?: string
          question_id?: string | null
          question_text?: string
          score?: number
          topic?: string | null
          user_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string
          experience_level: string
          full_name: string | null
          graduation_year: number | null
          id: string
          onboarding_completed: boolean
          prep_duration_days: number | null
          skills: string[]
          target_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          experience_level?: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          onboarding_completed?: boolean
          prep_duration_days?: number | null
          skills?: string[]
          target_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string
          experience_level?: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          onboarding_completed?: boolean
          prep_duration_days?: number | null
          skills?: string[]
          target_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          correct_option: number | null
          created_at: string
          difficulty: string
          id: string
          model_answer: string | null
          options: Json | null
          question: string
          question_type: string
          role: string | null
          topic: string
        }
        Insert: {
          category: string
          correct_option?: number | null
          created_at?: string
          difficulty?: string
          id?: string
          model_answer?: string | null
          options?: Json | null
          question: string
          question_type?: string
          role?: string | null
          topic: string
        }
        Update: {
          category?: string
          correct_option?: number | null
          created_at?: string
          difficulty?: string
          id?: string
          model_answer?: string | null
          options?: Json | null
          question?: string
          question_type?: string
          role?: string | null
          topic?: string
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
