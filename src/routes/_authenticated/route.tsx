import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Shell,
});

function Shell() {
  const nav = useNavigate();
  const link = "px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground";
  const active = { className: "bg-secondary text-foreground font-medium" };
  return (
    <div className="min-h-screen">
      <header className="no-print border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <span className="mr-4 font-serif text-xl"><span className="text-seal">℞</span> Materia Clinic</span>
          <Link to="/search" className={link} activeProps={active}>Materia Medica</Link>
          <Link to="/patients" className={link} activeProps={active}>Patients</Link>
          <Link to="/import" className={link} activeProps={active}>Import books</Link>
          <button className={`${link} ml-auto`} onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
