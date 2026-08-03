import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../lib/dummyAuth";
import Icon from "../Icon";

const ERROR_MESSAGES = {
  missing_fields: "이메일과 비밀번호를 모두 입력해주세요.",
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
  google_login_failed: "Google 로그인에 실패했습니다. 다시 시도해주세요.",
};

const NOTICE_MESSAGES = {
  check_email: "가입 확인 이메일을 보냈습니다. 이메일함을 확인한 뒤 로그인해주세요.",
  signed_up: "회원가입이 완료됐습니다. 로그인해주세요.",
};

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

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = ERROR_MESSAGES[params?.error] || null;
  const noticeMessage = NOTICE_MESSAGES[params?.notice] || null;

  return (
    <section className="page login-page">
      <div className="login-blob blob-top" aria-hidden="true" />
      <div className="login-blob blob-bottom" aria-hidden="true" />

      <div className="login-content">
        <h1>안녕하세요</h1>
        <p className="subtitle">계정에 로그인하세요</p>

        {noticeMessage && <p className="field-error" style={{ color: "var(--brand)" }}>{noticeMessage}</p>}
        {errorMessage && <p className="field-error">{errorMessage}</p>}

        <form action="/api/auth/login" method="post">
          <div className="pill-input">
            <Icon name="person" />
            <input type="email" name="email" placeholder="이메일" autoComplete="email" required />
          </div>
          <div className="pill-input">
            <Icon name="lock" />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
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

        <p className="signup-row">
          계정이 없으신가요? <Link href="/signup"><strong>회원가입</strong></Link>
        </p>
        <p className="privacy-note">로그인 시 이메일 등 최소한의 정보만 사용합니다.</p>
      </div>
    </section>
  );
}
