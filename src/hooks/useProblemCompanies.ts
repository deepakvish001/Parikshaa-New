import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyRef } from "@/data/problemCompaniesMap";

export type ProblemCompaniesMap = Map<string, CompanyRef[]>;

/**
 * Module-level LRU cache keyed by problem slug. Paginating back and forth
 * reuses previously fetched slugs instead of re-querying the DB. Sentinel
 * empty arrays are also cached so slugs with no `problem_companies` rows
 * don't get re-fetched every time the page revisits them.
 */
const LRU_CAPACITY = 2000;
const slugCache = new Map<string, CompanyRef[]>();
const touch = (slug: string, value: CompanyRef[]) => {
  if (slugCache.has(slug)) slugCache.delete(slug);
  slugCache.set(slug, value);
  while (slugCache.size > LRU_CAPACITY) {
    const oldest = slugCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    slugCache.delete(oldest);
  }
};

/**
 * Fetch real "asked in the last 6 months" company data ONLY for the given
 * slugs, skipping any already resolved via the LRU. Returns a Map<slug,
 * Company[]> sorted by frequency desc.
 */
export function useProblemCompanies(slugs?: string[]) {
  const key = slugs && slugs.length > 0 ? [...slugs].sort() : [];
  return useQuery({
    queryKey: ["problem_companies", "slugs", key],
    enabled: key.length > 0,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      const map: ProblemCompaniesMap = new Map();
      const missing: string[] = [];
      for (const slug of key) {
        const cached = slugCache.get(slug);
        if (cached) {
          touch(slug, cached);
          map.set(slug, cached);
        } else {
          missing.push(slug);
        }
      }

      const CHUNK = 200;
      for (let i = 0; i < missing.length; i += CHUNK) {
        const batch = missing.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from("problem_companies")
          .select("problem_slug, company_name, company_domain, frequency")
          .in("problem_slug", batch)
          .order("frequency", { ascending: false });
        if (error) throw error;
        const batchMap = new Map<string, CompanyRef[]>();
        for (const row of data ?? []) {
          const list = batchMap.get(row.problem_slug) ?? [];
          list.push({
            name: row.company_name,
            domain: row.company_domain,
            frequency: Number(row.frequency),
          });
          batchMap.set(row.problem_slug, list);
        }
        // Cache every requested slug (including empty results) to avoid refetch.
        for (const slug of batch) {
          const list = batchMap.get(slug) ?? [];
          touch(slug, list);
          map.set(slug, list);
        }
      }
      return map;
    },
  });
}

/**
 * Context so a parent (e.g. CodingProblems) can fetch companies once for the
 * visible page and let every <CompanyLogos> row read from that shared map
 * without triggering N queries or a full-table download.
 */
const ProblemCompaniesContext = createContext<ProblemCompaniesMap | null>(null);
export const ProblemCompaniesProvider = ProblemCompaniesContext.Provider;
export const useProblemCompaniesContext = () => useContext(ProblemCompaniesContext);
