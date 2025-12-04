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
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_tests: {
        Row: {
          id: string
          user_id: string
          service_name: string
          api_endpoint: string
          test_status: 'success' | 'failed' | 'pending'
          response_time: number | null
          response_body: string | null
          response_status: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_name: string
          api_endpoint: string
          test_status?: 'success' | 'failed' | 'pending'
          response_time?: number | null
          response_body?: string | null
          response_status?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_name?: string
          api_endpoint?: string
          test_status?: 'success' | 'failed' | 'pending'
          response_time?: number | null
          response_body?: string | null
          response_status?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      test_history: {
        Row: {
          id: string
          test_id: string
          user_id: string
          request_params: Json | null
          request_headers: Json | null
          request_method: string
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          user_id: string
          request_params?: Json | null
          request_headers?: Json | null
          request_method: string
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          user_id?: string
          request_params?: Json | null
          request_headers?: Json | null
          request_method?: string
          created_at?: string
        }
      }
      api_documentation: {
        Row: {
          id: string
          service_name: string
          documentation_url: string | null
          endpoints: Json | null
          auth_methods: Json | null
          last_scanned: string | null
        }
        Insert: {
          id?: string
          service_name: string
          documentation_url?: string | null
          endpoints?: Json | null
          auth_methods?: Json | null
          last_scanned?: string | null
        }
        Update: {
          id?: string
          service_name?: string
          documentation_url?: string | null
          endpoints?: Json | null
          auth_methods?: Json | null
          last_scanned?: string | null
        }
      }
    }
  }
}
