import { Climb, Rating, Gym, GymNormalizationStats } from "@/types";

// Helper to convert V-scale / YDS grades to numeric index
export function gradeToNumeric(grade: string): number {
  const g = grade.trim().toUpperCase();
  
  // V-Scale: V0 -> 0, V1 -> 1, V17 -> 17, VB -> -1
  if (g.startsWith('V')) {
    if (g === 'VB') return -1;
    const num = parseInt(g.replace('V', ''), 10);
    return isNaN(num) ? 0 : num;
  }

  // YDS scale: 5.6 -> 6, 5.10a -> 10, 5.10b -> 10.25, 5.10c -> 10.5, 5.10d -> 10.75, 5.11a -> 11...
  if (g.startsWith('5.')) {
    const sub = g.replace('5.', '');
    const num = parseInt(sub, 10);
    if (isNaN(num)) return 5;
    let decimal = 0;
    if (sub.endsWith('a')) decimal = 0.0;
    else if (sub.endsWith('b')) decimal = 0.25;
    else if (sub.endsWith('c')) decimal = 0.5;
    else if (sub.endsWith('d')) decimal = 0.75;
    else if (sub.includes('+')) decimal = 0.33;
    else if (sub.includes('-')) decimal = -0.33;
    return num + decimal;
  }

  const parsed = parseFloat(g);
  return isNaN(parsed) ? 0 : parsed;
}

// Convert numeric back to V-grade representation
export function numericToVGrade(score: number): string {
  const rounded = Math.round(score);
  if (rounded < 0) return 'VB';
  return `V${rounded}`;
}

// 1. SIMPLE AVERAGE-OFFSET CALCULATION (STUB)
export function calculateSimpleAverageOffset(
  climbs: Climb[],
  ratings: Rating[],
  gyms: Gym[]
): {
  climbScores: Map<string, { score: number; normalizedGrade: string; offset: number }>;
  gymStats: GymNormalizationStats[];
} {
  const climbScores = new Map<string, { score: number; normalizedGrade: string; offset: number }>();
  const gymRatingDeltas = new Map<string, number[]>();
  const gymClimbCounts = new Map<string, number>();

  gyms.forEach(g => {
    gymRatingDeltas.set(g.id, []);
    gymClimbCounts.set(g.id, 0);
  });

  climbs.forEach(climb => {
    const gymCount = gymClimbCounts.get(climb.gym_id) || 0;
    gymClimbCounts.set(climb.gym_id, gymCount + 1);

    const climbRatings = ratings.filter(r => r.climb_id === climb.id && !r.is_spam);
    const baseNumeric = gradeToNumeric(climb.gym_grade);

    if (climbRatings.length === 0) {
      climbScores.set(climb.id, {
        score: baseNumeric,
        normalizedGrade: climb.gym_grade,
        offset: 0
      });
      return;
    }

    // Delta mapping: 'easier' => -0.5, 'as_graded' => 0.0, 'harder' => +0.5
    let totalDelta = 0;
    climbRatings.forEach(r => {
      let delta = 0;
      if (r.comparative_rating === 'harder') delta = 0.5;
      else if (r.comparative_rating === 'easier') delta = -0.5;
      totalDelta += delta;

      const deltas = gymRatingDeltas.get(climb.gym_id);
      if (deltas) deltas.push(delta);
    });

    const avgOffset = totalDelta / climbRatings.length;
    const finalScore = Math.max(0, baseNumeric + avgOffset);

    climbScores.set(climb.id, {
      score: finalScore,
      normalizedGrade: numericToVGrade(finalScore),
      offset: avgOffset
    });
  });

  // Calculate Gym Grading Bias stats
  const gymStats: GymNormalizationStats[] = gyms.map(gym => {
    const deltas = gymRatingDeltas.get(gym.id) || [];
    const totalClimbs = gymClimbCounts.get(gym.id) || 0;
    const totalRatings = deltas.length;

    const avgOffset = totalRatings > 0 ? deltas.reduce((a, b) => a + b, 0) / totalRatings : 0;
    // Positive bias = gym grades stiff/hard (climbs are actually harder than stated grade)
    // Negative bias = gym grades soft (climbs are actually easier than stated grade)
    const bias = parseFloat(avgOffset.toFixed(2));

    let label = 'Accurate / Standard';
    if (bias > 0.3) label = `Stiff (+${bias.toFixed(1)} grades harder)`;
    else if (bias > 0.1) label = `Slightly Stiff (+${bias.toFixed(1)})`;
    else if (bias < -0.3) label = `Soft (${bias.toFixed(1)} grades easier)`;
    else if (bias < -0.1) label = `Slightly Soft (${bias.toFixed(1)})`;

    return {
      gym_id: gym.id,
      gym_name: gym.name,
      total_climbs: totalClimbs,
      total_ratings: totalRatings,
      grading_bias: bias,
      grading_bias_label: label,
      avg_rating_offset: avgOffset
    };
  });

  return { climbScores, gymStats };
}

