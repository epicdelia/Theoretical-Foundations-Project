export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type FriendStatus = "pending" | "accepted" | "blocked";
export type InviteStatus = "pending" | "accepted" | "expired";
export type ProposalStatus = "pending" | "accepted" | "rejected" | "expired";
export type RelationshipStatus = "dating" | "engaged" | "married" | "broken_up";
export type BetStatus =
  | "pending"
  | "active"
  | "won"
  | "lost"
  | "cancelled"
  | "refunded";
export type PayoutType =
  | "bet_win"
  | "matchmaker_bonus"
  | "milestone_bonus"
  | "refund";
export type MilestoneType =
  | "first_date"
  | "one_month"
  | "three_months"
  | "six_months"
  | "one_year"
  | "engaged"
  | "married";
export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "match_proposal"
  | "match_accepted"
  | "match_rejected"
  | "bet_placed"
  | "bet_won"
  | "bet_lost"
  | "milestone_reached"
  | "payout_processed";

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          matchmaker_score: number;
          total_earnings: number;
          matches_made: number;
          successful_matches: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          matchmaker_score?: number;
          total_earnings?: number;
          matches_made?: number;
          successful_matches?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          matchmaker_score?: number;
          total_earnings?: number;
          matches_made?: number;
          successful_matches?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      friend_connections: {
        Row: {
          id: string;
          user_id: string;
          friend_user_id: string;
          status: FriendStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_user_id: string;
          status?: FriendStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_user_id?: string;
          status?: FriendStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friend_connections_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "friend_connections_friend_user_id_fkey";
            columns: ["friend_user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      match_proposals: {
        Row: {
          id: string;
          matchmaker_id: string;
          person1_id: string;
          person2_id: string;
          pitch_text: string;
          status: ProposalStatus;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          matchmaker_id: string;
          person1_id: string;
          person2_id: string;
          pitch_text: string;
          status?: ProposalStatus;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          matchmaker_id?: string;
          person1_id?: string;
          person2_id?: string;
          pitch_text?: string;
          status?: ProposalStatus;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_proposals_matchmaker_id_fkey";
            columns: ["matchmaker_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "match_proposals_person1_id_fkey";
            columns: ["person1_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "match_proposals_person2_id_fkey";
            columns: ["person2_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          proposal_id: string;
          person1_accepted: boolean;
          person2_accepted: boolean;
          started_dating_at: string | null;
          relationship_status: RelationshipStatus | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: string;
          person1_accepted?: boolean;
          person2_accepted?: boolean;
          started_dating_at?: string | null;
          relationship_status?: RelationshipStatus | null;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: string;
          person1_accepted?: boolean;
          person2_accepted?: boolean;
          started_dating_at?: string | null;
          relationship_status?: RelationshipStatus | null;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_proposal_id_fkey";
            columns: ["proposal_id"];
            referencedRelation: "match_proposals";
            referencedColumns: ["id"];
          }
        ];
      };
      bets: {
        Row: {
          id: string;
          match_id: string;
          bettor_id: string;
          predicted_duration_months: number;
          amount: number;
          payout_multiplier: number;
          status: BetStatus;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          bettor_id: string;
          predicted_duration_months: number;
          amount: number;
          payout_multiplier: number;
          status?: BetStatus;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          bettor_id?: string;
          predicted_duration_months?: number;
          amount?: number;
          payout_multiplier?: number;
          status?: BetStatus;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bets_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bets_bettor_id_fkey";
            columns: ["bettor_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      payouts: {
        Row: {
          id: string;
          bet_id: string | null;
          user_id: string;
          amount: number;
          type: PayoutType;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bet_id?: string | null;
          user_id: string;
          amount: number;
          type: PayoutType;
          processed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          bet_id?: string | null;
          user_id?: string;
          amount?: number;
          type?: PayoutType;
          processed_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_bet_id_fkey";
            columns: ["bet_id"];
            referencedRelation: "bets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payouts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      milestones: {
        Row: {
          id: string;
          match_id: string;
          milestone_type: MilestoneType;
          verified_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          milestone_type: MilestoneType;
          verified_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          milestone_type?: MilestoneType;
          verified_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          content: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          content?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          content?: Json;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      wallet: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          pending_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          pending_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          pending_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      friend_invites: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_email: string;
          invite_code: string;
          status: InviteStatus;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_email: string;
          invite_code: string;
          status?: InviteStatus;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string;
          invitee_email?: string;
          invite_code?: string;
          status?: InviteStatus;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friend_invites_inviter_id_fkey";
            columns: ["inviter_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      friend_status: FriendStatus;
      invite_status: InviteStatus;
      proposal_status: ProposalStatus;
      relationship_status: RelationshipStatus;
      bet_status: BetStatus;
      payout_type: PayoutType;
      milestone_type: MilestoneType;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// Convenience type aliases
export type UserProfile = Tables<"user_profiles">;
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;

export type FriendConnection = Tables<"friend_connections">;
export type FriendConnectionInsert = TablesInsert<"friend_connections">;
export type FriendConnectionUpdate = TablesUpdate<"friend_connections">;

export type MatchProposal = Tables<"match_proposals">;
export type MatchProposalInsert = TablesInsert<"match_proposals">;
export type MatchProposalUpdate = TablesUpdate<"match_proposals">;

export type Match = Tables<"matches">;
export type MatchInsert = TablesInsert<"matches">;
export type MatchUpdate = TablesUpdate<"matches">;

export type Bet = Tables<"bets">;
export type BetInsert = TablesInsert<"bets">;
export type BetUpdate = TablesUpdate<"bets">;

export type Payout = Tables<"payouts">;
export type PayoutInsert = TablesInsert<"payouts">;
export type PayoutUpdate = TablesUpdate<"payouts">;

export type Milestone = Tables<"milestones">;
export type MilestoneInsert = TablesInsert<"milestones">;
export type MilestoneUpdate = TablesUpdate<"milestones">;

export type Notification = Tables<"notifications">;
export type NotificationInsert = TablesInsert<"notifications">;
export type NotificationUpdate = TablesUpdate<"notifications">;

export type Wallet = Tables<"wallet">;
export type WalletInsert = TablesInsert<"wallet">;
export type WalletUpdate = TablesUpdate<"wallet">;

export type FriendInvite = Tables<"friend_invites">;
export type FriendInviteInsert = TablesInsert<"friend_invites">;
export type FriendInviteUpdate = TablesUpdate<"friend_invites">;
