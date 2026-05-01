import api from "@/lib/api";

export interface LookupItem {
  id: number;
  name: string;
}

let lookupCache: {
  countries?: LookupItem[];
  goals?: LookupItem[];
  specializations?: LookupItem[];
  languages?: LookupItem[];
} = {};

let bootstrapPromise: Promise<void> | null = null;

/**
 * Bootstrap lookup data once per app load.
 * Call this from the root layout or before rendering forms.
 * Caches results globally to avoid re-fetching.
 */
export async function bootstrapLookups(): Promise<void> {
  // If already bootstrapped, don't refetch
  if (Object.keys(lookupCache).length > 0) {
    return;
  }

  // If already in progress, wait for it to complete
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const [countriesRes, goalsRes, specializationsRes, languagesRes] = await Promise.all([
        api.get("/lookup/countries/").catch(() => ({ data: [] })),
        api.get("/lookup/goals/").catch(() => ({ data: [] })),
        api.get("/lookup/specializations/").catch(() => ({ data: [] })),
        api.get("/lookup/languages/").catch(() => ({ data: [] })),
      ]);

      const extractData = (res: any) => {
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.results)) return res.data.results;
        return [];
      };

      lookupCache = {
        countries: extractData(countriesRes),
        goals: extractData(goalsRes),
        specializations: extractData(specializationsRes),
        languages: extractData(languagesRes),
      };
    } catch (err) {
      console.error("Failed to bootstrap lookup data", err);
      // Continue with empty lookups rather than blocking the app
      lookupCache = {
        countries: [],
        goals: [],
        specializations: [],
        languages: [],
      };
    } finally {
      bootstrapPromise = null;
    }
  })();

  return bootstrapPromise;
}

/**
 * Get cached countries list. Call bootstrapLookups() first.
 */
export function getCountries(): LookupItem[] {
  return lookupCache.countries || [];
}

/**
 * Get cached goals list. Call bootstrapLookups() first.
 */
export function getGoals(): LookupItem[] {
  return lookupCache.goals || [];
}

/**
 * Get cached specializations list. Call bootstrapLookups() first.
 */
export function getSpecializations(): LookupItem[] {
  return lookupCache.specializations || [];
}

/**
 * Get cached languages list. Call bootstrapLookups() first.
 */
export function getLanguages(): LookupItem[] {
  return lookupCache.languages || [];
}

/**
 * Clear the lookup cache (useful for testing or forcing a refresh).
 */
export function clearLookupCache(): void {
  lookupCache = {};
  bootstrapPromise = null;
}
