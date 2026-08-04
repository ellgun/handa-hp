import { redirect } from "next/navigation";
import { getSession } from "../../lib/dummyAuth";
import Icon from "../Icon";

const ERROR_MESSAGES = {
  password_mismatch: "비밀번호가 서로 일치하지 않습니다.",
  weak_password: "비밀번호는 6자 이상이어야 합니다.",
  reset_failed: "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.",
};

export default async function ResetPasswordPage({ searchParams }) {
  const session = await getSession();
  if (!session) {
    redirect("/forgot-password?error=reset_link_invalid");
  }

  const params = await searchParams;
  const errorMessage = ERROR_MESSAGES[params?.error] || null;

  return (
    <section className="page login-page">
      <div className="login-hero">
        <div className="login-logo-badge">
          <img src="/logo.png" alt="handa.뚝딱" />
        </div>
      </div>

      <div className="login-sheet">
      <div className="login-content">
        <h1>새 비밀번호 설정</h1>
        <p className="subtitle">새로 사용할 비밀번호를 입력해주세요</p>

        {errorMessage && <p className="field-error">{errorMessage}</p>}

        <form action="/api/auth/reset-password" method="post">
          <div className="pill-input">
            <Icon name="lock" />
            <input
              type="password"
              name="password"
              placeholder="새 비밀번호 (6자 이상)"
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
              placeholder="새 비밀번호 확인"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="login-submit-row">
            <span className="login-label">비밀번호 변경</span>
            <button type="submit" className="btn-circle-arrow" aria-label="비밀번호 변경">
              <Icon name="arrow_forward" />
            </button>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
}
