import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

// 비밀번호 재설정 이메일 발송. Supabase Auth(resetPasswordForEmail)를 사용한다.
// 이메일 존재 여부를 노출하지 않기 위해 성공/실패 여부와 무관하게 같은 안내를 보여준다.
export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();

  const forgotUrl = new URL("/forgot-password", request.url);

  if (!email) {
    forgotUrl.searchParams.set("error", "missing_email");
    return NextResponse.redirect(forgotUrl, 303);
  }

  const { origin } = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("notice", "reset_email_sent");
  return NextResponse.redirect(loginUrl, 303);
}
