import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

// 재설정 링크를 통해 발급된 임시 세션으로 새 비밀번호를 설정한다.
export async function POST(request) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  const passwordConfirm = String(form.get("password_confirm") || "");

  const resetUrl = new URL("/reset-password", request.url);

  if (password !== passwordConfirm) {
    resetUrl.searchParams.set("error", "password_mismatch");
    return NextResponse.redirect(resetUrl, 303);
  }
  if (password.length < 6) {
    resetUrl.searchParams.set("error", "weak_password");
    return NextResponse.redirect(resetUrl, 303);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const forgotUrl = new URL("/forgot-password", request.url);
    forgotUrl.searchParams.set("error", "reset_link_invalid");
    return NextResponse.redirect(forgotUrl, 303);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    resetUrl.searchParams.set("error", "reset_failed");
    return NextResponse.redirect(resetUrl, 303);
  }

  await supabase.auth.signOut();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("notice", "password_reset_done");
  return NextResponse.redirect(loginUrl, 303);
}
