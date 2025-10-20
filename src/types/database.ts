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
      areas: {
        Row: {
          created_at: string | null
          description: string | null
          farm_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          farm_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consumption: {
        Row: {
          area_id: string | null
          created_at: string | null
          date: string
          farm_id: string
          feed_type_id: string
          group_name: string | null
          id: string
          pen_name: string | null
          quantity: number
          updated_at: string | null
          upload_id: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          date: string
          farm_id: string
          feed_type_id: string
          group_name?: string | null
          id?: string
          pen_name?: string | null
          quantity: number
          updated_at?: string | null
          upload_id?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          date?: string
          farm_id?: string
          feed_type_id?: string
          group_name?: string | null
          id?: string
          pen_name?: string | null
          quantity?: number
          updated_at?: string | null
          upload_id?: string | null
        }
        Relationships: []
      }
      farm_members: {
        Row: {
          created_at: string | null
          farm_id: string
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          farm_id: string
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          farm_id?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      farms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feed_types: {
        Row: {
          created_at: string | null
          farm_id: string
          id: string
          name: string
          normalized_name: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          farm_id: string
          id?: string
          name: string
          normalized_name?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          farm_id?: string
          id?: string
          name?: string
          normalized_name?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      uploads: {
        Row: {
          created_at: string | null
          error_message: string | null
          farm_id: string
          file_url: string | null
          filename: string
          id: string
          rows_imported: number | null
          rows_updated: number | null
          status: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          farm_id: string
          file_url?: string | null
          filename: string
          id?: string
          rows_imported?: number | null
          rows_updated?: number | null
          status: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          farm_id?: string
          file_url?: string | null
          filename?: string
          id?: string
          rows_imported?: number | null
          rows_updated?: number | null
          status?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
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