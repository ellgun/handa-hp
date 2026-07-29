"use client";

import { useEffect, useRef, useState } from "react";
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
  // React 개발 모드는 effect를 두 번 실행해서, 가드가 없으면 같은 attempt에 대해
  // /api/generate가 두 번 호출된다 (Gemini 요청도 그만큼 배로 나가 429를 유발할 수 있다).
  const startedForAttempt = useRef(-1);

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

    if (startedForAttempt.current === attempt) {
      return;
    }
    startedForAttempt.current = attempt;

    setError(null);

    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      router.replace("/input");
      return;
    }

    // cleanup에서 취소 플래그를 세우지 않는다 — 개발 모드 StrictMode가 이 effect를
    // (마운트→클린업→재마운트) 순서로 두 번 실행하는데, 위 가드 덕분에 fetch 자체는
    // 첫 실행에서 딱 한 번만 나간다. 여기서 취소 플래그까지 세우면 그 유일한 요청의
    // 응답조차 "취소됨" 처리되어 화면 전환이 영영 일어나지 않는다.
    // 대신 응답이 왔을 때 startedForAttempt.current가 여전히 이 attempt인지만 확인해서,
    // 그 사이 "다시 시도"로 더 새로운 attempt가 시작됐다면 오래된 응답은 무시한다.
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
        if (startedForAttempt.current !== attempt) return;
        localStorage.removeItem(PENDING_INPUT_KEY);
        router.replace(`/result/${data.draftId}`);
      })
      .catch((err) => {
        if (startedForAttempt.current !== attempt) return;
        setError(err.message);
      });
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
