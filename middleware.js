import { NextResponse } from "next/server";

// ROUTES_AND_FLOWS.md 보호 규칙: 비로그인 사용자는 /input, /result, /mypage, /admin 접근 시
// /login으로 리디렉션한다. 관리자 role 검사는 fs 접근이 필요해 각 페이지(Server Component)에서 수행한다.

const SESSION_COOKIE = "handa_dummy_session";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/input/:path*", "/result/:path*", "/mypage/:path*", "/admin/:path*"],
};
