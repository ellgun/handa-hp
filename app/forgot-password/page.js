import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../lib/dummyAuth";
import Icon from "../Icon";

const ERROR_MESSAGES = {
  missing_email: "이메일을 입력해주세요.",
  reset_link_invalid: "재설정 링크가 만료되었거나 올바르지 않습니다. 다시 시도해주세요.",
};

export default async function ForgotPasswordPage({ searchParams }) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = ERROR_MESSAGES[params?.error] || null;

  return (
    <section className="page login-page">
      <div className="login-hero">
        <Link href="/login" className="login-back-btn" aria-label="로그인으로">
          <Icon name="arrow_back" />
        </Link>
        <div className="login-logo-badge">
          <img src="/logo.png" alt="handa.뚝딱" />
        </div>
      </div>

      <div className="login-sheet">
      <div className="login-content">
        <h1>비밀번호 찾기</h1>
        <p className="subtitle">가입한 이메일로 재설정 링크를 보내드려요</p>

        {errorMessage && <p className="field-error">{errorMessage}</p>}

        <form action="/api/auth/forgot-password" method="post">
          <div className="pill-input">
            <Icon name="person" />
            <input type="email" name="email" placeholder="이메일" autoComplete="email" required />
          </div>
          <div className="login-submit-row">
            <span className="login-label">재설정 메일 보내기</span>
            <button type="submit" className="btn-circle-arrow" aria-label="재설정 메일 보내기">
              <Icon name="arrow_forward" />
            </button>
          </div>
        </form>

        <p className="signup-row">
          비밀번호가 기억나셨나요? <Link href="/login"><strong>로그인</strong></Link>
        </p>
      </div>
      </div>
    </section>
  );
}
