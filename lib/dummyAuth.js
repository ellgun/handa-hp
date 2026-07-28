import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabaseServer";

// 이메일/비밀번호 더미 로그인, 관리자 테스트 로그인은 계속 이 쿠키 기반 세션을 사용한다.
// Google 로그인만 실제 Supabase Auth 세션을 사용하며, getSession()이 두 방식을 함께 지원한다.

export const SESSION_COOKIE = "handa_dummy_session";

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return {
      uid: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      provider: "google",
    };
  }

  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setSession(session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
