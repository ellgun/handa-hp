"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "입력 내용을 분석하고 있어요...",
  "홈페이지 구조를 설계하고 있어요...",
  "문구와 디자인을 완성하고 있어요...",
];

const PENDING_INPUT_KEY = "handa_pending_input";

export default function LoadingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_INPUT_KEY);
    if (!raw) {
      router.replace("/input");
      return;
    }

    let cancelled = false;
    setError(null);

    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      router.replace("/input");
      return;
    }

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "AI 처리 중 오류가 발생했습니다.");
        }
        if (cancelled) return;
        localStorage.removeItem(PENDING_INPUT_KEY);
        router.replace(`/result/${data.draftId}`);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <section className="page loading-page">
      <h1>AI가 홈페이지 시안을 만들고 있어요</h1>
      <div className="step-progress">
        <div className="step-progress-label">
          <span>2단계 / 3단계</span>
          <span>AI 생성 중</span>
        </div>
        <div className="step-progress-track">
          <div className="step-progress-fill" style={{ width: "66%" }} />
        </div>
      </div>
      {!error ? (
        <>
          <p className="loading-message">{STEPS[stepIndex]}</p>
          <div className="spinner" aria-hidden="true" />
          <button type="button" onClick={() => router.push("/input")}>
            취소
          </button>
        </>
      ) : (
        <div className="error-box">
          <p>잠시 후 다시 시도해 주세요.</p>
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)}>
            다시 시도하기
          </button>
        </div>
      )}
    </section>
  );
}
