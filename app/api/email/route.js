import { NextResponse } from "next/server";
import { getSession } from "../../../lib/dummyAuth";
import {
  getDraftById,
  getDraftInputById,
  updateDraft,
  addEmailLog,
  addActivityLog,
} from "../../../lib/dataStore";

// API_CONTRACT.md API 6: Resend로 시안 링크를 이메일 발송한다 (Agentria는 실제 스펙이
// 확인되지 않아 사용자 지시로 보류, 대신 문서화된 Resend REST API를 직접 호출한다).
// https://resend.com/docs/api-reference/emails/send-email

const RESEND_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "handa.뚝딱 <onboarding@resend.dev>";

class SendError extends Error {
  constructor(message, code, httpStatus) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

function buildEmailHtml({ storeName, previewUrl, suggestionSummary }) {
  return (
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">` +
    `<h1 style="font-size:20px;">${storeName} 홈페이지 시안이 도착했어요</h1>` +
    `<p style="color:#555;">${suggestionSummary || ""}</p>` +
    `<p><a href="${previewUrl}" style="display:inline-block;padding:12px 24px;background:#ff6b1a;` +
    `color:#fff;text-decoration:none;border-radius:24px;">시안 보러 가기</a></p>` +
    `<p style="color:#999;font-size:12px;">한다뚝딱 (handa.뚝딱)</p>` +
    `</div>`
  );
}

async function sendViaResend({ to, storeName, previewUrl, suggestionSummary }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new SendError("RESEND_API_KEY가 설정되지 않았습니다.", "RESEND_NOT_CONFIGURED", 500);
  }

  let res;
  try {
    res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: `${storeName} 홈페이지 시안이 완성됐어요`,
        html: buildEmailHtml({ storeName, previewUrl, suggestionSummary }),
      }),
    });
  } catch (err) {
    throw new SendError("Resend 요청에 실패했습니다.", "RESEND_NETWORK_ERROR", 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new SendError(
      data?.message || `Resend 요청이 실패했습니다. (${res.status})`,
      data?.name || `RESEND_HTTP_${res.status}`,
      res.status
    );
  }

  return { messageId: data.id, httpStatus: res.status };
}

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
  const origin = new URL(request.url).origin;
  const previewUrl = `${origin}/result/${draft.id}/preview`;

  try {
    const { messageId, httpStatus } = await sendViaResend({
      to: receiptEmail,
      storeName: draft.store_name || draft.region_industry || "매장",
      previewUrl,
      suggestionSummary: draft.suggestion_summary,
    });

    await updateDraft(draft.id, { email_sent: true });
    await addEmailLog({
      user_id: session.uid,
      draft_id: draft.id,
      status: "sent",
      http_status: httpStatus,
      provider_request_id: messageId,
    });
    await addActivityLog({
      user_id: session.uid,
      event_type: "email_send_succeeded",
      page_path: "/result",
      status: "success",
    });

    return NextResponse.json({ status: "sent" });
  } catch (err) {
    const code = err instanceof SendError ? err.code : "RESEND_UNKNOWN_ERROR";
    const httpStatus = err instanceof SendError ? err.httpStatus : 500;
    console.error("[/api/email] Resend 발송 실패:", code, err.message);

    await addEmailLog({
      user_id: session.uid,
      draft_id: draft.id,
      status: "failed",
      http_status: httpStatus,
      error_code: code,
    });
    await addActivityLog({
      user_id: session.uid,
      event_type: "email_send_failed",
      page_path: "/result",
      status: "failed",
      error_code: code,
    });

    return NextResponse.json(
      { error: "이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
