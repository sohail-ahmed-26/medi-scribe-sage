import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchKnowledge } from "@/lib/knowledge";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Materia Medica — Materia Clinic" },
      { name: "description", content: "Search medicines or diseases and see indications, symptoms and details." },
      { property: "og:title", content: "Materia Medica — Materia Clinic" },
      { property: "og:description", content: "Search medicines or diseases from your reference books." },
    ],
  }),
  component: SearchPage,
});

function useDebounced(v: string, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function SearchPage() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const { data, isFetching } = useQuery({ queryKey: ["kb", dq], queryFn: () => searchKnowledge(dq), enabled: dq.trim().length >= 2 });

  return (
    <div>
      <h1 className="text-4xl">Materia Medica</h1>
      <p className="mt-1 text-muted-foreground">Type a medicine to see what it treats — or a disease / symptom to see its medicines.</p>
      <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Belladonna, fever, acidity…" className="mt-6 h-14 bg-card text-lg" />
      {isFetching && <p className="mt-3 text-sm text-muted-foreground">Searching books…</p>}

      {data && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-xl">Medicines</h2>
            {data.medicines.length === 0 && <p className="text-sm text-muted-foreground">No medicine matches.</p>}
            <div className="space-y-3">
              {data.medicines.map((m) => (
                <article key={m.id} className="rounded-md border bg-card p-4">
                  <h3 className="text-lg">{m.name}</h3>
                  {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                  {m.uses && <p className="mt-2 text-sm"><b>Used for:</b> {m.uses}</p>}
                  {m.why_used && <p className="text-sm"><b>Why:</b> {m.why_used}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.conditions.map((c) => <Badge key={c.name} variant="secondary">{c.name}</Badge>)}
                    {m.potencies?.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}
                  </div>
                  {m.conditions.flatMap((c) => c.symptoms ?? []).length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Symptoms: {m.conditions.flatMap((c) => c.symptoms ?? []).join(", ")}</p>
                  )}
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-xl">Diseases & symptoms</h2>
            {data.conditions.length === 0 && <p className="text-sm text-muted-foreground">No disease matches.</p>}
            <div className="space-y-3">
              {data.conditions.map((c) => (
                <article key={c.id} className="rounded-md border bg-card p-4">
                  <h3 className="text-lg">{c.name}</h3>
                  {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                  {!!c.symptoms?.length && <p className="mt-1 text-xs">Symptoms: {c.symptoms.join(", ")}</p>}
                  <ul className="mt-3 space-y-2 border-t pt-3">
                    {c.medicines.map((m) => (
                      <li key={m.name} className="text-sm"><b className="font-serif text-primary">{m.name}</b> — {m.uses}{m.why_used ? ` · ${m.why_used}` : ""}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            {data.chunks.length > 0 && (
              <>
                <h2 className="mb-3 mt-8 text-xl">From the books</h2>
                {data.chunks.map((ch, i) => (
                  <blockquote key={i} className="mb-3 border-l-2 border-accent pl-3 text-sm">
                    <span dangerouslySetInnerHTML={{ __html: ch.snippet }} />
                    <footer className="mt-1 text-xs text-muted-foreground">{ch.book}{ch.page ? `, p. ${ch.page}` : ""}</footer>
                  </blockquote>
                ))}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
