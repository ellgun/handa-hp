import { createSupabaseServerClient } from "./supabaseServer";

// Google 로그인과 이메일/비밀번호 로그인 모두 실제 Supabase Auth 세션을 사용한다.
// 세션 발급(signInWithPassword/signUp/OAuth)과 쿠키 반영은 @supabase/ssr 서버
// 클라이언트가 처리하므로, 이 파일은 현재 세션을 읽고 로그아웃하는 역할만 한다.

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    uid: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
    provider: user.app_metadata?.provider || "email",
  };
}

export async function clearSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
