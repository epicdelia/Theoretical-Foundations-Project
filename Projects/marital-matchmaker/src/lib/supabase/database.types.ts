export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users_extended: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          age: number | null;
          gender: string | null;
          location: string | null;
          bio: string | null;
          photos_json: Json;
          intent_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          age?: number | null;
          gender?: string | null;
          location?: string | null;
          bio?: string | null;
          photos_json?: Json;
          intent_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          age?: number | null;
          gender?: string | null;
          location?: string | null;
          bio?: string | null;
          photos_json?: Json;
          intent_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_extended_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      compatibility_dimensions: {
        Row: {
          id: string;
          name: string;
          weight: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          weight?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          weight?: number;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quiz_questions: {
        Row: {
          id: string;
          dimension_id: string;
          question_text: string;
          answer_options_json: Json;
          scoring_logic: Json | null;
          question_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          dimension_id: string;
          question_text: string;
          answer_options_json: Json;
          scoring_logic?: Json | null;
          question_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          dimension_id?: string;
          question_text?: string;
          answer_options_json?: Json;
          scoring_logic?: Json | null;
          question_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_dimension_id_fkey";
            columns: ["dimension_id"];
            isOneToOne: false;
            referencedRelation: "compatibility_dimensions";
            referencedColumns: ["id"];
          }
        ];
      };
      compatibility_quiz_responses: {
        Row: {
          id: string;
          user_id: string;
          dimension: string;
          question_id: string;
          answer_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dimension: string;
          question_id: string;
          answer_value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dimension?: string;
          question_id?: string;
          answer_value?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compatibility_quiz_responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compatibility_quiz_responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          }
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          min_age: number;
          max_age: number;
          preferred_location: string | null;
          dealbreakers_json: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_age?: number;
          max_age?: number;
          preferred_location?: string | null;
          dealbreakers_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          min_age?: number;
          max_age?: number;
          preferred_location?: string | null;
          dealbreakers_json?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      intent_responses: {
        Row: {
          id: string;
          user_id: string;
          marriage_timeline: string | null;
          relationship_history: string | null;
          what_seeking: string | null;
          marriage_meaning: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          marriage_timeline?: string | null;
          relationship_history?: string | null;
          what_seeking?: string | null;
          marriage_meaning?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          marriage_timeline?: string | null;
          relationship_history?: string | null;
          what_seeking?: string | null;
          marriage_meaning?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "intent_responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          compatibility_score: number | null;
          dimension_scores_json: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          compatibility_score?: number | null;
          dimension_scores_json?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          compatibility_score?: number | null;
          dimension_scores_json?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey";
            columns: ["user1_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_user2_id_fkey";
            columns: ["user2_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      likes: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      conversations: {
        Row: {
          id: string;
          match_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Convenience type aliases
export type UserExtended = Tables<"users_extended">;
export type CompatibilityDimension = Tables<"compatibility_dimensions">;
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizResponse = Tables<"compatibility_quiz_responses">;
export type UserPreferences = Tables<"user_preferences">;
export type IntentResponse = Tables<"intent_responses">;
export type Match = Tables<"matches">;
export type Like = Tables<"likes">;
export type Block = Tables<"blocks">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

// Dimension names as a union type
export type DimensionName =
  | "values"
  | "goals"
  | "communication"
  | "lifestyle"
  | "finance";

// Match status options
export type MatchStatus = "pending" | "accepted" | "declined" | "expired";
