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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      area_group_memberships: {
        Row: {
          area_group_id: string
          area_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          area_group_id: string
          area_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          area_group_id?: string
          area_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_group_memberships_area_group_id_fkey"
            columns: ["area_group_id"]
            isOneToOne: false
            referencedRelation: "area_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_group_memberships_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: true
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      area_groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          farm_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          farm_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_groups_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "areas_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "consumption_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_feed_type_id_fkey"
            columns: ["feed_type_id"]
            isOneToOne: false
            referencedRelation: "feed_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_transactions: {
        Row: {
          amount: number
          cost_type_id: string
          created_at: string | null
          created_by: string
          description: string | null
          farm_id: string
          id: string
          invoice_number: string | null
          livestock_count_id: string | null
          notes: string | null
          quantity: number | null
          supplier_id: string | null
          supplier_name: string | null
          transaction_date: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          cost_type_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          farm_id: string
          id?: string
          invoice_number?: string | null
          livestock_count_id?: string | null
          notes?: string | null
          quantity?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_date: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          cost_type_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          farm_id?: string
          id?: string
          invoice_number?: string | null
          livestock_count_id?: string | null
          notes?: string | null
          quantity?: number | null
          supplier_id?: string | null
          supplier_name?: string | null
          transaction_date?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_transactions_cost_type_id_fkey"
            columns: ["cost_type_id"]
            isOneToOne: false
            referencedRelation: "cost_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_transactions_livestock_count_id_fkey"
            columns: ["livestock_count_id"]
            isOneToOne: false
            referencedRelation: "livestock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_types: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          farm_id: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          farm_id: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_types_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          config: Json
          created_at: string | null
          dashboard_id: string
          id: string
          layout_h: number
          layout_max_h: number | null
          layout_max_w: number | null
          layout_min_h: number | null
          layout_min_w: number | null
          layout_w: number
          layout_x: number
          layout_y: number
          template_name: string | null
          title: string
          updated_at: string | null
          widget_type: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          dashboard_id: string
          id?: string
          layout_h: number
          layout_max_h?: number | null
          layout_max_w?: number | null
          layout_min_h?: number | null
          layout_min_w?: number | null
          layout_w: number
          layout_x: number
          layout_y: number
          template_name?: string | null
          title: string
          updated_at?: string | null
          widget_type: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          dashboard_id?: string
          id?: string
          layout_h?: number
          layout_max_h?: number | null
          layout_max_w?: number | null
          layout_min_h?: number | null
          layout_min_w?: number | null
          layout_w?: number
          layout_x?: number
          layout_y?: number
          template_name?: string | null
          title?: string
          updated_at?: string | null
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          farm_id: string
          grid_cols: number | null
          grid_row_height: number | null
          id: string
          is_default: boolean | null
          is_template: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          farm_id: string
          grid_cols?: number | null
          grid_row_height?: number | null
          id?: string
          is_default?: boolean | null
          is_template?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          farm_id?: string
          grid_cols?: number | null
          grid_row_height?: number | null
          id?: string
          is_default?: boolean | null
          is_template?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboards_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          farm_size: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          farm_size?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          farm_size?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
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
        Relationships: [
          {
            foreignKeyName: "farm_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          max_animals: number | null
          name: string
          notes: string | null
          owner_id: string
          stall_location: string | null
          stall_size: number | null
          stall_type: string | null
          updated_at: string | null
        }
        Insert: {
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_animals?: number | null
          name: string
          notes?: string | null
          owner_id: string
          stall_location?: string | null
          stall_size?: number | null
          stall_type?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          max_animals?: number | null
          name?: string
          notes?: string | null
          owner_id?: string
          stall_location?: string | null
          stall_size?: number | null
          stall_type?: string | null
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
        Relationships: [
          {
            foreignKeyName: "feed_types_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          farm_id: string | null
          id: string
          invited_by: string | null
          role: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          farm_id?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          farm_id?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_count_details: {
        Row: {
          actual_weight_per_animal: number | null
          animal_type: string | null
          area_group_id: string | null
          area_id: string | null
          buy_price_per_animal: number | null
          count: number
          end_date: string | null
          expected_weight_per_animal: number | null
          id: string
          is_end_group: boolean | null
          is_start_group: boolean | null
          livestock_count_id: string
          sell_price_per_animal: number | null
          start_date: string
          start_weight_source_detail_id: string | null
        }
        Insert: {
          actual_weight_per_animal?: number | null
          animal_type?: string | null
          area_group_id?: string | null
          area_id?: string | null
          buy_price_per_animal?: number | null
          count: number
          end_date?: string | null
          expected_weight_per_animal?: number | null
          id?: string
          is_end_group?: boolean | null
          is_start_group?: boolean | null
          livestock_count_id: string
          sell_price_per_animal?: number | null
          start_date: string
          start_weight_source_detail_id?: string | null
        }
        Update: {
          actual_weight_per_animal?: number | null
          animal_type?: string | null
          area_group_id?: string | null
          area_id?: string | null
          buy_price_per_animal?: number | null
          count?: number
          end_date?: string | null
          expected_weight_per_animal?: number | null
          id?: string
          is_end_group?: boolean | null
          is_start_group?: boolean | null
          livestock_count_id?: string
          sell_price_per_animal?: number | null
          start_date?: string
          start_weight_source_detail_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestock_count_details_area_group_id_fkey"
            columns: ["area_group_id"]
            isOneToOne: false
            referencedRelation: "area_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_count_details_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_count_details_livestock_count_id_fkey"
            columns: ["livestock_count_id"]
            isOneToOne: false
            referencedRelation: "livestock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_count_details_start_weight_source_detail_id_fkey"
            columns: ["start_weight_source_detail_id"]
            isOneToOne: false
            referencedRelation: "livestock_count_details"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock_counts: {
        Row: {
          actual_weight_per_animal: number | null
          buy_price_per_animal: number | null
          created_at: string | null
          created_by: string
          created_date: string
          durchgang_name: string | null
          end_date: string | null
          expected_weight_per_animal: number | null
          farm_id: string
          feed_conversion_ratio: number | null
          id: string
          mortality_rate: number | null
          notes: string | null
          profit_loss: number | null
          revenue: number | null
          sell_price_per_animal: number | null
          slaughter_weight_kg: number | null
          start_date: string
          supplier_id: string | null
          total_feed_cost: number | null
          total_lifetime_days: number | null
        }
        Insert: {
          actual_weight_per_animal?: number | null
          buy_price_per_animal?: number | null
          created_at?: string | null
          created_by: string
          created_date: string
          durchgang_name?: string | null
          end_date?: string | null
          expected_weight_per_animal?: number | null
          farm_id: string
          feed_conversion_ratio?: number | null
          id?: string
          mortality_rate?: number | null
          notes?: string | null
          profit_loss?: number | null
          revenue?: number | null
          sell_price_per_animal?: number | null
          slaughter_weight_kg?: number | null
          start_date: string
          supplier_id?: string | null
          total_feed_cost?: number | null
          total_lifetime_days?: number | null
        }
        Update: {
          actual_weight_per_animal?: number | null
          buy_price_per_animal?: number | null
          created_at?: string | null
          created_by?: string
          created_date?: string
          durchgang_name?: string | null
          end_date?: string | null
          expected_weight_per_animal?: number | null
          farm_id?: string
          feed_conversion_ratio?: number | null
          id?: string
          mortality_rate?: number | null
          notes?: string | null
          profit_loss?: number | null
          revenue?: number | null
          sell_price_per_animal?: number | null
          slaughter_weight_kg?: number | null
          start_date?: string
          supplier_id?: string | null
          total_feed_cost?: number | null
          total_lifetime_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "livestock_counts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_counts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_configurations: {
        Row: {
          can_invite_users: boolean
          created_at: string | null
          description: string | null
          display_name: string
          has_advanced_analytics: boolean
          has_api_access: boolean
          has_audit_logs: boolean
          has_bulk_import: boolean
          has_custom_reports: boolean
          has_data_export: boolean
          has_priority_support: boolean
          id: string
          is_active: boolean
          max_dashboards_per_farm: number
          max_farms: number
          max_pivot_configs_per_farm: number
          max_storage_gb: number | null
          max_uploads_per_month: number | null
          max_users_per_farm: number
          monthly_price_cents: number | null
          plan_name: string
          sort_order: number | null
          stripe_product_id: string | null
          updated_at: string | null
          vault_secret_name: string | null
          yearly_price_cents: number | null
        }
        Insert: {
          can_invite_users?: boolean
          created_at?: string | null
          description?: string | null
          display_name: string
          has_advanced_analytics?: boolean
          has_api_access?: boolean
          has_audit_logs?: boolean
          has_bulk_import?: boolean
          has_custom_reports?: boolean
          has_data_export?: boolean
          has_priority_support?: boolean
          id?: string
          is_active?: boolean
          max_dashboards_per_farm?: number
          max_farms?: number
          max_pivot_configs_per_farm?: number
          max_storage_gb?: number | null
          max_uploads_per_month?: number | null
          max_users_per_farm?: number
          monthly_price_cents?: number | null
          plan_name: string
          sort_order?: number | null
          stripe_product_id?: string | null
          updated_at?: string | null
          vault_secret_name?: string | null
          yearly_price_cents?: number | null
        }
        Update: {
          can_invite_users?: boolean
          created_at?: string | null
          description?: string | null
          display_name?: string
          has_advanced_analytics?: boolean
          has_api_access?: boolean
          has_audit_logs?: boolean
          has_bulk_import?: boolean
          has_custom_reports?: boolean
          has_data_export?: boolean
          has_priority_support?: boolean
          id?: string
          is_active?: boolean
          max_dashboards_per_farm?: number
          max_farms?: number
          max_pivot_configs_per_farm?: number
          max_storage_gb?: number | null
          max_uploads_per_month?: number | null
          max_users_per_farm?: number
          monthly_price_cents?: number | null
          plan_name?: string
          sort_order?: number | null
          stripe_product_id?: string | null
          updated_at?: string | null
          vault_secret_name?: string | null
          yearly_price_cents?: number | null
        }
        Relationships: []
      }
      plan_violations: {
        Row: {
          action_attempted: string
          blocked_at: string | null
          details: Json | null
          feature_required: string | null
          id: string
          plan_type: string | null
          user_id: string | null
        }
        Insert: {
          action_attempted: string
          blocked_at?: string | null
          details?: Json | null
          feature_required?: string | null
          id?: string
          plan_type?: string | null
          user_id?: string | null
        }
        Update: {
          action_attempted?: string
          blocked_at?: string | null
          details?: Json | null
          feature_required?: string | null
          id?: string
          plan_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      price_tiers: {
        Row: {
          created_at: string | null
          created_by: string
          farm_id: string
          feed_type_id: string
          id: string
          notes: string | null
          price_per_unit: number
          supplier_id: string | null
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          farm_id: string
          feed_type_id: string
          id?: string
          notes?: string | null
          price_per_unit: number
          supplier_id?: string | null
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          farm_id?: string
          feed_type_id?: string
          id?: string
          notes?: string | null
          price_per_unit?: number
          supplier_id?: string | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tiers_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_tiers_feed_type_id_fkey"
            columns: ["feed_type_id"]
            isOneToOne: false
            referencedRelation: "feed_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_tiers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_pivot_configs: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string
          description: string | null
          farm_id: string
          id: string
          is_favorite: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          farm_id: string
          id?: string
          is_favorite?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          farm_id?: string
          id?: string
          is_favorite?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_pivot_configs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorship_inquiries: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          status: string
          stripe_coupon_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          stripe_sync_attempted_at: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          status?: string
          stripe_coupon_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          stripe_sync_attempted_at?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          status?: string
          stripe_coupon_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          stripe_sync_attempted_at?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_sync_settings: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string | null
          farm_id: string
          sync_from_all_farms: boolean | null
          sync_to_all_farms: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          farm_id: string
          sync_from_all_farms?: boolean | null
          sync_to_all_farms?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          farm_id?: string
          sync_from_all_farms?: boolean | null
          sync_to_all_farms?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sync_settings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          auto_sync_enabled: boolean | null
          city: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          created_by: string
          default_delivery_time_days: number | null
          delivery_terms: string | null
          email: string | null
          farm_id: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          minimum_order_quantity: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          street_address: string | null
          tax_number: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by: string
          default_delivery_time_days?: number | null
          delivery_terms?: string | null
          email?: string | null
          farm_id: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          minimum_order_quantity?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          tax_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          city?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string
          default_delivery_time_days?: number | null
          delivery_terms?: string | null
          email?: string | null
          farm_id?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          minimum_order_quantity?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          street_address?: string | null
          tax_number?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "uploads_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string | null
          display_name: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          phone_number: string | null
          postal_code: string | null
          privacy_accepted_at: string | null
          street_address: string | null
          stripe_customer_id: string | null
          terms_accepted_at: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone_number?: string | null
          postal_code?: string | null
          privacy_accepted_at?: string | null
          street_address?: string | null
          stripe_customer_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          phone_number?: string | null
          postal_code?: string | null
          privacy_accepted_at?: string | null
          street_address?: string | null
          stripe_customer_id?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      widget_templates: {
        Row: {
          category: string | null
          created_at: string | null
          default_config: Json
          default_height: number | null
          default_width: number | null
          description: string | null
          display_name: string
          id: string
          is_premium: boolean | null
          name: string
          preview_image: string | null
          widget_type: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_config: Json
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          display_name: string
          id?: string
          is_premium?: boolean | null
          name: string
          preview_image?: string | null
          widget_type: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_config?: Json
          default_height?: number | null
          default_width?: number | null
          description?: string | null
          display_name?: string
          id?: string
          is_premium?: boolean | null
          name?: string
          preview_image?: string | null
          widget_type?: string
        }
        Relationships: []
      }
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
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
