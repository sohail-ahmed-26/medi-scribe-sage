import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/print/$visitId")({
  head: () => ({
    meta: [
      { title: "Prescription — Materia Clinic" },
      { name: "description", content: "Printable prescription letter." },
      { property: "og:title", content: "Prescription — Materia Clinic" },
      { property: "og:description", content: "Printable prescription letter." },
    ],
  }),
  component: PrintPage,
});

function PrintPage() {
  const { visitId } = Route.useParams();
  const { data: v } = useQuery({
    queryKey: ["visit", visitId],
    queryFn: async () => (await supabase.from("visits").select("*, patients(*), prescriptions(*)").eq("id", visitId).single()).data,
  });
  if (!v) return <p className="text-muted-foreground">Loading…</p>;
  const pt = v.patients;

  return (
    <div>
      <div className="no-print mb-6 flex gap-2">
        <Button onClick={() => window.print()}>Print prescription</Button>
        <Button variant="secondary" asChild><Link to="/patients/$id" params={{ id: v.patient_id }}>Back to patient</Link></Button>
      </div>

      <article className="letter-paper relative mx-auto max-w-[148mm] rounded-sm px-10 pb-10 pt-8">
        <div className="absolute inset-y-0 left-6 w-px bg-seal/40" />
        <header className="flex items-start justify-between border-b-2 border-double border-primary pb-4">
          <div>
            <h1 className="text-3xl text-primary">Materia Clinic</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Consultation & Dispensary</p>
          </div>
          <div className="flex h-14 w-14 rotate-[-8deg] items-center justify-center rounded-full border-2 border-seal font-serif text-2xl text-seal">℞</div>
        </header>

        <section className="mt-5 grid grid-cols-3 gap-2 text-sm">
          <p className="col-span-2"><span className="text-muted-foreground">Patient: </span><b>{pt?.name}</b></p>
          <p className="text-right"><span className="text-muted-foreground">Date: </span>{v.visit_date}</p>
          <p><span className="text-muted-foreground">Age: </span>{pt?.age ?? "—"}</p>
          <p className="col-span-2 text-right"><span className="text-muted-foreground">Phone: </span>{pt?.phone ?? "—"}</p>
        </section>

        {(v.diagnosis || v.symptoms) && (
          <section className="mt-4 text-sm">
            {v.diagnosis && <p><span className="text-muted-foreground">Diagnosis: </span>{v.diagnosis}</p>}
            {v.symptoms && <p><span className="text-muted-foreground">Complaints: </span>{v.symptoms}</p>}
          </section>
        )}

        <section className="mt-6">
          <p className="font-serif text-4xl italic text-seal">℞</p>
          <ol className="mt-2 space-y-3">
            {v.prescriptions.map((r, i) => (
              <li key={r.id} className="font-script text-2xl leading-8 text-ink">
                {i + 1}. {r.medicine_name} <span className="text-xl">{r.potency}</span>
                <span className="block pl-6 text-xl">— {r.dosage}</span>
              </li>
            ))}
          </ol>
        </section>

        {v.notes && (
          <section className="mt-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Instructions</p>
            <p className="font-script text-2xl leading-8 text-ink whitespace-pre-wrap">{v.notes}</p>
          </section>
        )}

        <footer className="mt-12 flex items-end justify-between text-xs text-muted-foreground">
          <span>Keep medicines away from strong smells & sunlight.</span>
          <span className="border-t border-foreground/40 pt-1">Doctor's signature</span>
        </footer>
      </article>
    </div>
  );
}
