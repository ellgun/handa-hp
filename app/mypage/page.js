import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../lib/dummyAuth";
import { getProfileById, getDraftsByUser } from "../../lib/dummyStore";
import ResendButton from "./ResendButton";

export default async function MyPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = getProfileById(session.uid);
  const drafts = getDraftsByUser(session.uid);

  return (
    <section className="page mypage">
      <h1>마이페이지</h1>
      <p>{profile?.email || session.email}</p>

      {drafts.length === 0 ? (
        <p>아직 생성한 시안이 없습니다. <Link href="/input">시안 만들러 가기</Link></p>
      ) : (
        drafts.map((draft) => (
          <div className="draft-card" key={draft.id}>
            <p>
              <strong>{draft.region_industry}</strong>
              <br />
              생성일시: {new Date(draft.created_at).toLocaleString("ko-KR")}
              <br />
              이메일 발송: {draft.email_sent ? "발송 완료" : "미발송"}
            </p>
            <div className="result-actions">
              <Link href={`/result/${draft.id}`} className="cta">
                시안 다시보기
              </Link>
              <ResendButton draftId={draft.id} />
            </div>
          </div>
        ))
      )}
    </section>
  );
}
