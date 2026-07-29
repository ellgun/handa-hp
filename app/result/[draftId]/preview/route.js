import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/dummyAuth";
import { getDraftById } from "../../../../lib/dataStore";

// Gemini가 생성한 시안 HTML을 가공 없이 그대로 서빙하는 실제 링크.
// /result/[draftId] 안의 iframe(src)과 "새 창에서 보기" 링크가 둘 다 이 주소를 가리킨다.
// sandbox="" iframe 밖(새 창 직접 접속)에서도 안전하도록 CSP로 스크립트 실행을 막는다.
export async function GET(request, { params }) {
  const { draftId } = await params;
  const session = await getSession();
  if (!session) {
    return new NextResponse("로그인이 필요합니다.", { status: 401 });
  }

  const draft = await getDraftById(draftId);
  if (!draft || draft.user_id !== session.uid) {
    return new NextResponse("시안을 찾을 수 없습니다.", { status: 404 });
  }

  return new NextResponse(draft.html_content, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "script-src 'none'",
    },
  });
}
