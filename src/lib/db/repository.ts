import { Gym, Wall, Climb, Rating, RatingSubmitPayload, GymNormalizationStats, ChallengeAttempt, ChallengeSubmitPayload, ChallengeType, LeaderboardEntry } from "@/types";
import { INITIAL_GYMS, INITIAL_WALLS, INITIAL_CLIMBS, INITIAL_RATINGS, INITIAL_CHALLENGE_ATTEMPTS } from "./mockData";
import { calculateBradleyTerryNormalization, calculateSimpleAverageOffset } from "../algorithms/normalization";
import { createClient } from "../supabase/client";
import { checkSpam } from "../ai/spamFilter";

const STORAGE_KEYS = {
  GYMS: 'tca_gyms_v1',
  WALLS: 'tca_walls_v1',
  CLIMBS: 'tca_climbs_v1',
  RATINGS: 'tca_ratings_v1',
  CHALLENGE_ATTEMPTS: 'tca_challenge_attempts_v1',
};

function isSupabaseAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Memory / LocalStorage Helper
function getStored<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultData;
  } catch (e) {
    console.warn(`Error reading localStorage ${key}`, e);
    return defaultData;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing localStorage ${key}`, e);
  }
}

export class DataRepository {
  // Raw gym fetch with no derived counts — used internally to avoid recursing into getClimbs().
  private static async getRawGyms(): Promise<Gym[]> {
    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('gyms').select('*').order('name');
        if (!error && data) return data as Gym[];
      }
    }
    return getStored<Gym[]>(STORAGE_KEYS.GYMS, INITIAL_GYMS);
  }

  // Raw climb fetch with no rating stats/normalization attached — used internally to avoid recursing into getGyms().
  private static async getRawClimbs(filters?: { gym_id?: string; wall_id?: string }): Promise<Climb[]> {
    let climbsList: Climb[] = [];

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('climbs').select('*, gyms(name), walls(name)');
        if (filters?.gym_id) query = query.eq('gym_id', filters.gym_id);
        if (filters?.wall_id) query = query.eq('wall_id', filters.wall_id);
        const { data, error } = await query;
        if (!error && data) {
          climbsList = data.map((c: any) => ({
            ...c,
            gym_name: c.gyms?.name,
            wall_name: c.walls?.name
          }));
        }
      }
    }

    if (climbsList.length === 0) {
      climbsList = getStored<Climb[]>(STORAGE_KEYS.CLIMBS, INITIAL_CLIMBS);
      if (filters?.gym_id) climbsList = climbsList.filter(c => c.gym_id === filters.gym_id);
      if (filters?.wall_id) climbsList = climbsList.filter(c => c.wall_id === filters.wall_id);
    }

    return climbsList;
  }

  // 1. GYMS
  static async getGyms(): Promise<Gym[]> {
    const gyms = await this.getRawGyms();
    const climbs = await this.getRawClimbs();
    const walls = await this.getWalls();

    return gyms.map(gym => ({
      ...gym,
      wall_count: walls.filter(w => w.gym_id === gym.id).length,
      climb_count: climbs.filter(c => c.gym_id === gym.id).length,
    }));
  }

  static async getGymById(id: string): Promise<Gym | null> {
    const gyms = await this.getGyms();
    return gyms.find(g => g.id === id) || null;
  }

  static async createGym(gym: Omit<Gym, 'id' | 'created_at'>): Promise<Gym> {
    const newGym: Gym = {
      ...gym,
      id: `gym-${Date.now()}`,
      created_at: new Date().toISOString(),
      wall_count: 0,
      climb_count: 0,
    };

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('gyms').insert([{
          name: gym.name,
          location: gym.location
        }]).select().single();
        if (!error && data) return data as Gym;
      }
    }

    const currentGyms = getStored<Gym[]>(STORAGE_KEYS.GYMS, INITIAL_GYMS);
    const updated = [newGym, ...currentGyms];
    setStored(STORAGE_KEYS.GYMS, updated);
    return newGym;
  }

  // 2. WALLS
  static async getWalls(gymId?: string): Promise<Wall[]> {
    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('walls').select('*');
        if (gymId) query = query.eq('gym_id', gymId);
        const { data, error } = await query;
        if (!error && data) return data as Wall[];
      }
    }

    const walls = getStored<Wall[]>(STORAGE_KEYS.WALLS, INITIAL_WALLS);
    if (gymId) return walls.filter(w => w.gym_id === gymId);
    return walls;
  }

  static async createWall(wall: Omit<Wall, 'id' | 'created_at'>): Promise<Wall> {
    const newWall: Wall = {
      ...wall,
      id: `wall-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('walls').insert([wall]).select().single();
        if (!error && data) return data as Wall;
      }
    }

    const walls = getStored<Wall[]>(STORAGE_KEYS.WALLS, INITIAL_WALLS);
    const updated = [...walls, newWall];
    setStored(STORAGE_KEYS.WALLS, updated);
    return newWall;
  }

  // 3. CLIMBS
  static async getClimbs(filters?: { gym_id?: string; wall_id?: string }): Promise<Climb[]> {
    const climbsList = await this.getRawClimbs(filters);

    // Attach calculated rating counts & normalized grades
    const ratings = await this.getRatings();
    const gyms = await this.getRawGyms();

    const { climbScores } = calculateBradleyTerryNormalization(climbsList, ratings, gyms);

    return climbsList.map(climb => {
      const climbRatings = ratings.filter(r => r.climb_id === climb.id && !r.is_spam);
      const avgStars = climbRatings.length > 0 
        ? climbRatings.reduce((acc, r) => acc + r.quality_stars, 0) / climbRatings.length 
        : 0;
      
      const normInfo = climbScores.get(climb.id);

      return {
        ...climb,
        rating_count: climbRatings.length,
        avg_stars: parseFloat(avgStars.toFixed(1)),
        normalized_score: normInfo?.score,
      };
    });
  }

  static async getClimbByIdOrToken(identifier: string): Promise<Climb | null> {
    const climbs = await this.getClimbs();
    return climbs.find(c => c.id === identifier || c.qr_code_token === identifier) || null;
  }

  static async createClimb(climb: Omit<Climb, 'id' | 'created_at' | 'qr_code_token' | 'is_active'>): Promise<Climb> {
    const token = `climb-${climb.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.floor(100 + Math.random() * 900)}`;
    const newClimb: Climb = {
      ...climb,
      id: `climb-${Date.now()}`,
      qr_code_token: token,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('climbs').insert([{
          gym_id: climb.gym_id,
          wall_id: climb.wall_id,
          name: climb.name,
          color: climb.color,
          discipline: climb.discipline,
          gym_grade: climb.gym_grade,
          setter_notes: climb.setter_notes,
          active_from: climb.active_from,
          qr_code_token: token
        }]).select().single();
        if (!error && data) return data as Climb;
      }
    }

    const currentClimbs = getStored<Climb[]>(STORAGE_KEYS.CLIMBS, INITIAL_CLIMBS);
    const updated = [newClimb, ...currentClimbs];
    setStored(STORAGE_KEYS.CLIMBS, updated);
    return newClimb;
  }

  // 4. RATINGS
  static async getRatings(climbId?: string): Promise<Rating[]> {
    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('ratings').select('*').order('created_at', { ascending: false });
        if (climbId) query = query.eq('climb_id', climbId);
        const { data, error } = await query;
        if (!error && data) return data as Rating[];
      }
    }

    const ratings = getStored<Rating[]>(STORAGE_KEYS.RATINGS, INITIAL_RATINGS);
    if (climbId) return ratings.filter(r => r.climb_id === climbId);
    return ratings;
  }

  static async getChallengeAttempts(climbId?: string): Promise<ChallengeAttempt[]> {
    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        let query = supabase.from('challenge_attempts').select('*').order('created_at', { ascending: false });
        if (climbId) query = query.eq('climb_id', climbId);
        const { data, error } = await query;
        if (!error && data) return data as ChallengeAttempt[];
      }
    }

    const attempts = getStored<ChallengeAttempt[]>(STORAGE_KEYS.CHALLENGE_ATTEMPTS, INITIAL_CHALLENGE_ATTEMPTS);
    if (climbId) return attempts.filter(a => a.climb_id === climbId);
    return attempts;
  }

  static async submitChallengeAttempt(payload: ChallengeSubmitPayload): Promise<ChallengeAttempt> {
    const trimmedName = payload.user_display_name?.trim() || 'Guest Climber';
    const newAttempt: ChallengeAttempt = {
      id: `challenge-${Date.now()}`,
      climb_id: payload.climb_id,
      user_id: payload.user_id || null,
      user_display_name: trimmedName,
      challenge_type: payload.challenge_type,
      value: Math.max(1, Math.round(payload.value || 1)),
      video_url: payload.video_url || '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('challenge_attempts').insert([{
          climb_id: payload.climb_id,
          user_id: payload.user_id,
          user_display_name: trimmedName,
          challenge_type: payload.challenge_type,
          value: newAttempt.value,
          video_url: payload.video_url,
        }]).select().single();
        if (!error && data) return data as ChallengeAttempt;
      }
    }

    const currentAttempts = getStored<ChallengeAttempt[]>(STORAGE_KEYS.CHALLENGE_ATTEMPTS, INITIAL_CHALLENGE_ATTEMPTS);
    setStored(STORAGE_KEYS.CHALLENGE_ATTEMPTS, [newAttempt, ...currentAttempts]);
    return newAttempt;
  }

  static async getChallengeLeaderboard(climbId: string, challengeType: ChallengeType): Promise<LeaderboardEntry[]> {
    const attempts = await this.getChallengeAttempts(climbId);
    const climb = await this.getClimbByIdOrToken(climbId);

    return attempts
      .filter(a => a.challenge_type === challengeType)
      .sort((a, b) => a.value - b.value)
      .slice(0, 10)
      .map((attempt, index) => ({
        rank: index + 1,
        user_display_name: attempt.user_display_name,
        value: attempt.value,
        climb_id: attempt.climb_id,
        climb_name: climb?.name,
        gym_name: climb?.gym_name,
        created_at: attempt.created_at,
      }));
  }

  static async getGymLeaderboard(gymId: string, challengeType: ChallengeType): Promise<LeaderboardEntry[]> {
    const gymClimbs = await this.getClimbs({ gym_id: gymId });
    const gymClimbIds = new Set(gymClimbs.map(c => c.id));
    const climbMap = new Map(gymClimbs.map(c => [c.id, c]));
    const attempts = await this.getChallengeAttempts();

    const bestByUser = new Map<string, ChallengeAttempt>();
    attempts
      .filter(a => a.challenge_type === challengeType && gymClimbIds.has(a.climb_id))
      .forEach(attempt => {
        const key = attempt.user_id || attempt.user_display_name;
        const existing = bestByUser.get(key);
        if (!existing || attempt.value < existing.value) {
          bestByUser.set(key, attempt);
        }
      });

    return Array.from(bestByUser.values())
      .sort((a, b) => a.value - b.value)
      .map((attempt, index) => {
        const climb = climbMap.get(attempt.climb_id);
        return {
          rank: index + 1,
          user_display_name: attempt.user_display_name,
          value: attempt.value,
          climb_id: attempt.climb_id,
          climb_name: climb?.name,
          gym_name: climb?.gym_name,
          created_at: attempt.created_at,
        };
      })
      .slice(0, 10);
  }

  static async getGlobalLeaderboard(challengeType: ChallengeType): Promise<LeaderboardEntry[]> {
    const attempts = await this.getChallengeAttempts();
    const climbs = await this.getClimbs();
    const climbMap = new Map(climbs.map(climb => [climb.id, climb]));

    const bestByUser = new Map<string, ChallengeAttempt>();
    attempts
      .filter(a => a.challenge_type === challengeType)
      .forEach(attempt => {
        const key = attempt.user_id || attempt.user_display_name;
        const existing = bestByUser.get(key);
        if (!existing || attempt.value < existing.value) {
          bestByUser.set(key, attempt);
        }
      });

    return Array.from(bestByUser.values())
      .sort((a, b) => a.value - b.value)
      .map((attempt, index) => {
        const climb = climbMap.get(attempt.climb_id);
        return {
          rank: index + 1,
          user_display_name: attempt.user_display_name,
          value: attempt.value,
          climb_id: attempt.climb_id,
          climb_name: climb?.name,
          gym_name: climb?.gym_name,
          created_at: attempt.created_at,
        };
      })
      .slice(0, 10);
  }

  static async submitRating(payload: RatingSubmitPayload): Promise<Rating> {
    const spamCheck = checkSpam(payload.comment, payload.quality_stars);

    const newRating: Rating = {
      id: `r-${Date.now()}`,
      climb_id: payload.climb_id,
      user_id: payload.user_id || 'anonymous-climber',
      user_display_name: payload.user_display_name || (payload.user_id ? 'Authenticated Climber' : 'Guest Climber'),
      comparative_rating: payload.comparative_rating,
      quality_stars: payload.quality_stars,
      comment: payload.comment || '',
      photo_url: payload.photo_url || '',
      is_spam: spamCheck.isSpam,
      spam_reason: spamCheck.reason,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const { data, error } = await supabase.from('ratings').insert([{
          climb_id: payload.climb_id,
          user_id: payload.user_id || null,
          comparative_rating: payload.comparative_rating,
          quality_stars: payload.quality_stars,
          comment: payload.comment,
          photo_url: payload.photo_url,
          is_spam: newRating.is_spam,
          spam_reason: newRating.spam_reason
        }]).select().single();
        if (!error && data) return data as Rating;
      }
    }

    const currentRatings = getStored<Rating[]>(STORAGE_KEYS.RATINGS, INITIAL_RATINGS);
    const updated = [newRating, ...currentRatings];
    setStored(STORAGE_KEYS.RATINGS, updated);
    return newRating;
  }

  // 6. PHOTO UPLOAD (Supabase Storage, falls back to inline data URL when unavailable)
  static async uploadRatingPhoto(file: File): Promise<string> {
    if (isSupabaseAvailable()) {
      const supabase = createClient();
      if (supabase) {
        const fileName = `ratings/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('rating-photos').upload(fileName, file);
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('rating-photos').getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        }
      }
    }

    // Local fallback: inline base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 5. NORMALIZATION STATS
  static async getNormalizationStats(useFullModel: boolean = true): Promise<{
    climbScores: Map<string, { score: number; normalizedGrade: string; offset: number }>;
    gymStats: GymNormalizationStats[];
  }> {
    const climbs = await this.getClimbs();
    const ratings = await this.getRatings();
    const gyms = await this.getGyms();

    if (useFullModel) {
      return calculateBradleyTerryNormalization(climbs, ratings, gyms);
    } else {
      return calculateSimpleAverageOffset(climbs, ratings, gyms);
    }
  }
}
