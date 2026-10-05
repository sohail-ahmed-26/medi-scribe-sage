import { supabase } from "@/integrations/supabase/client";

export type MedicineHit = {
  id: string; name: string; description: string | null; uses: string | null; why_used: string | null;
  potencies: string[] | null; conditions: { name: string; symptoms: string[]; notes: string | null }[];
};
export type ConditionHit = {
  id: string; name: string; description: string | null; symptoms: string[] | null;
  medicines: { name: string; uses: string | null; why_used: string | null; potencies: string[] | null; notes: string | null }[];
};
export type ChunkHit = { book: string; page: number | null; snippet: string };

/** Free, local search: Postgres full-text + trigram fuzzy match. No paid API per query. */
export async function searchKnowledge(q: string) {
  const query = q.trim();
  if (query.length < 2) return { medicines: [], conditions: [], chunks: [] };
  const [m, c, ch] = await Promise.all([
    supabase.rpc("search_medicines", { q: query }),
    supabase.rpc("search_conditions", { q: query }),
    supabase.rpc("search_chunks", { q: query }),
  ]);
  return {
    medicines: (m.data ?? []) as unknown as MedicineHit[],
    conditions: (c.data ?? []) as unknown as ConditionHit[],
    chunks: (ch.data ?? []) as ChunkHit[],
  };
}
