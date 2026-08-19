export type ComparativeRating = 'easier' | 'as_graded' | 'harder';

export interface Gym {
  id: string;
  name: string;
  location: string;
  created_at: string;
  wall_count?: number;
  climb_count?: number;
}

export interface Wall {
  id: string;
  gym_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Climb {
  id: string;
  gym_id: string;
  wall_id: string;
  name: string;
  color: string;
  discipline: 'bouldering' | 'sport' | 'trad';
  gym_grade: string;
  setter_notes?: string;
  active_from: string;
  active_until?: string | null;
  is_active: boolean;
  qr_code_token: string;
  created_at: string;
  // joined fields
  gym_name?: string;
  wall_name?: string;
  rating_count?: number;
  avg_stars?: number;
  normalized_score?: number;
  comment_summary?: string;
}

export interface Rating {
  id: string;
  climb_id: string;
  user_id?: string | null;
  user_display_name?: string;
  comparative_rating: ComparativeRating;
  quality_stars: number; // 1 to 5
  comment?: string;
  photo_url?: string;
  is_spam: boolean;
  spam_reason?: string;
  created_at: string;
}

export type UserRole = 'climber' | 'setter' | 'owner';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role?: UserRole;
  home_gym_id?: string | null;
  created_at: string;
}

export interface GymNormalizationStats {
  gym_id: string;
  gym_name: string;
  total_climbs: number;
  total_ratings: number;
  grading_bias: number; // e.g. +0.4 means gym grades hard/soft relative to baseline
  grading_bias_label: string; // 'Soft (-0.4 grades)', 'Accurate', 'Stiff (+0.5 grades)'
  avg_rating_offset: number; // calculated from comparative ratings
}

export interface RatingSubmitPayload {
  climb_id: string;
  user_id?: string | null;
  comparative_rating: ComparativeRating;
  quality_stars: number;
  comment?: string;
  photo_url?: string;
}

export type ChallengeType = 'speed' | 'fewest_holds';

export interface ChallengeAttempt {
  id: string;
  climb_id: string;
  user_id?: string | null;
  user_display_name: string;
  challenge_type: ChallengeType;
  value: number;
  video_url?: string;
  created_at: string;
}

export interface ChallengeSubmitPayload {
  climb_id: string;
  user_id?: string | null;
  user_display_name?: string;
  challenge_type: ChallengeType;
  value: number;
  video_url?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_display_name: string;
  value: number;
  climb_id?: string;
  climb_name?: string;
  gym_name?: string;
  created_at: string;
}
