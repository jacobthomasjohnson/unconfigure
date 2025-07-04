import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getOrCreateAnonId } from "@/utils/userId";

export function useUserId() {
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchSessionUserId = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error checking session,", error);
      }
      if (data?.session?.user) {
        console.log("Signed-in user:", data.session.user.id);
        setCurrentUserId(data.session.user.id);
      } else {
        const anonId = getOrCreateAnonId();
        console.log("Anonymous user:", anonId);
        setCurrentUserId(anonId);
      }
    };
    fetchSessionUserId();
  }, []);

  return currentUserId;
}
