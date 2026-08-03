import Link from "next/link";
import { getSession } from "../lib/dummyAuth";
import Icon from "./Icon";

const STEPS = [
  { icon: "edit_note", label: "정보 입력" },
  { icon: "auto_awesome", label: "AI 생성" },
  { icon: "mail", label: "이메일 수신" },
];

export default async function HomePage() {
  const session = await getSession();

  return (
    <section className="page home-page">
      <h1>사장님 홈페이지, 5분이면 뚝딱!</h1>
      <p>업종과 매장 정보만 입력하면 AI가 홈페이지 시안과 운영 제안을 만들어드립니다.</p>

      <div className="step-list">
        {STEPS.map((step) => (
          <div className="step-list-item" key={step.label}>
            <span className="step-list-icon">
              <Icon name={step.icon} />
            </span>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {session ? (
        <Link href="/input" className="cta">
          시작하기
        </Link>
      ) : (
        <Link href="/login" className="cta">
          로그인하고 시작하기
        </Link>
      )}
    </section>
  );
}
