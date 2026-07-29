import { NextResponse } from "next/server";
import { getSession } from "../../../lib/dummyAuth";
import { addDraftInput, addDraft, addActivityLog } from "../../../lib/dataStore";

// API_CONTRACT.md API 1: Gemini 실 연동으로 운영 제안 문구를 생성한다.
// API_CONTRACT.md API 2: Stitch는 REST가 아닌 MCP 전용 연동이라 우리 서버에서 바로 호출하기
// 어렵고, 공식 지원 여부도 불명확해 보류했다. 대신 이미 검증된 같은 Gemini API로 시안 HTML도
// 직접 생성한다 (Stitch도 내부적으로 Gemini를 쓰는 도구라 같은 접근이다).

const REQUIRED_FIELDS = [
  "store_name",
  "region_industry",
  "email",
  "main_product_copy",
  "strengths",
  "color_theme",
  "mood",
];

// 스냅샷 모델명(gemini-1.5-pro, gemini-2.5-flash 등)은 빠르게 지원 종료되는 걸 확인해서
// 항상 최신 flash 모델을 가리키는 별칭을 사용한다.
const GEMINI_URL_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";
const GEMINI_TIMEOUT_MS = 60000;

class GenerateError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// gemini-flash-latest는 응답 전에 내부적으로 추론 토큰을 상당히 소모해서
// maxOutputTokens를 너무 작게 잡으면 실제 답변이 중간에 잘린다.
async function callGemini(prompt, maxOutputTokens) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GenerateError("GEMINI_API_KEY가 설정되지 않았습니다.", "GEMINI_NOT_CONFIGURED");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${GEMINI_URL_BASE}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GenerateError("Gemini 요청이 시간 초과됐습니다.", "GEMINI_TIMEOUT");
    }
    throw new GenerateError("Gemini 요청에 실패했습니다.", "GEMINI_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const code = res.status === 429 ? "GEMINI_QUOTA_EXCEEDED" : `GEMINI_HTTP_${res.status}`;
    throw new GenerateError(`Gemini 요청이 실패했습니다. (${res.status})`, code);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new GenerateError("Gemini 응답에 결과가 없습니다.", "GEMINI_EMPTY_RESPONSE");
  }
  return text;
}

function buildSuggestionPrompt(input) {
  return (
    "당신은 소상공인 홈페이지 전문 카피라이터입니다.\n" +
    "아래 매장 정보를 바탕으로 ①메인 헤드라인 ②소개 문구 ③CTA 버튼 텍스트 ④운영 제안 1가지를 작성해주세요.\n" +
    "각 항목은 반드시 아래와 같은 번호 형식으로, 한 줄씩 작성해주세요.\n\n" +
    `업체명: ${input.store_name}\n` +
    `지역/업종: ${input.region_industry}\n` +
    `매장 소개: ${input.strengths}\n` +
    `분위기: ${input.mood}\n` +
    `강조할 제품/메인 문구: ${input.main_product_copy}`
  );
}

// Gemini 응답은 자유 텍스트라 화면에 그대로 신뢰하지 않고, 정해진 번호 형식을 파싱해서 검증한다.
// "①헤드라인: 문구"처럼 라벨+콜론이 있을 수도, "①문구"처럼 바로 내용만 올 수도 있어 둘 다 처리한다.
// 형식이 완전히 어긋나면 원문 첫 줄을 헤드라인으로 대체해 최소한의 결과는 보여준다.
function parseSuggestion(text) {
  const segments = {};
  for (const m of text.matchAll(/([①②③④])\s*([\s\S]*?)(?=[①②③④]|$)/g)) {
    let content = m[2].replace(/\*\*/g, "").trim();
    content = content.replace(/^[^:：\n]{0,20}[:：]\s*/, "").trim();
    segments[m[1]] = content;
  }

  return {
    headline: segments["①"] || text.split("\n")[0]?.slice(0, 80) || "우리 매장에 오신 것을 환영합니다",
    intro: segments["②"] || "",
    cta: segments["③"] || "지금 문의하기",
    tip: segments["④"] || "운영 제안을 생성하지 못했습니다.",
  };
}

