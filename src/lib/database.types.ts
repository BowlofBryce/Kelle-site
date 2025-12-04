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
          created_at?: string
          updated_at?: string
        }
      }
      variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string | null
          price_cents: number
          printify_variant_id: string | null
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
          stock?: number
          preview_url?: string | null
          created_at?: string
        }
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
      }
      orders: {
        Row: {
          id: string
          stripe_payment_id: string | null
          status: string
          email: string
          total_cents: number
          currency: string
          printify_order_id: string | null
          customer_name: string | null
          shipping_address: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          stripe_payment_id?: string | null
          status?: string
          email: string
          total_cents: number
          currency?: string
          printify_order_id?: string | null
          customer_name?: string | null
          shipping_address?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          stripe_payment_id?: string | null
          status?: string
          email?: string
          total_cents?: number
          currency?: string
          printify_order_id?: string | null
          customer_name?: string | null
          shipping_address?: Json | null
          created_at?: string
        }
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
      }
      editable_sections: {
        Row: {
          id: string
          key: string
          content_json: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          content_json?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          content_json?: Json
          updated_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          type: string
          path: string | null
          product_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          path?: string | null
          product_id?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          path?: string | null
          product_id?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
