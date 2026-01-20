// Database types for Harmonic Match
// Generated from Supabase schema

// ============================================================================
// ENUM TYPES
// ============================================================================

export type ConflictStyle =
  | "competing"
  | "collaborating"
  | "compromising"
  | "avoiding"
  | "accommodating";

export type MusicPersonalityType =
  | "explorer"
  | "loyalist"
  | "eclectic"
  | "mood_matcher"
  | "social_listener";

export type PersonalityFramework =
  | "big_five"
  | "mbti"
  | "attachment_style"
  | "love_language";

export type GenderType =
  | "male"
  | "female"
  | "non_binary"
  | "other"
  | "prefer_not_to_say";

// ============================================================================
// JSON FIELD TYPES
// ============================================================================

export interface PhotoJson {
  url: string;
  order: number;
  is_primary?: boolean;
}

export interface TopArtistJson {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  image_url?: string;
}

export interface AudioFeaturesAvgJson {
  acousticness?: number;
  danceability?: number;
  energy?: number;
  instrumentalness?: number;
  liveness?: number;
  loudness?: number;
  speechiness?: number;
  tempo?: number;
  valence?: number;
  mode?: number;
  time_signature?: number;
}

export interface ConflictAssessmentJson {
  competing_score: number;
  collaborating_score: number;
  compromising_score: number;
  avoiding_score: number;
  accommodating_score: number;
  completed_at: string;
}

export interface BigFiveScoresJson {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface MbtiScoresJson {
  type: string;
  ei_score: number;
  sn_score: number;
  tf_score: number;
  jp_score: number;
}

export interface AttachmentStyleScoresJson {
  style: "secure" | "anxious" | "avoidant" | "fearful";
  anxiety_score: number;
  avoidance_score: number;
}

export interface LoveLanguageScoresJson {
  primary: "words" | "acts" | "gifts" | "time" | "touch";
  secondary: "words" | "acts" | "gifts" | "time" | "touch";
  scores: {
    words_of_affirmation: number;
    acts_of_service: number;
    receiving_gifts: number;
    quality_time: number;
    physical_touch: number;
  };
}

export type PersonalityScoresJson =
  | BigFiveScoresJson
  | MbtiScoresJson
  | AttachmentStyleScoresJson
  | LoveLanguageScoresJson;

export interface SongShareJson {
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_name?: string;
  preview_url?: string;
  album_image_url?: string;
}

// ============================================================================
// TABLE ROW TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  age: number | null;
  gender: GenderType | null;
  location: string | null;
  bio: string | null;
  photos_json: PhotoJson[];
  created_at: string;
  updated_at: string;
}

export interface MusicProfile {
  id: string;
  user_id: string;
  spotify_connected: boolean;
  spotify_user_id: string | null;
  top_artists_json: TopArtistJson[];
  top_genres_json: string[];
  audio_features_avg_json: AudioFeaturesAvgJson;
  music_personality: MusicPersonalityType | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConflictStyleRecord {
  id: string;
  user_id: string;
  primary_style: ConflictStyle;
  secondary_style: ConflictStyle | null;
  assessment_json: ConflictAssessmentJson;
  created_at: string;
  updated_at: string;
}

export interface PersonalityAssessment {
  id: string;
  user_id: string;
  framework: PersonalityFramework;
  scores_json: PersonalityScoresJson;
  created_at: string;
}

export interface CompatibilityScore {
  id: string;
  user1_id: string;
  user2_id: string;
  music_score: number | null;
  conflict_score: number | null;
  personality_score: number | null;
  overall_score: number | null;
  calculated_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_liked: boolean;
  user2_liked: boolean;
  matched_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  song_share_json: SongShareJson | null;
  read_at: string | null;
  created_at: string;
}

export interface SharedPlaylist {
  id: string;
  match_id: string;
  spotify_playlist_id: string;
  name: string;
  created_at: string;
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export interface UserProfileInsert {
  user_id: string;
  display_name: string;
  age?: number | null;
  gender?: GenderType | null;
  location?: string | null;
  bio?: string | null;
  photos_json?: PhotoJson[];
}

export interface MusicProfileInsert {
  user_id: string;
  spotify_connected?: boolean;
  spotify_user_id?: string | null;
  top_artists_json?: TopArtistJson[];
  top_genres_json?: string[];
  audio_features_avg_json?: AudioFeaturesAvgJson;
  music_personality?: MusicPersonalityType | null;
  last_synced_at?: string | null;
}

export interface ConflictStyleInsert {
  user_id: string;
  primary_style: ConflictStyle;
  secondary_style?: ConflictStyle | null;
  assessment_json?: ConflictAssessmentJson;
}

export interface PersonalityAssessmentInsert {
  user_id: string;
  framework: PersonalityFramework;
  scores_json: PersonalityScoresJson;
}

export interface CompatibilityScoreInsert {
  user1_id: string;
  user2_id: string;
  music_score?: number | null;
  conflict_score?: number | null;
  personality_score?: number | null;
  overall_score?: number | null;
}

export interface MatchInsert {
  user1_id: string;
  user2_id: string;
  user1_liked?: boolean;
  user2_liked?: boolean;
}

export interface ConversationInsert {
  match_id: string;
}

export interface MessageInsert {
  conversation_id: string;
  sender_id: string;
  content: string;
  song_share_json?: SongShareJson | null;
}

export interface SharedPlaylistInsert {
  match_id: string;
  spotify_playlist_id: string;
  name: string;
}

// ============================================================================
// UPDATE TYPES (for updating existing records)
// ============================================================================

export interface UserProfileUpdate {
  display_name?: string;
  age?: number | null;
  gender?: GenderType | null;
  location?: string | null;
  bio?: string | null;
  photos_json?: PhotoJson[];
}

export interface MusicProfileUpdate {
  spotify_connected?: boolean;
  spotify_user_id?: string | null;
  top_artists_json?: TopArtistJson[];
  top_genres_json?: string[];
  audio_features_avg_json?: AudioFeaturesAvgJson;
  music_personality?: MusicPersonalityType | null;
  last_synced_at?: string | null;
}

export interface ConflictStyleUpdate {
  primary_style?: ConflictStyle;
  secondary_style?: ConflictStyle | null;
  assessment_json?: ConflictAssessmentJson;
}

export interface MatchUpdate {
  user1_liked?: boolean;
  user2_liked?: boolean;
}

export interface MessageUpdate {
  read_at?: string | null;
}

// ============================================================================
// DATABASE TYPE DEFINITION (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      music_profiles: {
        Row: MusicProfile;
        Insert: MusicProfileInsert;
        Update: MusicProfileUpdate;
      };
      conflict_styles: {
        Row: ConflictStyleRecord;
        Insert: ConflictStyleInsert;
        Update: ConflictStyleUpdate;
      };
      personality_assessments: {
        Row: PersonalityAssessment;
        Insert: PersonalityAssessmentInsert;
        Update: Partial<PersonalityAssessmentInsert>;
      };
      compatibility_scores: {
        Row: CompatibilityScore;
        Insert: CompatibilityScoreInsert;
        Update: Partial<CompatibilityScoreInsert>;
      };
      matches: {
        Row: Match;
        Insert: MatchInsert;
        Update: MatchUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: never;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
      shared_playlists: {
        Row: SharedPlaylist;
        Insert: SharedPlaylistInsert;
        Update: Partial<SharedPlaylistInsert>;
      };
    };
    Enums: {
      conflict_style: ConflictStyle;
      music_personality_type: MusicPersonalityType;
      personality_framework: PersonalityFramework;
      gender_type: GenderType;
    };
  };
}
