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
      { title: "Patients — Materia Clinic" },
      { name: "description", content: "Patient register with visits and prescriptions." },
      { property: "og:title", content: "Patients — Materia Clinic" },
      { property: "og:description", content: "Patient register with visits and prescriptions." },
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
    if (error) return toast.error(error.message);
    setForm({ name: "", age: "", phone: "" });
    qc.invalidateQueries({ queryKey: ["patients"] });
    toast.success("Patient added");
  }

  const list = data.filter((p) => (p.name + (p.phone ?? "")).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-4xl">Patients</h1>
        <Input placeholder="Search by name or phone" value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-4 bg-card" />
        <ul className="mt-4 divide-y rounded-md border bg-card">
          {list.map((p) => (
            <li key={p.id}>
              <Link to="/patients/$id" params={{ id: p.id }} className="flex items-center justify-between px-4 py-3 hover:bg-secondary">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-muted-foreground">{p.age ? `${p.age} yrs · ` : ""}{p.phone}</span>
              </Link>
            </li>
          ))}
          {list.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">No patients yet.</li>}
        </ul>
      </div>
      <form onSubmit={add} className="h-fit space-y-3 rounded-md border bg-card p-5">
        <h2 className="text-xl">New patient</h2>
        <Input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
        <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button className="w-full">Add patient</Button>
      </form>
    </div>
  );
}
