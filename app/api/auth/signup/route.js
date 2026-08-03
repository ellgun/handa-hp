import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";
import { ensureProfile, addActivityLog } from "../../../../lib/dataStore";

// 이메일/비밀번호 회원가입. 실제 Supabase Auth(signUp)를 사용한다.
// Supabase 프로젝트의 "Confirm email" 설정에 따라 두 가지 결과가 있을 수 있다.
// - 꺼져 있으면: signUp 응답에 session이 바로 포함되어 가입 즉시 로그인된다.
// - 켜져 있으면: session이 없고, 확인 이메일을 눌러야 로그인할 수 있다.
export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const passwordConfirm = String(form.get("password_confirm") || "");

  const signupUrl = new URL("/signup", request.url);

  if (!email || !password) {
    signupUrl.searchParams.set("error", "missing_fields");
    return NextResponse.redirect(signupUrl, 303);
  }
  if (password !== passwordConfirm) {
    signupUrl.searchParams.set("error", "password_mismatch");
    return NextResponse.redirect(signupUrl, 303);
  }
  if (password.length < 6) {
    signupUrl.searchParams.set("error", "weak_password");
    return NextResponse.redirect(signupUrl, 303);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    const alreadyRegistered = /already registered|already exists/i.test(error.message || "");
    signupUrl.searchParams.set("error", alreadyRegistered ? "email_taken" : "signup_failed");
    return NextResponse.redirect(signupUrl, 303);
  }

  if (!data.session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("notice", "check_email");
    return NextResponse.redirect(loginUrl, 303);
  }

  await ensureProfile(data.user.id, data.user.email);
  await addActivityLog({
    user_id: data.user.id,
    event_type: "login",
    page_path: "/signup",
    status: "success",
    metadata: { provider: "email", action: "signup" },
  });

  return NextResponse.redirect(new URL("/", request.url), 303);
}
