export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          id: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          type: string
          path: string | null
          session_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          path?: string | null
          session_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          path?: string | null
          session_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      editable_sections: {
        Row: {
          id: string
          key: string
          content_json: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          content_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          content_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          name: string
          quantity: number
          price_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string | null
          name: string
          quantity?: number
          price_cents: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          variant_id?: string | null
          name?: string
          quantity?: number
          price_cents?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          stripe_session_id: string | null
          stripe_payment_id: string | null
          stripe_payment_intent_id: string | null
          status: string
          email: string
          customer_name: string | null
          customer_phone: string | null
          shipping_address: Json | null
          subtotal_cents: number | null
          shipping_cents: number | null
          tax_cents: number | null
          total_cents: number
          currency: string
          fulfillment_status: string | null
          printify_order_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          stripe_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: string
          email: string
          customer_name?: string | null
          customer_phone?: string | null
          shipping_address?: Json | null
          subtotal_cents?: number | null
          shipping_cents?: number | null
          tax_cents?: number | null
          total_cents: number
          currency?: string
          fulfillment_status?: string | null
          printify_order_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          stripe_session_id?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent_id?: string | null
          status?: string
          email?: string
          customer_name?: string | null
          customer_phone?: string | null
          shipping_address?: Json | null
          subtotal_cents?: number | null
          shipping_cents?: number | null
          tax_cents?: number | null
          total_cents?: number
          currency?: string
          fulfillment_status?: string | null
          printify_order_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          product_id: string
          category_id: string
        }
        Insert: {
          product_id: string
          category_id: string
        }
        Update: {
          product_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          price_cents: number
          currency: string
          thumbnail_url: string
          images: string[]
          printify_id: string | null
          printify_shop_id: string | null
          active: boolean
          featured: boolean
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string
          price_cents: number
          currency?: string
          thumbnail_url?: string
          images?: string[]
          printify_id?: string | null
          printify_shop_id?: string | null
          active?: boolean
          featured?: boolean
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string
          price_cents?: number
          currency?: string
          thumbnail_url?: string
          images?: string[]
          printify_id?: string | null
          printify_shop_id?: string | null
          active?: boolean
          featured?: boolean
          category?: string | null
          publish_state?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          value: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price_cents: number
          printify_variant_id: string | null
          size: string | null
          color: string | null
          option_values: Json | null
          available: boolean | null
          stock: number
          preview_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku?: string | null
          price_cents: number
          printify_variant_id?: string | null
          size?: string | null
          color?: string | null
          option_values?: Json | null
          available?: boolean | null
          stock?: number
          preview_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string | null
          price_cents?: number
          printify_variant_id?: string | null
          size?: string | null
          color?: string | null
          option_values?: Json | null
          available?: boolean | null
          stock?: number
          preview_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      webhook_events: {
        Row: {
          id: string
          event_id: string
          event_type: string
          payload: Json | null
          processed: boolean | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          event_type: string
          payload?: Json | null
          processed?: boolean | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          event_type?: string
          payload?: Json | null
          processed?: boolean | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      verify_admin_key: {
        Args: { input_key: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
