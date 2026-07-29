import { NextResponse } from "next/server";
import { getSession } from "../../../lib/dummyAuth";
import {
  getDraftById,
  getDraftInputById,
  updateDraft,
  addEmailLog,
  addActivityLog,
} from "../../../lib/dataStore";

// 로컬 테스트 버전: Agentria API 실 호출 없이 발송 성공/실패를 흉내낸다.
// API_CONTRACT.md API 6 참고 — Agentria 스펙 확인 후 이 함수 내부만 실제 호출로 교체한다.
// 더미 테스트용: 수신 이메일이 "fail@"로 시작하면 발송 실패 흐름을 재현할 수 있다.

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { draftId } = await request.json();
  const draft = await getDraftById(draftId);
  if (!draft || draft.user_id !== session.uid) {
    return NextResponse.json({ error: "시안을 찾을 수 없습니다." }, { status: 404 });
  }

  await addActivityLog({
    user_id: session.uid,
    event_type: "email_send_requested",
    page_path: "/result",
    status: "success",
  });

  const draftInput = await getDraftInputById(draft.input_id);
  const receiptEmail = draftInput?.email || "";
  const shouldFail = receiptEmail.startsWith("fail@");

  if (shouldFail) {
    await addEmailLog({
      user_id: session.uid,
      draft_id: draft.id,
      status: "failed",
      http_status: 500,
      error_code: "DUMMY_SEND_FAILED",
    });
    await addActivityLog({
      user_id: session.uid,
      event_type: "email_send_failed",
      page_path: "/result",
      status: "failed",
      error_code: "DUMMY_SEND_FAILED",
    });
    return NextResponse.json(
      { error: "이메일 발송에 실패했습니다. (더미 시뮬레이션)" },
      { status: 500 }
    );
  }

  await updateDraft(draft.id, { email_sent: true });
  await addEmailLog({ user_id: session.uid, draft_id: draft.id, status: "sent", http_status: 200 });
  await addActivityLog({
    user_id: session.uid,
    event_type: "email_send_succeeded",
    page_path: "/result",
    status: "success",
  });

  return NextResponse.json({ status: "sent" });
}
