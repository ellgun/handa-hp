"use client";

import { useState } from "react";

export default function ResendButton({ draftId }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function handleResend() {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "재발송에 실패했습니다.");
      }
      setFailed(false);
      setMessage("재발송에 성공했습니다. (더미 발송)");
    } catch (err) {
      setFailed(true);
      setMessage(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleResend} disabled={sending}>
        {sending ? "발송 중..." : "이메일 재발송"}
      </button>
      {message && (
        <p className={`status-message ${failed ? "error" : "success"}`}>{message}</p>
      )}
    </div>
  );
}
