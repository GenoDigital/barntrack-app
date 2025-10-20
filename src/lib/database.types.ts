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
      plan_configurations: {
        Row: {
          max_dashboards_per_farm: number
        }
      }
    }
    Functions: {
      can_user_create_dashboard: {
        Args: { p_farm_id: string }
        Returns: {
          can_create: boolean
          current_count: number
          max_allowed: number
          message: string
        }[]
      }
    }
  }
}
