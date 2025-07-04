"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OneTapComponent() {
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (
      !gsiLoaded ||
      !window.google ||
      !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    )
      return;

    const initGSI = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        console.log("✅ Already signed in. Skipping Google button.");
        // Clear button if it was rendered previously
        const btn = document.getElementById("google-signin-button");
        if (btn) btn.innerHTML = "";
        return;
      }

      console.log("✅ Initializing Google OneTap");

      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          console.log("✅ Credential response:", response);

          if (!response.credential) {
            console.error("❌ No credential in response");
            return;
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });

          if (error) {
            console.error("❌ Supabase login failed:", error);
          } else {
            console.log("✅ Supabase login success:", data);
            router.refresh(); // Ensure app updates to signed-in state
          }
        },
      });

      // Render button
      const btnContainer = document.getElementById("google-signin-button");
      if (btnContainer) {
        btnContainer.innerHTML = ""; // Clear any previous button
        google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
        });
      }

      // Trigger OneTap prompt
      google.accounts.id.prompt();
    };

    initGSI();
  }, [gsiLoaded, router]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("✅ Google GSI script loaded");
          setGsiLoaded(true);
        }}
      />
      <div
        id="google-signin-button"
        style={{
          marginBottom: "1rem",
          marginTop: "1rem"
        }}
      />
    </>
  );
}
