import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { searchKnowledge } from "@/lib/knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient file — Materia Clinic" },
      { name: "description", content: "Edit patient, add visit and write prescription." },
      { property: "og:title", content: "Patient file — Materia Clinic" },
      { property: "og:description", content: "Edit patient, add visit and write prescription." },
    ],
  }),
  component: PatientPage,
});

type Rx = { medicine_name: string; potency: string; dosage: string; options: string[] };

function PatientPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: patient } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => (await supabase.from("patients").select("*").eq("id", id).single()).data,
  });
  const { data: visits = [] } = useQuery({
    queryKey: ["visits", id],
    queryFn: async () => (await supabase.from("visits").select("*, prescriptions(*)").eq("patient_id", id).order("visit_date", { ascending: false })).data ?? [],
  });

  const [p, setP] = useState({ name: "", age: "", phone: "" });
  useEffect(() => { if (patient) setP({ name: patient.name, age: patient.age?.toString() ?? "", phone: patient.phone ?? "" }); }, [patient]);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [rx, setRx] = useState<Rx[]>([]);
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  const { data: hits } = useQuery({ queryKey: ["kb", dq], queryFn: () => searchKnowledge(dq), enabled: dq.trim().length >= 2 });

  function addMed(name: string, potencies: string[] | null) {
    if (rx.some((r) => r.medicine_name === name)) return;
    setRx([...rx, { medicine_name: name, potency: potencies?.[0] ?? "", dosage: "", options: potencies ?? [] }]);
  }

  async function savePatient() {
    const { error } = await supabase.from("patients").update({ name: p.name, age: p.age ? +p.age : null, phone: p.phone || null }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["patient", id] });
    toast.success("Patient updated");
  }

  async function saveVisit() {
    const { data: v, error } = await supabase.from("visits").insert({ patient_id: id, visit_date: date, symptoms, diagnosis, notes }).select().single();
    if (error || !v) return toast.error(error?.message ?? "Failed");
    if (rx.length) {
      const { error: e2 } = await supabase.from("prescriptions").insert(rx.map(({ medicine_name, potency, dosage }) => ({ visit_id: v.id, medicine_name, potency, dosage })));
      if (e2) return toast.error(e2.message);
    }
    toast.success("Visit saved");
    nav({ to: "/print/$visitId", params: { visitId: v.id } });
  }

  if (!patient) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      <Link to="/patients" className="text-sm text-muted-foreground">← All patients</Link>
      <section className="rounded-md border bg-card p-5">
        <h2 className="mb-3 text-xl">Edit patient</h2>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto]">
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Name" />
          <Input type="number" value={p.age} onChange={(e) => setP({ ...p, age: e.target.value })} placeholder="Age" />
          <Input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} placeholder="Phone" />
          <Button variant="secondary" onClick={savePatient}>Save</Button>
        </div>
      </section>

      <section className="rounded-md border bg-card p-5">
        <h2 className="mb-4 text-2xl">Add visit</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Disease / diagnosis</Label><Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} /></div>
          <div className="md:col-span-2"><Label>Symptoms</Label><Textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} /></div>
        </div>

        <div className="mt-5">
          <Label>Find medicine (by symptom, disease or name)</Label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books…" className="bg-paper" />
          {hits && (
            <div className="mt-2 max-h-64 overflow-auto rounded-md border">
              {hits.medicines.map((m) => (
                <button key={m.id} type="button" onClick={() => addMed(m.name, m.potencies)} className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-secondary">
                  <b className="font-serif">{m.name}</b> <span className="text-muted-foreground">— {m.uses}</span>
                </button>
              ))}
              {hits.conditions.flatMap((c) => c.medicines.map((m) => (
                <button key={c.id + m.name} type="button" onClick={() => addMed(m.name, m.potencies)} className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-secondary">
                  <b className="font-serif">{m.name}</b> <span className="text-muted-foreground">for {c.name} — {m.uses}</span>
                </button>
              )))}
            </div>
          )}
        </div>

        <h3 className="mt-6 text-lg">Prescription</h3>
        {rx.length === 0 && <p className="text-sm text-muted-foreground">Click a medicine above to add it.</p>}
        <div className="space-y-2">
          {rx.map((r, i) => (
            <div key={r.medicine_name} className="grid items-center gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
              <span className="font-serif">{r.medicine_name}</span>
              <Input list={`pot-${i}`} value={r.potency} placeholder="Potency (e.g. 30C, 30ml)" onChange={(e) => setRx(rx.map((x, j) => j === i ? { ...x, potency: e.target.value } : x))} />
              <datalist id={`pot-${i}`}>{r.options.map((o) => <option key={o} value={o} />)}</datalist>
              <Input value={r.dosage} placeholder="Dosage (e.g. 4 drops, 3× daily)" onChange={(e) => setRx(rx.map((x, j) => j === i ? { ...x, dosage: e.target.value } : x))} />
              <Button variant="ghost" size="sm" onClick={() => setRx(rx.filter((_, j) => j !== i))}>Remove</Button>
            </div>
          ))}
        </div>

        <div className="mt-5"><Label>Doctor's notes / instructions</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <Button className="mt-5" onClick={saveVisit}>Save visit & print</Button>
      </section>

      <section>
        <h2 className="mb-3 text-xl">Visit history</h2>
        <ul className="space-y-2">
          {visits.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
              <span><b>{v.visit_date}</b> · {v.diagnosis || v.symptoms} · {v.prescriptions.length} medicine(s)</span>
              <Link to="/print/$visitId" params={{ visitId: v.id }} className="text-sm text-primary underline">Print</Link>
            </li>
          ))}
          {visits.length === 0 && <li className="text-sm text-muted-foreground">No visits yet.</li>}
        </ul>
      </section>
    </div>
  );
}
