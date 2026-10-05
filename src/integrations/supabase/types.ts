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
      book_chunks: {
        Row: {
          book: string
          content: string
          embedding: string | null
          fts: unknown
          id: string
          page: number | null
        }
        Insert: {
          book: string
          content: string
          embedding?: string | null
          fts?: unknown
          id?: string
          page?: number | null
        }
        Update: {
          book?: string
          content?: string
          embedding?: string | null
          fts?: unknown
          id?: string
          page?: number | null
        }
        Relationships: []
      }
      conditions: {
        Row: {
          created_at: string | null
          description: string | null
          fts: unknown
          id: string
          name: string
          source: string | null
          symptoms: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          name: string
          source?: string | null
          symptoms?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          name?: string
          source?: string | null
          symptoms?: string[] | null
        }
        Relationships: []
      }
      medicine_conditions: {
        Row: {
          condition_id: string
          medicine_id: string
          notes: string | null
        }
        Insert: {
          condition_id: string
          medicine_id: string
          notes?: string | null
        }
        Update: {
          condition_id?: string
          medicine_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicine_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicine_conditions_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          created_at: string | null
          description: string | null
          fts: unknown
          id: string
          name: string
          potencies: string[] | null
          source: string | null
          uses: string | null
          why_used: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          name: string
          potencies?: string[] | null
          source?: string | null
          uses?: string | null
          why_used?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fts?: unknown
          id?: string
          name?: string
          potencies?: string[] | null
          source?: string | null
          uses?: string | null
          why_used?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          created_at: string | null
          doctor_id: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          doctor_id?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          doctor_id: string
          dosage: string | null
          id: string
          medicine_name: string
          potency: string | null
          visit_id: string
        }
        Insert: {
          doctor_id?: string
          dosage?: string | null
          id?: string
          medicine_name: string
          potency?: string | null
          visit_id: string
        }
        Update: {
          doctor_id?: string
          dosage?: string | null
          id?: string
          medicine_name?: string
          potency?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string | null
          diagnosis: string | null
          doctor_id: string
          id: string
          notes: string | null
          patient_id: string
          symptoms: string | null
          visit_date: string
        }
        Insert: {
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id: string
          symptoms?: string | null
          visit_date?: string
        }
        Update: {
          created_at?: string | null
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          symptoms?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_chunks: {
        Args: { q: string }
        Returns: {
          book: string
          page: number
          snippet: string
        }[]
      }
      search_conditions: {
        Args: { q: string }
        Returns: {
          description: string
          id: string
          medicines: Json
          name: string
          rank: number
          symptoms: string[]
        }[]
      }
      search_medicines: {
        Args: { q: string }
        Returns: {
          conditions: Json
          description: string
          id: string
          name: string
          potencies: string[]
          rank: number
          uses: string
          why_used: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
