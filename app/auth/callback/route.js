import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";
import { ensureProfile, addActivityLog } from "../../../lib/dummyStore";

// Google 로그인 완료 후 Supabase가 돌아오는 콜백 주소.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      ensureProfile(data.user.id, data.user.email);
      addActivityLog({
        user_id: data.user.id,
        event_type: "login",
        page_path: "/login",
        status: "success",
        metadata: { provider: "google" },
      });
      return NextResponse.redirect(`${origin}/`);
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "google_login_failed");
  return NextResponse.redirect(loginUrl);
}
