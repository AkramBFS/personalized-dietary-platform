const LOCAL_RATINGS_KEY = "pdp_local_ratings";

interface LocalRatings {
  plans: Record<number, number[]>;
  consultations: Record<number, number[]>;
  nutritionists: Record<number, number[]>;
}

function getRatings(): LocalRatings {
  if (typeof window === "undefined") {
    return { plans: {}, consultations: {}, nutritionists: {} };
  }
  try {
    const data = localStorage.getItem(LOCAL_RATINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to parse local ratings", e);
  }
  return { plans: {}, consultations: {}, nutritionists: {} };
}

function saveRatings(ratings: LocalRatings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(ratings));
  } catch (e) {
    console.error("Failed to save local ratings", e);
  }
}

export function saveLocalPlanRating(planId: number, rating: number, nutritionistId?: number) {
  const ratings = getRatings();
  if (!ratings.plans[planId]) ratings.plans[planId] = [];
  ratings.plans[planId].push(rating);

  if (nutritionistId) {
    if (!ratings.nutritionists[nutritionistId]) ratings.nutritionists[nutritionistId] = [];
    ratings.nutritionists[nutritionistId].push(rating);
  }

  saveRatings(ratings);
}

export function saveLocalConsultationRating(consultationId: number, rating: number, nutritionistId?: number) {
  const ratings = getRatings();
  if (!ratings.consultations[consultationId]) ratings.consultations[consultationId] = [];
  ratings.consultations[consultationId].push(rating);

  if (nutritionistId) {
    if (!ratings.nutritionists[nutritionistId]) ratings.nutritionists[nutritionistId] = [];
    ratings.nutritionists[nutritionistId].push(rating);
  }

  saveRatings(ratings);
}

export function getLocalPlanAverage(planId: number): number | null {
  const ratings = getRatings();
  const arr = ratings.plans[planId];
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function getLocalConsultationAverage(consultationId: number): number | null {
  const ratings = getRatings();
  const arr = ratings.consultations[consultationId];
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function getLocalNutritionistAverage(nutritionistId: number): number | null {
  const ratings = getRatings();
  const arr = ratings.nutritionists[nutritionistId];
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Merges the API rating with the local rating.
 * If API rating exists (and is > 0) and local exists, it averages them.
 * If only local exists, returns local.
 * If only API exists, returns API.
 * If neither exists, returns 0.
 */
export function mergeRating(apiRatingAvg: number | null | undefined, localRatingAvg: number | null): number {
  const api = typeof apiRatingAvg === "number" && apiRatingAvg > 0 ? apiRatingAvg : null;
  
  if (localRatingAvg !== null) {
    if (api !== null) {
      // Both exist, simple average to combine
      return (api + localRatingAvg) / 2;
    } else {
      // Only local exists
      return localRatingAvg;
    }
  }
  
  // Only API exists (or neither)
  return api || 0;
}
