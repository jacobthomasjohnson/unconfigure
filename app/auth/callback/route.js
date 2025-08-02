import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/";

    if (!code) {
      console.error("Missing code in callback");
      return NextResponse.redirect(
        `${url.origin}/auth/error?reason=missing_code`
      );
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Supabase exchange error:", error);
      return NextResponse.redirect(
        `${url.origin}/auth/error?reason=exchange_failed`
      );
    }

    return NextResponse.redirect(`${url.origin}${next}`);
  } catch (err) {
    console.error("Unhandled error in callback:", err);
    const url = new URL(request.url);
    return NextResponse.redirect(
      `${url.origin}/auth/error?reason=server_crash`
    );
  }
}
