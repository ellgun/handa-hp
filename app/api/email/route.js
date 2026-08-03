import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSession } from "../../../lib/dummyAuth";
import {
  getDraftById,
  getDraftInputById,
  updateDraft,
  addEmailLog,
  addActivityLog,
} from "../../../lib/dataStore";

// API_CONTRACT.md API 6: Gmail SMTP(사용자 본인 Gmail 계정 + 앱 비밀번호)로 시안 링크를
// 이메일 발송한다. Resend는 발신 도메인 인증 전에는 계정 소유자 본인 이메일로만 발송
// 가능해서 실제 고객에게 발송이 막혀 있었고(도메인 구매 없이 진행하기로 함), Gmail은
// 자체 도메인을 이미 소유하고 있어 도메인 인증 없이 임의 수신자에게 발송 가능하다.

class SendError extends Error {
  constructor(message, code, smtpCode) {
    super(message);
    this.code = code;
    this.smtpCode = smtpCode;
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

let cachedTransporter = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new SendError("GMAIL_USER/GMAIL_APP_PASSWORD가 설정되지 않았습니다.", "GMAIL_NOT_CONFIGURED", null);
  }
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

async function sendViaGmail({ to, storeName, previewUrl, suggestionSummary }) {
  const transporter = getTransporter();

  let info;
  try {
    info = await transporter.sendMail({
      from: `"handa.뚝딱" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${storeName} 홈페이지 시안이 완성됐어요`,
      html: buildEmailHtml({ storeName, previewUrl, suggestionSummary }),
    });
  } catch (err) {
    throw new SendError(err.message || "Gmail 발송에 실패했습니다.", "GMAIL_SEND_ERROR", err.responseCode || null);
  }

  const smtpCode = Number.parseInt(String(info.response || "").split(" ")[0], 10);
  return { messageId: info.messageId, smtpCode: Number.isFinite(smtpCode) ? smtpCode : null };
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
    const { messageId, smtpCode } = await sendViaGmail({
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
      http_status: smtpCode,
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
    const code = err instanceof SendError ? err.code : "GMAIL_UNKNOWN_ERROR";
    const smtpCode = err instanceof SendError ? err.smtpCode : null;
    console.error("[/api/email] Gmail 발송 실패:", code, err.message);

    await addEmailLog({
      user_id: session.uid,
      draft_id: draft.id,
      status: "failed",
      http_status: smtpCode,
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