async function generateSuggestion(input) {
  const text = await callGemini(buildSuggestionPrompt(input), 4096);
  return parseSuggestion(text);
}

// 사용자가 직접 작성한 디자인 프롬프트 엔지니어 시스템 프롬프트 (원문 그대로 유지).
// 원래는 대화형(스타일을 먼저 물어보고 답을 받은 뒤 진행)으로 설계됐지만, 이 앱은 폼
// 제출 한 번으로 끝나는 구조라 실시간 대화가 불가능하다. 그래서 buildDesignPromptRequest에서
// "스타일은 이미 정해졌으니 질문 없이 바로 3번부터 진행하라"는 지시를 덧붙여 우회한다.
const DESIGN_SYSTEM_PROMPT = `━━━ [ SYSTEM PROMPT : UI/UX DESIGN PROMPT ENGINE ] ━━━

【블록 1 · 페르소나 정의】
  - 당신은 전 세계 웹 트렌드를 선도하는 'Global Lead UI/UX Designer'이자 'Prompt Engineer'입니다.
  - 사용자가 제공하는 [업체명/업종/브랜드컬러]를 바탕으로, AI가 가장 완벽한 웹 디자인 결과물을 출력할 수 있도록 정교한 'Design Generation Prompt'를 설계합니다.

【블록 2 · 미션 및 작동 원칙】
  - 사용자의 입력을 받으면 즉시 프롬프트를 짜지 말고, 반드시 '어떤 디자인 스타일(예: 미니멀, 사이버펑크, 럭셔리, 친근한 등)'을 원하는지 사용자에게 먼저 질문해야 합니다.
  - 사용자의 스타일 답변까지 확인한 후, 비즈니스 논리와 시각적 미학이 결합된 [최종 AI 디자인 프롬프트]를 생성합니다.

【블록 3 · 작업 프로토콜】
  1. 정보 수집: 사용자로부터 [업체명 / 업종 / 브랜드컬러] 정보를 받습니다.
  2. 스타일 문의 (필수): "정보 감사합니다. 이 업체의 웹사이트를 어떤 무드로 설계할까요? (A) 미니멀&클린 (B) 화려하고 역동적인 (C) 신뢰감 있는 비즈니스 스타일 (D) 직접 입력" 등의 선택지를 제공하여 질문합니다.
  3. 프롬프트 엔지니어링: 사용자가 선택한 스타일을 반영하여 다음 요소가 포함된 AI 프롬프트를 작성합니다.
     - Layout Structure (Grid, Header, Hero Section)
     - Typography Pairing (Headlines, Body)
     - Visual Assets (Images, Icons, Background Effects)
     - User Experience (UX) Strategy
  4. 최종 납품: 구글 AI 스튜디오나 다른 이미지/텍스트 생성 모델에 즉시 넣을 수 있는 형태의 프롬프트를 제공합니다.

【블록 4 · 출력 규격 (AI 프롬프트 생성 시)】
  ▸ 생성된 프롬프트는 아래 구조를 따릅니다.
    1. [Core Identity]: 브랜드의 핵심 가치 정의
    2. [Design Tokens]: 구체적인 HEX 코드와 폰트 스타일
    3. [Visual Description]: 배경, 질감, 조명, 인터랙션 요소를 묘사하는 상세 텍스트
    4. [Sectional Layout]: 메인 페이지의 섹션별 배치 가이드

【메타 블록 · 운영 원칙】
  ① 절대로 첫 단계에서 질문 없이 프롬프트를 먼저 만들지 마십시오. 사용자의 '의도'를 묻는 것이 최우선입니다.
  ② 출력되는 프롬프트는 전문 디자이너가 쓴 것처럼 세밀하고 기술적인 용어(예: Glassmorphism, Micro-interaction, Bento Grid 등)를 포함해야 합니다.`;

