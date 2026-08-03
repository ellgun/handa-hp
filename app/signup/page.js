import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../lib/dummyAuth";
import Icon from "../Icon";

const ERROR_MESSAGES = {
  missing_fields: "이메일과 비밀번호를 모두 입력해주세요.",
  password_mismatch: "비밀번호가 서로 일치하지 않습니다.",
  weak_password: "비밀번호는 6자 이상이어야 합니다.",
  email_taken: "이미 가입된 이메일입니다. 로그인해주세요.",
  signup_failed: "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.",
};

export default async function SignupPage({ searchParams }) {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  const params = await searchParams;
  const errorMessage = ERROR_MESSAGES[params?.error] || null;

  return (
    <section className="page login-page">
      <div className="login-hero">
        <Link href="/" className="login-back-btn" aria-label="홈으로">
          <Icon name="arrow_back" />
        </Link>
        <div className="login-logo-badge">
          <img src="/logo.png" alt="handa.뚝딱" />
        </div>
      </div>

      <div className="login-sheet">
      <div className="login-content">
        <h1>회원가입</h1>
        <p className="subtitle">이메일과 비밀번호로 계정을 만드세요</p>

        {errorMessage && <p className="field-error">{errorMessage}</p>}

        <form action="/api/auth/signup" method="post">
          <div className="pill-input">
            <Icon name="person" />
            <input type="email" name="email" placeholder="이메일" autoComplete="email" required />
          </div>
          <div className="pill-input">
            <Icon name="lock" />
            <input
              type="password"
              name="password"
              placeholder="비밀번호 (6자 이상)"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="pill-input">
            <Icon name="lock" />
            <input
              type="password"
              name="password_confirm"
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="login-submit-row">
            <span className="login-label">가입하기</span>
            <button type="submit" className="btn-circle-arrow" aria-label="회원가입">
              <Icon name="arrow_forward" />
            </button>
          </div>
        </form>

        <p className="signup-row">
          이미 계정이 있으신가요? <Link href="/login"><strong>로그인</strong></Link>
        </p>
        <p className="privacy-note">가입 시 이메일 등 최소한의 정보만 사용합니다.</p>
      </div>
      </div>
    </section>
  );
}
