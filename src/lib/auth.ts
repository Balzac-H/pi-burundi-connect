import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setChargement(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChargement(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, utilisateur: (session?.user ?? null) as User | null, chargement };
}

export async function seDeconnecter() {
  await supabase.auth.signOut();
}
