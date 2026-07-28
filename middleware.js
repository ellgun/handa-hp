import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ROUTES_AND_FLOWS.md 보호 규칙: 비로그인 사용자는 /input, /result, /mypage, /admin 접근 시
// /login으로 리디렉션한다. 관리자 role 검사는 fs 접근이 필요해 각 페이지(Server Component)에서 수행한다.
// 이메일/비밀번호 더미 로그인, 관리자 테스트 로그인은 더미 쿠키를 그대로 사용하고,
// Google 로그인만 실제 Supabase 세션을 사용하므로 두 가지를 모두 확인한다.

const SESSION_COOKIE = "handa_dummy_session";

export async function middleware(request) {
  const dummySession = request.cookies.get(SESSION_COOKIE)?.value;
  if (dummySession) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/input/:path*", "/result/:path*", "/mypage/:path*", "/admin/:path*"],
};
