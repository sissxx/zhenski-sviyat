"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

/**
 * Whether a session cookie is present, for showing "Вход" or "Моят профил" in the header.
 * Only a display hint: account pages check the user on the server. Re-read on every navigation,
 * since login and logout happen in server actions that the browser client doesn't hear about.
 */
export function useSignedIn(): boolean {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [pathname]);

  return signedIn;
}
