import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patients/")({
  head: () => ({
    meta: [
      { title: "Patients — City Homeopathic Clinic" },
      { name: "description", content: "Patient register with visits and prescriptions." },
      { property: "og:title", content: "Patients — City Homeopathic Clinic" },
      { property: "og:description", content: "Patient register with visits and prescriptions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ name: "", age: "", phone: "" });
  const { data = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => (await supabase.from("patients").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("patients").insert({ name: form.name, age: form.age ? +form.age : null, phone: form.phone || null });
    if (error) { toast.error(error.message); return; }
    setForm({ name: "", age: "", phone: "" });
    qc.invalidateQueries({ queryKey: ["patients"] });
    toast.success("Patient added");
  }

  const list = data.filter((p) => (p.name + (p.phone ?? "")).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <header className="border-b pb-6">
        <p className="mb-2 text-xs font-semibold uppercase text-primary">City Homeopathic Clinic / Records</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Patients</h1>
        <p className="mt-2 text-sm text-muted-foreground">{data.length} patient{data.length === 1 ? "" : "s"} on record</p>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <label htmlFor="patient-search" className="text-sm font-medium">Find a patient</label>
        <Input id="patient-search" placeholder="Search by name or phone" value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-2 bg-card" />
        <div className="mt-5 overflow-hidden rounded-md border bg-card">
          <div className="grid grid-cols-[1fr_auto] border-b bg-secondary/40 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground"><span>Name</span><span>Age / phone</span></div>
          <ul className="divide-y">
          {list.map((p) => (
            <li key={p.id}>
              <Link to="/patients/$id" params={{ id: p.id }} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 transition-colors hover:bg-secondary/50">
                <span className="font-medium break-words">{p.name}</span>
                <span className="text-sm text-muted-foreground">{p.age ? `${p.age} yrs · ` : ""}{p.phone || "No phone"} <span aria-hidden="true" className="ml-2 text-primary">→</span></span>
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="px-4 py-8 text-sm text-muted-foreground">{filter ? "No matching patients." : "No patients yet."}</li>}
          </ul>
        </div>
      </section>
      <form onSubmit={add} className="space-y-4 border-t-2 border-primary bg-card p-5 shadow-sm">
        <h2 className="text-xl font-semibold">New patient</h2>
        <div><label htmlFor="new-name" className="text-sm font-medium">Full name</label><Input id="new-name" required className="mt-1" placeholder="Patient name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label htmlFor="new-age" className="text-sm font-medium">Age</label><Input id="new-age" type="number" min="0" max="130" className="mt-1" placeholder="Years" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
        <div><label htmlFor="new-phone" className="text-sm font-medium">Phone number</label><Input id="new-phone" className="mt-1" placeholder="Contact number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <Button className="w-full">Add patient</Button>
      </form>
      </div>
    </div>
  );
}
