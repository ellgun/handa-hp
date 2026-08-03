import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { ensureProfile, addActivityLog } from "../../../../lib/dataStore";

// 이메일/비밀번호 로그인. 실제 Supabase Auth(signInWithPassword)를 사용한다.
export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  const loginUrl = new URL("/login", request.url);

  if (!email || !password) {
    loginUrl.searchParams.set("error", "missing_fields");
    return NextResponse.redirect(loginUrl, 303);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    loginUrl.searchParams.set("error", "invalid_credentials");
    return NextResponse.redirect(loginUrl, 303);
  }

  await ensureProfile(data.user.id, data.user.email);
  await addActivityLog({
    user_id: data.user.id,
    event_type: "login",
    page_path: "/login",
    status: "success",
    metadata: { provider: "email" },
  });

  return NextResponse.redirect(new URL("/", request.url), 303);
}
