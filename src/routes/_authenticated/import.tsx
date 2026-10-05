import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({
    meta: [
      { title: "Import books — Materia Clinic" },
      { name: "description", content: "Upload the knowledge file generated from your medical books." },
      { property: "og:title", content: "Import books — Materia Clinic" },
      { property: "og:description", content: "Upload the knowledge file generated from your medical books." },
    ],
  }),
  component: ImportPage,
});

type KB = {
  medicines?: { name: string; description?: string; uses?: string; why_used?: string; potencies?: string[]; source?: string }[];
  conditions?: { name: string; description?: string; symptoms?: string[]; source?: string }[];
  links?: { medicine: string; condition: string; notes?: string }[];
  chunks?: { book: string; page?: number; content: string; embedding?: number[] }[];
};

const batch = <T,>(a: T[], n = 300) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

function ImportPage() {
  const [log, setLog] = useState<string[]>([]);
  const say = (s: string) => setLog((l) => [...l, s]);

  async function run(file: File) {
    setLog([]);
    try {
      const kb = JSON.parse(await file.text()) as KB;
      for (const b of batch(kb.medicines ?? [])) {
        const { error } = await supabase.from("medicines").upsert(b, { onConflict: "name" }); if (error) throw error;
      }
      say(`Medicines: ${kb.medicines?.length ?? 0}`);
      for (const b of batch(kb.conditions ?? [])) {
        const { error } = await supabase.from("conditions").upsert(b, { onConflict: "name" }); if (error) throw error;
      }
      say(`Diseases: ${kb.conditions?.length ?? 0}`);
      if (kb.links?.length) {
        const [{ data: ms }, { data: cs }] = await Promise.all([
          supabase.from("medicines").select("id,name"), supabase.from("conditions").select("id,name"),
        ]);
        const mi = new Map(ms?.map((m) => [m.name.toLowerCase(), m.id])); const ci = new Map(cs?.map((c) => [c.name.toLowerCase(), c.id]));
        const rows = kb.links.map((l) => ({ medicine_id: mi.get(l.medicine.toLowerCase()), condition_id: ci.get(l.condition.toLowerCase()), notes: l.notes ?? null }))
          .filter((r): r is { medicine_id: string; condition_id: string; notes: string | null } => !!r.medicine_id && !!r.condition_id);
        for (const b of batch(rows)) { const { error } = await supabase.from("medicine_conditions").upsert(b); if (error) throw error; }
        say(`Links: ${rows.length}`);
      }
      const chunks = (kb.chunks ?? []).map((c) => ({ book: c.book, page: c.page ?? null, content: c.content, embedding: c.embedding ? JSON.stringify(c.embedding) : null }));
      for (const b of batch(chunks, 100)) { const { error } = await supabase.from("book_chunks").insert(b); if (error) throw error; }
      say(`Book passages: ${chunks.length}`);
      toast.success("Import complete");
    } catch (e) {
      toast.error((e as Error).message);
      say("Error: " + (e as Error).message);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl">Import books</h1>
      <p className="mt-2 text-muted-foreground">Upload the <code>knowledge.json</code> file produced from your books. Existing medicines are updated by name.</p>
      <Input type="file" accept=".json" className="mt-6 bg-card" onChange={(e) => e.target.files?.[0] && run(e.target.files[0])} />
      <ul className="mt-4 space-y-1 text-sm">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}
