import { redirect } from "next/navigation";
import { getSession } from "../../lib/dummyAuth";
import Icon from "../Icon";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.75 2.99-4.34 2.99-7.31Z"
      />
      <path
        fill="#34A853"
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.23-2.5c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.06v2.59A10 10 0 0 0 10 20Z"
      />
      <path
        fill="#FBBC05"
        d="M4.41 11.92A6 6 0 0 1 4.09 10c0-.67.11-1.32.32-1.92V5.49H1.06A10 10 0 0 0 0 10c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0 6.09 0 2.7 2.24 1.06 5.49l3.35 2.59C5.2 5.73 7.4 3.98 10 3.98Z"
      />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <section className="page login-page">
      <div className="login-blob blob-top" aria-hidden="true" />
      <div className="login-blob blob-bottom" aria-hidden="true" />

      <div className="login-content">
        <h1>안녕하세요</h1>
        <p className="subtitle">계정에 로그인하세요</p>

        {/* 이메일/비밀번호 입력은 시각 요소만 제공하며, 제출 시 실제 인증 검사 없이
            더미 세션이 부여된다. Google 로그인(/api/auth/google)은 별도로 실제 Supabase Auth를 사용한다. */}
        <form action="/api/auth/login" method="post">
          <div className="pill-input">
            <Icon name="person" />
            <input type="text" name="email_display" placeholder="이메일" autoComplete="off" />
          </div>
          <div className="pill-input">
            <Icon name="lock" />
            <input type="password" name="password_display" placeholder="비밀번호" autoComplete="off" />
            <Icon name="visibility" />
          </div>
          <div className="forgot-row">
            <span>비밀번호를 잊으셨나요?</span>
          </div>
          <div className="login-submit-row">
            <span className="login-label">로그인</span>
            <button type="submit" className="btn-circle-arrow" aria-label="로그인">
              <Icon name="arrow_forward" />
            </button>
          </div>
        </form>

        <p className="login-divider">또는</p>

        <form action="/api/auth/google" method="post">
          <button type="submit" className="btn-google">
            <GoogleIcon />
            구글 계정으로 로그인
          </button>
        </form>

        <p className="dummy-note">
          Google 계정으로 로그인해주세요. 이메일/비밀번호 입력은 실제 인증 없이 임시 계정으로
          로그인되는 테스트용 기능입니다.
        </p>

        <p className="signup-row">
          계정이 없으신가요? <strong>회원가입</strong>
        </p>
        <p className="privacy-note">로그인 시 이메일 등 최소한의 정보만 사용합니다.</p>
      </div>
    </section>
  );
}
