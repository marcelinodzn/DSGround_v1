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
      brand_typography: {
        Row: {
          brand_id: string | null
          created_at: string
          id: string
          primary_font_id: string | null
          primary_font_scale: string | null
          primary_font_styles: Json | null
          secondary_font_id: string | null
          secondary_font_scale: string | null
          secondary_font_styles: Json | null
          tertiary_font_id: string | null
          tertiary_font_scale: string | null
          tertiary_font_styles: Json | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          id?: string
          primary_font_id?: string | null
          primary_font_scale?: string | null
          primary_font_styles?: Json | null
          secondary_font_id?: string | null
          secondary_font_scale?: string | null
          secondary_font_styles?: Json | null
          tertiary_font_id?: string | null
          tertiary_font_scale?: string | null
          tertiary_font_styles?: Json | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          id?: string
          primary_font_id?: string | null
          primary_font_scale?: string | null
          primary_font_styles?: Json | null
          secondary_font_id?: string | null
          secondary_font_scale?: string | null
          secondary_font_styles?: Json | null
          tertiary_font_id?: string | null
          tertiary_font_scale?: string | null
          tertiary_font_styles?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_typography_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_typography_primary_font_id_fkey"
            columns: ["primary_font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_typography_secondary_font_id_fkey"
            columns: ["secondary_font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_typography_tertiary_font_id_fkey"
            columns: ["tertiary_font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      font_families: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_variable: boolean | null
          name: string
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          variable_mode: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_variable?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variable_mode?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_variable?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variable_mode?: string | null
        }
        Relationships: []
      }
      font_versions: {
        Row: {
          created_at: string | null
          file_key: string
          file_url: string
          font_id: string | null
          id: string
          version: string
        }
        Insert: {
          created_at?: string | null
          file_key: string
          file_url: string
          font_id?: string | null
          id?: string
          version: string
        }
        Update: {
          created_at?: string | null
          file_key?: string
          file_url?: string
          font_id?: string | null
          id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "font_versions_font_id_fkey"
            columns: ["font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
        ]
      }
      fonts: {
        Row: {
          category: string
          created_at: string | null
          family: string
          family_id: string | null
          file_key: string
          file_url: string
          format: string
          id: string
          is_variable: boolean | null
          name: string
          style: string
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          variable_mode: string | null
          weight: number
        }
        Insert: {
          category: string
          created_at?: string | null
          family: string
          family_id?: string | null
          file_key: string
          file_url: string
          format: string
          id?: string
          is_variable?: boolean | null
          name: string
          style: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variable_mode?: string | null
          weight: number
        }
        Update: {
          category?: string
          created_at?: string | null
          family?: string
          family_id?: string | null
          file_key?: string
          file_url?: string
          format?: string
          id?: string
          is_variable?: boolean | null
          name?: string
          style?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          variable_mode?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "fonts_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "font_families"
            referencedColumns: ["id"]
          },
        ]
      }
      platforms: {
        Row: {
          brand_id: string | null
          created_at: string
          description: string | null
          id: string
          layout: Json
          name: string
          units: Json
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          layout?: Json
          name: string
          units?: Json
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          layout?: Json
          name?: string
          units?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platforms_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      type_scales: {
        Row: {
          brand_id: string | null
          created_at: string | null
          font_id: string | null
          id: string
          platform_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          font_id?: string | null
          id?: string
          platform_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          font_id?: string | null
          id?: string
          platform_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "type_scales_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "type_scales_font_id_fkey"
            columns: ["font_id"]
            isOneToOne: false
            referencedRelation: "fonts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "type_scales_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      type_styles: {
        Row: {
          created_at: string
          font_weight: number
          id: string
          letter_spacing: number
          line_height: number
          name: string
          optical_size: number | null
          platform_id: string | null
          scale_step: string
        }
        Insert: {
          created_at?: string
          font_weight?: number
          id?: string
          letter_spacing?: number
          line_height?: number
          name: string
          optical_size?: number | null
          platform_id?: string | null
          scale_step: string
        }
        Update: {
          created_at?: string
          font_weight?: number
          id?: string
          letter_spacing?: number
          line_height?: number
          name?: string
          optical_size?: number | null
          platform_id?: string | null
          scale_step?: string
        }
        Relationships: []
      }
      typography_settings: {
        Row: {
          ai_settings: Json | null
          created_at: string
          distance_scale: Json | null
          id: string
          platform_id: string | null
          scale_config: Json
          scale_method: string
          updated_at: string | null
        }
        Insert: {
          ai_settings?: Json | null
          created_at?: string
          distance_scale?: Json | null
          id?: string
          platform_id?: string | null
          scale_config?: Json
          scale_method?: string
          updated_at?: string | null
        }
        Update: {
          ai_settings?: Json | null
          created_at?: string
          distance_scale?: Json | null
          id?: string
          platform_id?: string | null
          scale_config?: Json
          scale_method?: string
          updated_at?: string | null
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
