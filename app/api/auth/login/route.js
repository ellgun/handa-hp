import { NextResponse } from "next/server";
import { setSession } from "../../../../lib/dummyAuth";
import { ensureProfile, addActivityLog } from "../../../../lib/dataStore";

// 개발용 더미 로그인 (이메일/비밀번호 입력은 시각 요소만 제공).
// 실제 Google OAuth 호출 없음. 항상 일반 사용자 권한만 부여한다 —
// 과거에는 role=admin을 폼 파라미터로 받아 관리자 세션을 내줬으나,
// 배포 환경에서 인증 없이 누구나 관리자 권한을 얻을 수 있는 취약점이라 제거함.
// 관리자 권한은 Supabase profiles 테이블에서 role을 직접 admin으로 승격해서 부여한다.
// 로드맵 마지막 단계에서 이 더미 로그인 자체도 제거 예정.
// profiles.id가 uuid 컬럼이라 고정된 UUID 리터럴을 사용한다.
const DUMMY_USER = { id: "11111111-1111-1111-1111-111111111111", email: "user@example.com" };

export async function POST(request) {
  const user = DUMMY_USER;

  await setSession({ uid: user.id, email: user.email });
  await ensureProfile(user.id, user.email, "user");
  await addActivityLog({
    user_id: user.id,
    event_type: "login",
    page_path: "/login",
    status: "success",
  });

  return NextResponse.redirect(new URL("/", request.url));
}
