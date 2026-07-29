import { NextResponse } from "next/server";
import { getDraftById } from "../../../../lib/dataStore";

// Gemini가 생성한 시안 HTML을 가공 없이 그대로 서빙하는 실제 링크.
// /result/[draftId] 안의 iframe(src), "새 창에서 보기" 링크, 이메일로 보내는 시안 링크가
// 모두 이 주소를 가리킨다. 이메일 수신자는 우리 앱에 로그인돼 있지 않을 수 있으므로
// 로그인 확인 없이 draftId(추측 불가능한 UUID)만으로 접근을 허용한다 — 원래 공개할
// 홈페이지 시안이라 공개돼도 되는 내용이다.
// sandbox="" iframe 밖(새 창 직접 접속)에서도 안전하도록 CSP로 스크립트 실행을 막는다.
export async function GET(request, { params }) {
  const { draftId } = await params;

  const draft = await getDraftById(draftId);
  if (!draft) {
    return new NextResponse("시안을 찾을 수 없습니다.", { status: 404 });
  }

  return new NextResponse(draft.html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "script-src 'none'",
    },
  });
}
