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
      analytics: {
        Row: {
          advertising_breakdown: Json | null
          created_at: string | null
          data: Json
          date_from: string
          date_to: string
          deductions: Json | null
          deductions_timeline: Json | null
          id: string
          penalties: Json | null
          product_advertising_data: Json | null
          returns: Json | null
          store_id: string
        }
        Insert: {
          advertising_breakdown?: Json | null
          created_at?: string | null
          data: Json
          date_from: string
          date_to: string
          deductions?: Json | null
          deductions_timeline?: Json | null
          id?: string
          penalties?: Json | null
          product_advertising_data?: Json | null
          returns?: Json | null
          store_id: string
        }
        Update: {
          advertising_breakdown?: Json | null
          created_at?: string | null
          data?: Json
          date_from?: string
          date_to?: string
          deductions?: Json | null
          deductions_timeline?: Json | null
          id?: string
          penalties?: Json | null
          product_advertising_data?: Json | null
          returns?: Json | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_price: {
        Row: {
          avg_cost_price: number
          created_at: string | null
          id: string
          last_update_date: string
          store_id: string
          total_cost_price: number
          total_sold_items: number
        }
        Insert: {
          avg_cost_price: number
          created_at?: string | null
          id?: string
          last_update_date: string
          store_id: string
          total_cost_price: number
          total_sold_items: number
        }
        Update: {
          avg_cost_price?: number
          created_at?: string | null
          id?: string
          last_update_date?: string
          store_id?: string
          total_cost_price?: number
          total_sold_items?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_price_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          date_from: string
          date_to: string
          id: string
          orders: Json
          region_distribution: Json
          store_id: string
          warehouse_distribution: Json
        }
        Insert: {
          created_at?: string | null
          date_from: string
          date_to: string
          id?: string
          orders: Json
          region_distribution: Json
          store_id: string
          warehouse_distribution: Json
        }
        Update: {
          created_at?: string | null
          date_from?: string
          date_to?: string
          id?: string
          orders?: Json
          region_distribution?: Json
          store_id?: string
          warehouse_distribution?: Json
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_date: string
          payment_method: string | null
          status: string | null
          subscription_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string | null
          subscription_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string | null
          subscription_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_advertising: {
        Row: {
          created_at: string | null
          id: string
          product_advertising_data: Json
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_advertising_data: Json
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_advertising_data?: Json
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_advertising_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_advertising_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          club_price: number | null
          cost_price: number | null
          created_at: string | null
          discounted_price: number | null
          expenses: Json | null
          id: string
          nm_id: number
          photos: Json | null
          price: number | null
          quantity: number | null
          sales_data: Json | null
          storage_data: Json | null
          store_id: string
          subject: string | null
          subject_name: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          vendor_code: string | null
        }
        Insert: {
          brand?: string | null
          club_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          discounted_price?: number | null
          expenses?: Json | null
          id?: string
          nm_id: number
          photos?: Json | null
          price?: number | null
          quantity?: number | null
          sales_data?: Json | null
          storage_data?: Json | null
          store_id: string
          subject?: string | null
          subject_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          vendor_code?: string | null
        }
        Update: {
          brand?: string | null
          club_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          discounted_price?: number | null
          expenses?: Json | null
          id?: string
          nm_id?: number
          photos?: Json | null
          price?: number | null
          quantity?: number | null
          sales_data?: Json | null
          storage_data?: Json | null
          store_id?: string
          subject?: string | null
          subject_name?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          email: string
          id: string
          last_login: string | null
          name: string | null
          phone: string | null
          registered_at: string | null
          role: string | null
          status: string | null
          store_count: number | null
          subscription_expiry: string | null
          subscription_type: string | null
        }
        Insert: {
          company?: string | null
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          registered_at?: string | null
          role?: string | null
          status?: string | null
          store_count?: number | null
          subscription_expiry?: string | null
          subscription_type?: string | null
        }
        Update: {
          company?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          phone?: string | null
          registered_at?: string | null
          role?: string | null
          status?: string | null
          store_count?: number | null
          subscription_expiry?: string | null
          subscription_type?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string | null
          date_from: string
          date_to: string
          id: string
          sales: Json
          store_id: string
        }
        Insert: {
          created_at?: string | null
          date_from: string
          date_to: string
          id?: string
          sales: Json
          store_id: string
        }
        Update: {
          created_at?: string | null
          date_from?: string
          date_to?: string
          id?: string
          sales?: Json
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_stats: {
        Row: {
          created_at: string | null
          data: Json
          date_from: string
          date_to: string
          id: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          date_from: string
          date_to: string
          id?: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          date_from?: string
          date_to?: string
          id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_stats_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_selected: boolean | null
          last_fetch_date: string | null
          marketplace: string
          name: string
          store_id: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          last_fetch_date?: string | null
          marketplace: string
          name: string
          store_id: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          last_fetch_date?: string | null
          marketplace?: string
          name?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_coefficients: {
        Row: {
          allow_unload: boolean | null
          coefficient: number
          created_at: string | null
          data: Json
          date: string
          id: string
          store_id: string
          warehouse_id: number
          warehouse_name: string
        }
        Insert: {
          allow_unload?: boolean | null
          coefficient: number
          created_at?: string | null
          data: Json
          date: string
          id?: string
          store_id: string
          warehouse_id: number
          warehouse_name: string
        }
        Update: {
          allow_unload?: boolean | null
          coefficient?: number
          created_at?: string | null
          data?: Json
          date?: string
          id?: string
          store_id?: string
          warehouse_id?: number
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_coefficients_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_remains: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          nm_id: number
          quantity: number
          store_id: string
          warehouse_name: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          nm_id: number
          quantity: number
          store_id: string
          warehouse_name: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          nm_id?: number
          quantity?: number
          store_id?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_remains_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