// 2. ADVANCED BRADLEY-TERRY / ELO PAIRWISE MODEL (FULL MODEL)
export function calculateBradleyTerryNormalization(
  climbs: Climb[],
  ratings: Rating[],
  gyms: Gym[]
): {
  climbScores: Map<string, { score: number; normalizedGrade: string; offset: number }>;
  gymStats: GymNormalizationStats[];
} {
  // First, find users who have rated across multiple gyms
  const userGymMap = new Map<string, Set<string>>();
  ratings.forEach(r => {
    if (!r.user_id || r.is_spam) return;
    const climb = climbs.find(c => c.id === r.climb_id);
    if (!climb) return;

    if (!userGymMap.has(r.user_id)) {
      userGymMap.set(r.user_id, new Set());
    }
    userGymMap.get(r.user_id)!.add(climb.gym_id);
  });

  // Multi-gym user weights: 1.0 baseline, +0.5 per additional gym visited
  const getUserWeight = (userId?: string | null) => {
    if (!userId) return 1.0;
    const gymSet = userGymMap.get(userId);
    if (!gymSet) return 1.0;
    return 1.0 + Math.min(2.0, (gymSet.size - 1) * 0.5);
  };

  // Step A: per-climb weighted average comparative delta, computed directly from ratings
  // (each rating is an independent pairwise signal against the climb's stated grade, so this
  // needs only one pass — it does not depend on any gym bias estimate).
  const climbAvgDelta = new Map<string, number>();
  climbs.forEach(climb => {
    const climbRatings = ratings.filter(r => r.climb_id === climb.id && !r.is_spam);
    if (climbRatings.length === 0) {
      climbAvgDelta.set(climb.id, 0);
      return;
    }

    let weightedSumDelta = 0;
    let totalWeight = 0;
    climbRatings.forEach(r => {
      const weight = getUserWeight(r.user_id);
      let delta = 0;
      if (r.comparative_rating === 'harder') delta = 0.5;
      else if (r.comparative_rating === 'easier') delta = -0.5;

      weightedSumDelta += weight * delta;
      totalWeight += weight;
    });

    climbAvgDelta.set(climb.id, totalWeight > 0 ? weightedSumDelta / totalWeight : 0);
  });

  // Climb latent score = stated grade + observed community delta. No gym bias term is added
  // here — the delta already reflects the true offset; gym bias is reported separately below
  // as the systematic component shared across a gym's climbs.
  const climbLatent = new Map<string, number>();
  climbs.forEach(climb => {
    const base = gradeToNumeric(climb.gym_grade);
    climbLatent.set(climb.id, base + (climbAvgDelta.get(climb.id) || 0));
  });

  // Step B: gym bias = weighted average of each gym's climbs' deltas (the "grades soft/stiff" signal)
  const gymBias = new Map<string, number>();
  gyms.forEach(gym => {
    const gymClimbs = climbs.filter(c => c.gym_id === gym.id);
    let totalWeightedDelta = 0;
    let totalWeight = 0;

    gymClimbs.forEach(c => {
      const climbRatings = ratings.filter(r => r.climb_id === c.id && !r.is_spam);
      climbRatings.forEach(r => {
        const w = getUserWeight(r.user_id);
        let delta = 0;
        if (r.comparative_rating === 'harder') delta = 0.5;
        else if (r.comparative_rating === 'easier') delta = -0.5;

        totalWeightedDelta += delta * w;
        totalWeight += w;
      });
    });

    gymBias.set(gym.id, totalWeight > 0 ? totalWeightedDelta / totalWeight : 0);
  });

  const climbScores = new Map<string, { score: number; normalizedGrade: string; offset: number }>();
  climbs.forEach(climb => {
    const base = gradeToNumeric(climb.gym_grade);
    const score = climbLatent.get(climb.id) || base;
    const offset = score - base;
    climbScores.set(climb.id, {
      score: parseFloat(score.toFixed(2)),
      normalizedGrade: numericToVGrade(score),
      offset: parseFloat(offset.toFixed(2))
    });
  });

  const gymStats: GymNormalizationStats[] = gyms.map(gym => {
    const bias = parseFloat((gymBias.get(gym.id) || 0).toFixed(2));
    const gymClimbs = climbs.filter(c => c.gym_id === gym.id);
    const gymClimbIds = new Set(gymClimbs.map(c => c.id));
    const gymRatings = ratings.filter(r => gymClimbIds.has(r.climb_id) && !r.is_spam);

    let label = 'Accurate / Standard';
    if (bias > 0.3) label = `Stiff (+${bias.toFixed(1)} grades harder)`;
    else if (bias > 0.1) label = `Slightly Stiff (+${bias.toFixed(1)})`;
    else if (bias < -0.3) label = `Soft (${bias.toFixed(1)} grades easier)`;
    else if (bias < -0.1) label = `Slightly Soft (${bias.toFixed(1)})`;

    return {
      gym_id: gym.id,
      gym_name: gym.name,
      total_climbs: gymClimbs.length,
      total_ratings: gymRatings.length,
      grading_bias: bias,
      grading_bias_label: label,
      avg_rating_offset: bias
    };
  });

  return { climbScores, gymStats };
}
