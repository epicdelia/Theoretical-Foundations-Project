export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          breakup_type: string | null;
          time_since: string | null;
          pathway_id: string | null;
          show_days_counter: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          breakup_type?: string | null;
          time_since?: string | null;
          pathway_id?: string | null;
          show_days_counter?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          breakup_type?: string | null;
          time_since?: string | null;
          pathway_id?: string | null;
          show_days_counter?: boolean;
          created_at?: string;
        };
      };
      pathways: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          duration_days: number;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          duration_days?: number;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          duration_days?: number;
          icon?: string | null;
          created_at?: string;
        };
      };
      pathway_content: {
        Row: {
          id: string;
          pathway_id: string;
          day_number: number;
          type: string;
          title: string;
          content: string | null;
          exercise_prompt: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pathway_id: string;
          day_number: number;
          type: string;
          title: string;
          content?: string | null;
          exercise_prompt?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pathway_id?: string;
          day_number?: number;
          type?: string;
          title?: string;
          content?: string | null;
          exercise_prompt?: string | null;
          created_at?: string;
        };
      };
      cohorts: {
        Row: {
          id: string;
          pathway_id: string;
          start_date: string;
          max_members: number;
          breakup_type_match: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pathway_id: string;
          start_date: string;
          max_members?: number;
          breakup_type_match?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pathway_id?: string;
          start_date?: string;
          max_members?: number;
          breakup_type_match?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      cohort_members: {
        Row: {
          id: string;
          cohort_id: string;
          user_id: string;
          anonymous_name: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          user_id: string;
          anonymous_name: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          cohort_id?: string;
          user_id?: string;
          anonymous_name?: string;
          joined_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          pathway_id: string;
          current_day: number;
          recovery_score: number;
          streak_count: number;
          milestones_json: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pathway_id: string;
          current_day?: number;
          recovery_score?: number;
          streak_count?: number;
          milestones_json?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pathway_id?: string;
          current_day?: number;
          recovery_score?: number;
          streak_count?: number;
          milestones_json?: Json;
          updated_at?: string;
          created_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          mood_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          mood_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          mood_score?: number | null;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          points: number;
          criteria_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          points?: number;
          criteria_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          points?: number;
          criteria_type?: string;
          created_at?: string;
        };
      };
      therapist_directory: {
        Row: {
          id: string;
          name: string;
          specialty: string | null;
          location: string | null;
          website_url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialty?: string | null;
          location?: string | null;
          website_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialty?: string | null;
          location?: string | null;
          website_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      content_library: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          content_url: string | null;
          is_premium: boolean;
          pathway_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          content_url?: string | null;
          is_premium?: boolean;
          pathway_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          content_url?: string | null;
          is_premium?: boolean;
          pathway_id?: string | null;
          created_at?: string;
        };
      };
      encouragements: {
        Row: {
          id: string;
          cohort_id: string;
          from_user_id: string;
          to_user_id: string;
          feed_item_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cohort_id: string;
          from_user_id: string;
          to_user_id: string;
          feed_item_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cohort_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          feed_item_type?: string | null;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience type aliases
export type UserProfile = Tables<"user_profiles">;
export type Pathway = Tables<"pathways">;
export type PathwayContent = Tables<"pathway_content">;
export type Cohort = Tables<"cohorts">;
export type CohortMember = Tables<"cohort_members">;
export type UserProgress = Tables<"user_progress">;
export type JournalEntry = Tables<"journal_entries">;
export type Milestone = Tables<"milestones">;
export type TherapistDirectory = Tables<"therapist_directory">;
export type ContentLibrary = Tables<"content_library">;
export type Encouragement = Tables<"encouragements">;
export type Bookmark = Tables<"bookmarks">;
