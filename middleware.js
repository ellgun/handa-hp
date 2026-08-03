import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ROUTES_AND_FLOWS.md 보호 규칙: 비로그인 사용자는 /input, /result, /mypage, /admin 접근 시
// /login으로 리디렉션한다. 관리자 role 검사는 DB 접근이 필요해 각 페이지(Server Component)에서
// 수행한다. 로그인(Google, 이메일/비밀번호) 모두 실제 Supabase 세션을 쓰므로 이 하나만 확인한다.

export async function middleware(request) {
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
