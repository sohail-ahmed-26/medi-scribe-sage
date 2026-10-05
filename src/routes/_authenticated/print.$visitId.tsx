import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/print/$visitId")({
  head: () => ({
    meta: [
      { title: "Prescription — City Homeopathic Clinic" },
      { name: "description", content: "Printable prescription letter." },
      { property: "og:title", content: "Prescription — City Homeopathic Clinic" },
      { property: "og:description", content: "Printable prescription letter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
      <div className="no-print mb-6 flex flex-wrap gap-2">
        <Button onClick={() => window.print()}>Print prescription</Button>
        <Button variant="secondary" asChild><Link to="/patients/$id" params={{ id: v.patient_id }}>Back to patient</Link></Button>
      </div>

      <article className="clinical-sheet mx-auto flex min-h-[265mm] max-w-[210mm] flex-col border px-6 py-7 sm:px-12 sm:py-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-primary pb-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary font-serif text-2xl text-primary-foreground">℞</div>
            <div>
              <h1 className="text-2xl font-semibold leading-tight text-primary sm:text-3xl">City Homeopathic Clinic</h1>
              <p className="mt-1 text-sm text-muted-foreground">Abbottabad Road, near Saadi CNG Station, Mansehra</p>
            </div>
          </div>
          <div className="text-sm leading-6 sm:text-right">
            <a href="tel:03349279583" className="block font-medium">03349279583</a>
            <a href="mailto:banianhu@gmail.com" className="block text-muted-foreground">banianhu@gmail.com</a>
          </div>
        </header>

        <div className="mt-7 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground">Prescription</h2>
          <time className="text-sm text-muted-foreground" dateTime={v.visit_date}>{v.visit_date}</time>
        </div>
        <section className="mt-4 grid gap-x-6 gap-y-4 border-y bg-secondary/40 px-4 py-5 text-sm sm:grid-cols-3">
          <div><p className="text-xs font-medium uppercase text-muted-foreground">Patient</p><p className="mt-1 font-semibold break-words">{pt?.name ?? "—"}</p></div>
          <div><p className="text-xs font-medium uppercase text-muted-foreground">Age</p><p className="mt-1">{pt?.age ? `${pt.age} years` : "—"}</p></div>
          <div><p className="text-xs font-medium uppercase text-muted-foreground">Patient phone</p><p className="mt-1">{pt?.phone || "—"}</p></div>
        </section>

        {(v.diagnosis || v.symptoms) && <section className="mt-7 grid gap-5 text-sm sm:grid-cols-2">
          {v.diagnosis && <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Assessment</h3><p className="mt-2 whitespace-pre-wrap">{v.diagnosis}</p></div>}
          {v.symptoms && <div><h3 className="text-xs font-semibold uppercase text-muted-foreground">Presenting symptoms</h3><p className="mt-2 whitespace-pre-wrap">{v.symptoms}</p></div>}
        </section>}

        <section className="mt-9 flex-1">
          <h3 className="border-b pb-2 text-lg font-semibold text-primary">℞ &nbsp; Medicines</h3>
          {v.prescriptions.length ? <ol className="divide-y">
            {v.prescriptions.map((r, i) => <li key={r.id} className="grid grid-cols-[2rem_1fr] gap-3 py-4 text-sm">
              <span className="font-medium text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <div><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong className="text-base font-semibold">{r.medicine_name}</strong>{r.potency && <span className="text-muted-foreground">{r.potency}</span>}</div>{r.dosage && <p className="mt-1 text-muted-foreground">{r.dosage}</p>}</div>
            </li>)}
          </ol> : <p className="py-5 text-sm text-muted-foreground">No medicines recorded for this visit.</p>}
        </section>

        {v.notes && <section className="border-t pt-5"><h3 className="text-xs font-semibold uppercase text-muted-foreground">Advice / instructions</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{v.notes}</p></section>}
        <footer className="mt-14 flex flex-wrap items-end justify-between gap-8 border-t pt-5 text-xs text-muted-foreground">
          <div><p className="font-semibold text-foreground">City Homeopathic Clinic</p><p>Abbottabad Road, near Saadi CNG Station, Mansehra</p></div>
          <span className="min-w-40 border-t border-foreground pt-2 text-right">Doctor's signature</span>
        </footer>
      </article>
    </div>
  );
}
