import "./globals.css";
import Link from "next/link";
import { getSession } from "../lib/dummyAuth";
import { getProfileById } from "../lib/dataStore";
import BottomNav from "./BottomNav";

export const metadata = {
  title: "한다뚝딱 (handa.뚝딱)",
  description: "사장님 홈페이지, 5분이면 뚝딱 — 로컬 테스트 버전",
};

export default async function RootLayout({ children }) {
  const session = await getSession();
  const profile = session ? await getProfileById(session.uid) : null;
  const isAdmin = profile?.role === "admin";

  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=swap"
        />
      </head>
      <body>
        <header className="site-header">
          <Link href="/" className="logo">
            handa<span className="logo-dot">.</span>뚝딱
          </Link>
          <nav className="user-nav">
            {session ? (
              <>
                <span className="user-info">
                  {session.avatarUrl && (
                    <img src={session.avatarUrl} alt="" className="user-avatar" />
                  )}
                  <span className="user-name">{session.name || session.email}</span>
                </span>
                <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
                  <button type="submit">로그아웃</button>
                </form>
              </>
            ) : (
              <Link href="/login">로그인</Link>
            )}
          </nav>
        </header>
        <main className={session ? "with-bottom-nav" : ""}>{children}</main>
        {session && <BottomNav isAdmin={isAdmin} />}
      </body>
    </html>
  );
}
