/**
 * Database types for Urban Destiny
 * Generated from Supabase schema
 */

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
      cities: {
        Row: {
          id: string
          name: string
          country: string
          population: number
          cost_index: number
          career_score: number
          lifestyle_score: number
          happiness_index: number
          climate: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          population: number
          cost_index: number
          career_score: number
          lifestyle_score: number
          happiness_index: number
          climate: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          population?: number
          cost_index?: number
          career_score?: number
          lifestyle_score?: number
          happiness_index?: number
          climate?: string
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_metrics: {
        Row: {
          id: string
          city_id: string
          metric_type: string
          value: number
          year: number
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          city_id: string
          metric_type: string
          value: number
          year: number
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          metric_type?: string
          value?: number
          year?: number
          source?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_metrics_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_categories: {
        Row: {
          id: string
          name: AssessmentCategoryName
          description: string
          icon: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: AssessmentCategoryName
          description: string
          icon: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: AssessmentCategoryName
          description?: string
          icon?: string
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          id: string
          category_id: string
          question_text: string
          question_order: number
          min_label: string
          max_label: string
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          question_text: string
          question_order?: number
          min_label?: string
          max_label?: string
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          question_text?: string
          question_order?: number
          min_label?: string
          max_label?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "assessment_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          current_city: string | null
          assessment_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_city?: string | null
          assessment_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_city?: string | null
          assessment_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_responses: {
        Row: {
          id: string
          user_id: string
          category: string
          question_id: string
          answer_value: number
          weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          question_id: string
          answer_value: number
          weight?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          question_id?: string
          answer_value?: number
          weight?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      city_matches: {
        Row: {
          id: string
          user_id: string
          city_id: string
          overall_score: number
          dimension_scores_json: DimensionScores
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          city_id: string
          overall_score: number
          dimension_scores_json?: DimensionScores
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          city_id?: string
          overall_score?: number
          dimension_scores_json?: DimensionScores
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_matches_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_cities: {
        Row: {
          id: string
          user_id: string
          city_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          city_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          city_id?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_cities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_cities_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          }
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
  }
}

// Custom types for the application

export type AssessmentCategoryName = 'career' | 'lifestyle' | 'cost' | 'happiness'

export interface DimensionScores {
  career?: number
  lifestyle?: number
  cost?: number
  happiness?: number
}

// Table row types (convenience aliases)
export type City = Database['public']['Tables']['cities']['Row']
export type CityInsert = Database['public']['Tables']['cities']['Insert']
export type CityUpdate = Database['public']['Tables']['cities']['Update']

export type CityMetric = Database['public']['Tables']['city_metrics']['Row']
export type CityMetricInsert = Database['public']['Tables']['city_metrics']['Insert']
export type CityMetricUpdate = Database['public']['Tables']['city_metrics']['Update']

export type AssessmentCategory = Database['public']['Tables']['assessment_categories']['Row']
export type AssessmentCategoryInsert = Database['public']['Tables']['assessment_categories']['Insert']
export type AssessmentCategoryUpdate = Database['public']['Tables']['assessment_categories']['Update']

export type AssessmentQuestion = Database['public']['Tables']['assessment_questions']['Row']
export type AssessmentQuestionInsert = Database['public']['Tables']['assessment_questions']['Insert']
export type AssessmentQuestionUpdate = Database['public']['Tables']['assessment_questions']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export type AssessmentResponse = Database['public']['Tables']['assessment_responses']['Row']
export type AssessmentResponseInsert = Database['public']['Tables']['assessment_responses']['Insert']
export type AssessmentResponseUpdate = Database['public']['Tables']['assessment_responses']['Update']

export type CityMatch = Database['public']['Tables']['city_matches']['Row']
export type CityMatchInsert = Database['public']['Tables']['city_matches']['Insert']
export type CityMatchUpdate = Database['public']['Tables']['city_matches']['Update']

export type SavedCity = Database['public']['Tables']['saved_cities']['Row']
export type SavedCityInsert = Database['public']['Tables']['saved_cities']['Insert']
export type SavedCityUpdate = Database['public']['Tables']['saved_cities']['Update']

// Extended types with relations
export interface CityWithMetrics extends City {
  metrics: CityMetric[]
}

export interface AssessmentCategoryWithQuestions extends AssessmentCategory {
  questions: AssessmentQuestion[]
}

export interface CityMatchWithCity extends CityMatch {
  city: City
}

export interface SavedCityWithCity extends SavedCity {
  city: City
}

// Metric types for type safety
export type MetricType =
  | 'avg_salary'
  | 'rent_1br'
  | 'tech_jobs'
  | 'restaurants_per_capita'
  | 'green_space_pct'

// Climate types
export type ClimateType =
  | 'Humid Continental'
  | 'Mediterranean'
  | 'Oceanic'
  | 'Humid Subtropical'
  | 'Tropical'
  | 'Semi-Arid'
  | 'Subtropical Highland'
  | 'Desert'
