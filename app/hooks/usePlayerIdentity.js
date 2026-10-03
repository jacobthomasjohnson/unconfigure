"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateAnonId } from "@/utils/userId";

export function usePlayerIdentity() {
  const [identity, setIdentity] = useState({
    status: "loading",
    user: null,
    anonymousId: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const anonymousId = getOrCreateAnonId();

    const applySession = (session) => {
      if (!active) return;
      setIdentity({
        status: session?.user ? "authenticated" : "anonymous",
        user: session?.user ?? null,
        anonymousId,
        error: null,
      });
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setIdentity({
          status: "error",
          user: null,
          anonymousId,
          error,
        });
        return;
      }
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return identity;
}
