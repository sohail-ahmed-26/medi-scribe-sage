import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Materia Clinic" },
      { name: "description", content: "Doctor sign-in for the private clinic desk." },
      { property: "og:title", content: "Sign in — Materia Clinic" },
      { property: "og:description", content: "Doctor sign-in for the private clinic desk." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) nav({ to: "/search" });
    else toast.success("Check your email to confirm your account.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="letter-paper w-full max-w-sm rounded-md p-8">
        <p className="text-3xl text-seal font-serif">℞</p>
        <h1 className="mt-2 text-3xl">Materia Clinic</h1>
        <p className="mb-6 text-sm text-muted-foreground">Private desk — doctor access only.</p>
        <div className="space-y-4">
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
          <button type="button" className="w-full text-sm text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "First time? Create account" : "Have an account? Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