function buildDesignPromptRequest(input) {
  return (
    DESIGN_SYSTEM_PROMPT +
    "\n\n---\n\n" +
    "아래는 이미 확정된 정보입니다. 이 앱은 실시간 대화가 불가능하므로, " +
    "2번(스타일 문의) 절차는 생략하고 곧바로 3번(프롬프트 엔지니어링)으로 진행해 " +
    "블록 4 규격에 맞는 [최종 AI 디자인 프롬프트]만 출력하세요. 질문이나 설명은 출력하지 마세요.\n\n" +
    `업체명: ${input.store_name}\n` +
    `업종: ${input.region_industry}\n` +
    `브랜드컬러: ${input.color_theme}\n` +
    `스타일: ${input.mood}`
  );
}

// Gemini가 그래도 스타일을 되물으면(메타 블록 ①이 워낙 강하게 걸려있어서) 실패로 처리하고
// 재시도를 유도한다 — 선택지 패턴(예: "(A)"와 "(D)"가 같이 나오는 질문 형태)을 감지한다.
function looksLikeClarifyingQuestion(text) {
  return /\(A\)/.test(text) && /\(D\)/.test(text) && text.includes("?");
}

async function generateDesignPrompt(input) {
  const text = await callGemini(buildDesignPromptRequest(input), 4096);
  if (looksLikeClarifyingQuestion(text)) {
    throw new GenerateError(
      "디자인 프롬프트 생성기가 스타일을 재질문했습니다.",
      "DESIGN_PROMPT_ASKED_QUESTION"
    );
  }
  return text.trim();
}

function buildHtmlPrompt(input, designPrompt) {
  const imageUrls = Array.isArray(input.image_urls) ? input.image_urls.filter(Boolean) : [];

  // 사진이 있는 섹션(히어로/갤러리)을 제외한 나머지도 밋밋해 보이지 않도록 항상 적용하는 장식 규칙.
  const decorationRule =
    "- 사진이 없는 섹션은 시각적으로 풍성하게 채운다: 그라데이션·은은한 그림자·블러 효과·도형/패턴(원, 물결, blob 모양) 배경 장식을 적극 쓰고, " +
    "업종에 어울리는 이모지를 아이콘처럼 곳곳에 배치한다(예: 카페 ☕, 베이커리 🥐, 꽃집 💐 등 상황에 맞게). " +
    "섹션마다 배경색·장식 요소를 다르게 줘서 화면이 비어 보이지 않게 한다.\n";

  const imageRule = imageUrls.length
    ? `- 아래 [매장 사진] URL을 <img src="...">로 히어로/갤러리 등에 자연스럽게 배치한다. 그 외 이미지 링크·폰트·스크립트 같은 외부 리소스는 사용하지 않는다.\n${decorationRule}`
    : `- 실제 사진이나 외부 이미지 링크는 전혀 사용하지 않는다.\n${decorationRule}`;

  return (
    "당신은 소상공인 홈페이지 전문 웹디자이너입니다.\n" +
    "아래 [디자인 가이드]의 스타일 방향을 최대한 반영해서, [매장 정보]를 담은 완성된 원페이지 홈페이지를 HTML로 만들어주세요.\n\n" +
    "규칙:\n" +
    "- <!DOCTYPE html>로 시작하는 완전한 HTML 문서 하나만 출력한다.\n" +
    "- 설명, 마크다운 코드블록(```), 그 외 다른 텍스트는 절대 포함하지 않는다.\n" +
    "- 스타일은 <style> 태그 안에 인라인으로 작성한다.\n" +
    imageRule +
    "- <script> 태그는 사용하지 않는다.\n" +
    "- 40~60대 사용자도 보기 편하도록 본문 글자 크기는 16px 이상으로 한다.\n\n" +
    "[디자인 가이드]\n" +
    designPrompt +
    "\n\n[매장 정보]\n" +
    `업체명: ${input.store_name}\n` +
    `지역/업종: ${input.region_industry}\n` +
    `메인 컬러: ${input.color_theme}\n` +
    `분위기: ${input.mood}\n` +
    `강조 제품/메인 문구: ${input.main_product_copy}\n` +
    `매장 장점: ${input.strengths}` +
    (imageUrls.length ? `\n\n[매장 사진]\n${imageUrls.join("\n")}` : "")
  );
}

