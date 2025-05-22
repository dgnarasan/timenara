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
      admin_access_codes: {
        Row: {
          code: string
          college: string
          created_at: string
          id: string
          used: boolean
          used_by: string | null
        }
        Insert: {
          code: string
          college: string
          created_at?: string
          id?: string
          used?: boolean
          used_by?: string | null
        }
        Update: {
          code?: string
          college?: string
          created_at?: string
          id?: string
          used?: boolean
          used_by?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          academic_level: string | null
          class_size: number
          code: string
          constraints: string[] | null
          created_at: string
          department: Database["public"]["Enums"]["department"]
          id: string
          lecturer: string
          name: string
          preferred_slots: Json | null
        }
        Insert: {
          academic_level?: string | null
          class_size: number
          code: string
          constraints?: string[] | null
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          id?: string
          lecturer: string
          name: string
          preferred_slots?: Json | null
        }
        Update: {
          academic_level?: string | null
          class_size?: number
          code?: string
          constraints?: string[] | null
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          id?: string
          lecturer?: string
          name?: string
          preferred_slots?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          college: string | null
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          college?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          availability: Json | null
          capacity: number
          created_at: string
          id: string
          name: string
        }
        Insert: {
          availability?: Json | null
          capacity: number
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          availability?: Json | null
          capacity?: number
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      use_admin_code: {
        Args: {
          code_to_use: string
          user_id: string
        }
        Returns: boolean
      }
      validate_admin_code: {
        Args: {
          code_to_check: string
          college_to_check: string
        }
        Returns: boolean
      }
    }
    Enums: {
      department:
        | "Architecture"
        | "Estate Management"
        | "Accounting"
        | "Banking and Finance"
        | "Business Administration"
        | "Criminology and Security Studies"
        | "Economics"
        | "International Relations"
        | "Mass Communication"
        | "Peace Studies and Conflict Resolution"
        | "Political Science"
        | "Public Administration"
        | "Psychology"
        | "Taxation"
        | "Biochemistry"
        | "Computer Science"
        | "Cyber Security"
        | "Environmental Management and Toxicology"
        | "Industrial Chemistry"
        | "Information Systems"
        | "Microbiology and Industrial Biotechnology"
        | "Software Engineering"
        | "Maternal and Child Health Nursing"
        | "Community and Public Health Nursing"
        | "Adult Health/Medical and Surgical Nursing"
        | "Mental Health and Psychiatric Nursing"
        | "Nursing Management and Education"
        | "Human Physiology"
        | "Human Anatomy"
        | "Education/Christian Religious Studies"
        | "Guidance & Counselling"
        | "Early Childhood Education"
        | "Educational Management"
      user_role: "student" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
