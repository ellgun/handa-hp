import { cookies } from "next/headers";

// 로컬 테스트 버전 전용 더미 로그인 세션.
// PROJECT_BRIEF.md 결정에 따라 실제 Google OAuth(Supabase Auth) 없이
// 쿠키 기반 더미 세션으로 로그인 상태를 흉내낸다.
// 실 서비스 전환 시 이 파일을 Supabase Auth 세션 처리로 교체한다.

export const SESSION_COOKIE = "handa_dummy_session";

export async function getSession() {
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
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
