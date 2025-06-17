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
      exam_courses: {
        Row: {
          college: string
          course_code: string
          course_title: string
          created_at: string
          department: string
          id: string
          level: string
          student_count: number
          updated_at: string
        }
        Insert: {
          college: string
          course_code: string
          course_title: string
          created_at?: string
          department: string
          id?: string
          level: string
          student_count: number
          updated_at?: string
        }
        Update: {
          college?: string
          course_code?: string
          course_title?: string
          created_at?: string
          department?: string
          id?: string
          level?: string
          student_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      exam_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          day: string
          end_time: string
          exam_course_id: string | null
          id: string
          published: boolean | null
          session_name: string
          start_time: string
          venue_name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day: string
          end_time: string
          exam_course_id?: string | null
          id?: string
          published?: boolean | null
          session_name: string
          start_time: string
          venue_name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day?: string
          end_time?: string
          exam_course_id?: string | null
          id?: string
          published?: boolean | null
          session_name?: string
          start_time?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_exam_course_id_fkey"
            columns: ["exam_course_id"]
            isOneToOne: false
            referencedRelation: "exam_courses"
            referencedColumns: ["id"]
          },
        ]
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
      schedules: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          day: string
          end_time: string
          id: string
          published: boolean
          start_time: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          day: string
          end_time: string
          id?: string
          published?: boolean
          start_time: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          day?: string
          end_time?: string
          id?: string
          published?: boolean
          start_time?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
      clear_and_insert_exam_courses: {
        Args: { courses_data: Json }
        Returns: undefined
      }
      clear_and_insert_exam_schedule: {
        Args: { schedule_data: Json; should_publish?: boolean }
        Returns: undefined
      }
      clear_and_insert_schedule: {
        Args:
          | { schedule_data: Json }
          | { schedule_data: Json; should_publish?: boolean }
        Returns: undefined
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      publish_exam_schedule: {
        Args: { should_publish: boolean }
        Returns: undefined
      }
      publish_schedule: {
        Args: { should_publish: boolean }
        Returns: undefined
      }
      use_admin_code: {
        Args: { code_to_use: string; user_id: string }
        Returns: boolean
      }
      validate_admin_code: {
        Args: { code_to_check: string; college_to_check: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      department: [
        "Architecture",
        "Estate Management",
        "Accounting",
        "Banking and Finance",
        "Business Administration",
        "Criminology and Security Studies",
        "Economics",
        "International Relations",
        "Mass Communication",
        "Peace Studies and Conflict Resolution",
        "Political Science",
        "Public Administration",
        "Psychology",
        "Taxation",
        "Biochemistry",
        "Computer Science",
        "Cyber Security",
        "Environmental Management and Toxicology",
        "Industrial Chemistry",
        "Information Systems",
        "Microbiology and Industrial Biotechnology",
        "Software Engineering",
        "Maternal and Child Health Nursing",
        "Community and Public Health Nursing",
        "Adult Health/Medical and Surgical Nursing",
        "Mental Health and Psychiatric Nursing",
        "Nursing Management and Education",
        "Human Physiology",
        "Human Anatomy",
        "Education/Christian Religious Studies",
        "Guidance & Counselling",
        "Early Childhood Education",
        "Educational Management",
      ],
      user_role: ["student", "admin"],
    },
  },
} as const
