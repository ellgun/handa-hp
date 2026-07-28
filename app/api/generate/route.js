import { NextResponse } from "next/server";
import { getSession } from "../../../lib/dummyAuth";
import { addDraftInput, addDraft, addActivityLog } from "../../../lib/dummyStore";

// 로컬 테스트 버전: Gemini/Stitch AI 실 호출 없이 더미 HTML·더미 운영 제안을 생성한다.
// API_CONTRACT.md API 1·2 참고 — 실 서비스 전환 시 이 함수 내부만 실제 API 호출로 교체한다.

const COLOR_HEX = {
  빨강: "#e53e3e",
  검정: "#1a1a1a",
  노랑: "#ecc94b",
  보라: "#805ad5",
  주황: "#ed8936",
  초록: "#38a169",
  파랑: "#3182ce",
  하양: "#edf2f7",
};

const REQUIRED_FIELDS = [
  "region_industry",
  "contact",
  "main_product_copy",
  "strengths",
  "color_theme",
  "mood",
  "extra_requests",
  "email",
];

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function buildDummyHtml(input) {
  const bg = COLOR_HEX[input.color_theme] || "#3182ce";
  const textColor = input.color_theme === "하양" || input.color_theme === "노랑" ? "#1a1a1a" : "#ffffff";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(input.main_product_copy || "사장님 매장")}</title>
<style>
  body { font-family: -apple-system, sans-serif; margin: 0; color: #1a1a1a; }
  header { background: ${bg}; color: ${textColor}; padding: 56px 24px; text-align: center; }
  header h1 { margin: 0 0 8px; font-size: 28px; }
  section { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
  h2 { font-size: 20px; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(input.main_product_copy || "우리 매장에 오신 것을 환영합니다")}</h1>
    <p>${escapeHtml(input.mood || "")} · ${escapeHtml(input.region_industry || "")}</p>
  </header>
  <section>
    <h2>매장 소개</h2>
    <p>${escapeHtml(input.strengths || "")}</p>
    <h2>연락처</h2>
    <p>${escapeHtml(input.contact || "")}</p>
  </section>
</body>
</html>`;
}

function buildDummySuggestion(input) {
  return {
    headline: `${input.region_industry || "우리 매장"}, 이제 온라인에서도 만나보세요`,
    intro: String(input.strengths || "").slice(0, 120),
    cta: "지금 문의하기",
    tip: "SNS 예약 연동 기능을 추가하면 재방문율을 높일 수 있어요. (더미 운영 제안)",
  };
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const input = await request.json();

  const missing = REQUIRED_FIELDS.filter((f) => !input[f] || !String(input[f]).trim());
  if (missing.length > 0) {
    return NextResponse.json({ error: `필수 항목 누락: ${missing.join(", ")}` }, { status: 400 });
  }

  // 로컬 테스트용 오류 시뮬레이션: 추가 요구사항에 "테스트실패"를 입력하면 실패 흐름을 재현한다.
  if (String(input.extra_requests).includes("테스트실패")) {
    addActivityLog({
      user_id: session.uid,
      event_type: "draft_failed",
      page_path: "/loading",
      status: "failed",
      error_code: "DUMMY_SIMULATED_FAILURE",
    });
    return NextResponse.json(
      { error: "AI 처리 중 오류가 발생했습니다. (더미 시뮬레이션)" },
      { status: 500 }
    );
  }

  const savedInput = addDraftInput({ user_id: session.uid, ...input });
  const html = buildDummyHtml(input);
  const suggestion = buildDummySuggestion(input);

  const draft = addDraft({
    user_id: session.uid,
    input_id: savedInput.id,
    region_industry: input.region_industry,
    html_content: html,
    suggestion_summary: `${suggestion.headline} / ${suggestion.tip}`,
  });

  addActivityLog({
    user_id: session.uid,
    event_type: "draft_created",
    page_path: "/loading",
    status: "success",
    metadata: { color_theme: input.color_theme, mood: input.mood },
  });

  return NextResponse.json({ draftId: draft.id, html, suggestion });
}
