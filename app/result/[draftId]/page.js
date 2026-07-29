import { redirect } from "next/navigation";
import { getSession } from "../../../lib/dummyAuth";
import { getDraftById } from "../../../lib/dataStore";
import ResultView from "./ResultView";

export default async function ResultPage({ params }) {
  const { draftId } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const draft = await getDraftById(draftId);
  if (!draft || draft.user_id !== session.uid) {
    redirect("/mypage");
  }

  return (
    <section className="page result-page">
      <h1>시안이 완성됐어요</h1>
      <ResultView draft={draft} />
    </section>
  );
}
