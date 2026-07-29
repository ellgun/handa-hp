"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultView({ draft }) {
  const router = useRouter();
  const [status, setStatus] = useState(draft.email_sent ? "sent" : "idle");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendEmail() {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "이메일 발송에 실패했습니다.");
      }
      setStatus("sent");
      setMessage("이메일 발송에 성공했습니다. (더미 발송)");
    } catch (err) {
      setStatus("failed");
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  const previewUrl = `/result/${draft.id}/preview`;

  return (
    <>
      <iframe
        className="iframe-preview"
        title="홈페이지 시안 미리보기"
        src={previewUrl}
        sandbox=""
      />
      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="preview-link">
        새 창에서 시안 보기
      </a>

      <div className="suggestion-card">
        <h2>운영 제안</h2>
        <p>{draft.suggestion_summary}</p>
      </div>

      {message && (
        <p className={`status-message ${status === "failed" ? "error" : "success"}`}>{message}</p>
      )}

      <div className="result-actions">
        <button type="button" onClick={handleSendEmail} disabled={sending}>
          {sending ? "발송 중..." : "이메일로 받기"}
        </button>
        <button type="button" onClick={() => router.push("/mypage")}>
          마이페이지에 저장
        </button>
        <button type="button" onClick={() => router.push("/input")}>
          다시 만들기
        </button>
      </div>
    </>
  );
}
