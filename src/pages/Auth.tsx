import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string()
    .min(12, "Min 12 characters")
    .max(72, "Max 72 characters")
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include number")
    .regex(/[^A-Za-z0-9]/, "Must include special character"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else { toast.success("Welcome back"); navigate("/"); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-warm flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="text-sm text-muted-foreground hover:text-ink">← Back to gallery</Link>
        <div className="mt-6 bg-card border border-border rounded-md p-10 shadow-soft">
          <h1 className="text-4xl text-ink mb-2">Admin Access</h1>
          <p className="text-muted-foreground mb-8 text-sm">
            Sign in to manage your gallery.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} maxLength={72} />
              <p className="text-xs text-muted-foreground mt-1">Min 12 chars, uppercase, lowercase, number, special char</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-ink hover:bg-ink/90 text-cream">
              {loading ? "..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