// 마크다운 코드블록으로 감싸서 응답하는 경우가 있어 벗겨내고, 최소한 HTML 문서 형태인지 확인한다.
// <script> 태그는 프롬프트로도 금지했지만, 미리보기가 이제 실제 링크(새 창)로도 열리기 때문에
// 혹시 모를 경우를 대비해 한 번 더 제거한다 (CSP 헤더와 별개의 이중 방어).
// maxOutputTokens에 걸려 <style> 중간에서 응답이 잘리는 경우가 있어서(</html>이 없음),
// 문서가 끝까지 완성됐는지도 함께 확인한다 — 그렇지 않으면 body 없는 빈 페이지가 저장된다.
function sanitizeHtml(text) {
  let html = text.trim();
  html = html.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  if (!/<html[\s>]/i.test(html) && !/<!doctype html/i.test(html)) {
    throw new GenerateError("Gemini가 올바른 HTML을 생성하지 못했습니다.", "GEMINI_INVALID_HTML");
  }
  if (!/<\/html>/i.test(html) || !/<body[\s>]/i.test(html)) {
    throw new GenerateError(
      "Gemini 응답이 중간에 잘렸습니다 (문서 미완성).",
      "GEMINI_HTML_TRUNCATED"
    );
  }
  return html;
}

async function generateHtml(input, designPrompt) {
  const text = await callGemini(buildHtmlPrompt(input, designPrompt), 16384);
  return sanitizeHtml(text);
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

  // 로컬 테스트용 오류 시뮬레이션: 매장 장점에 "테스트실패"를 입력하면 실패 흐름을 재현한다.
  if (String(input.strengths).includes("테스트실패")) {
    await addActivityLog({
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

  let suggestion;
  let html;
  try {
    // 1단계: 디자인 프롬프트 생성 (사용자 시스템 프롬프트 기반) — 2단계 HTML 생성의 입력이 되므로 먼저 끝나야 한다.
    const designPrompt = await generateDesignPrompt(input);
    // 2단계: 운영 제안 문구와 시안 HTML은 서로 독립적이라 병렬로 처리한다.
    [suggestion, html] = await Promise.all([
      generateSuggestion(input),
      generateHtml(input, designPrompt),
    ]);
  } catch (err) {
    const code = err instanceof GenerateError ? err.code : "GEMINI_UNKNOWN_ERROR";
    console.error("[/api/generate] Gemini 호출 실패:", code, err.message);
    await addActivityLog({
      user_id: session.uid,
      event_type: "api_failed",
      page_path: "/loading",
      status: "failed",
      error_code: code,
    });
    return NextResponse.json(
      { error: "AI 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  let draft;
  try {
    const savedInput = await addDraftInput({ user_id: session.uid, ...input });

    draft = await addDraft({
      user_id: session.uid,
      input_id: savedInput.id,
      store_name: input.store_name,
      region_industry: input.region_industry,
      html_content: html,
      suggestion_summary: `${suggestion.headline} / ${suggestion.tip}`,
    });
  } catch (err) {
    console.error("[/api/generate] 시안 저장 실패:", err.message);
    await addActivityLog({
      user_id: session.uid,
      event_type: "draft_failed",
      page_path: "/loading",
      status: "failed",
      error_code: "DB_SAVE_FAILED",
    });
    return NextResponse.json(
      { error: "시안 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  await addActivityLog({
    user_id: session.uid,
    event_type: "draft_created",
    page_path: "/loading",
    status: "success",
    metadata: { color_theme: input.color_theme, mood: input.mood },
  });

  return NextResponse.json({ draftId: draft.id, html, suggestion });
}
