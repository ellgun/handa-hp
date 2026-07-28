import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

// Google 로그인 버튼 전용 엔드포인트.
// 기존 /api/auth/login(이메일/비밀번호 더미, 관리자 테스트 로그인)은 건드리지 않는다.
export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  const origin = new URL(request.url).origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      // 브라우저에 이미 로그인된 Google 세션이 있어도 매번 계정 선택 화면을 띄운다.
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_login_failed");
    return NextResponse.redirect(loginUrl, 303);
  }

  // 303으로 명시하지 않으면 원래 요청(POST)의 메서드가 유지되어
  // Supabase authorize 엔드포인트가 405를 반환한다.
  return NextResponse.redirect(data.url, 303);
}
