import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, session: null, isAdmin: false, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const inactivityTimeout = 30 * 60 * 1000; // 30 minutes

  const resetInactivityTimer = () => {
    if (!session) return;
    const timer = setTimeout(() => {
      supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }, inactivityTimeout);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
          setIsAdmin(!!data);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!data);
      }
      setLoading(false);
    });

    // Setup inactivity listener
    const handleUserActivity = resetInactivityTimer();

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, () => handleUserActivity?.()));

    return () => {
      sub.subscription.unsubscribe();
      events.forEach(e => window.removeEventListener(e, () => handleUserActivity?.()));
      handleUserActivity?.();
    };
  }, [inactivityTimeout]);

  return (
    <Ctx.Provider value={{ user, session, isAdmin, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
