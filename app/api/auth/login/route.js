import { NextResponse } from "next/server";
import { setSession } from "../../../../lib/dummyAuth";
import { ensureProfile, addActivityLog } from "../../../../lib/dataStore";

// 개발용 더미 로그인 (이메일/비밀번호 입력은 시각 요소만 제공, 관리자 테스트 로그인 포함).
// 실제 Google OAuth 호출 없음. 로드맵 마지막 단계에서 제거 예정.
// profiles.id가 uuid 컬럼이라 고정된 UUID 리터럴을 사용한다.
const DUMMY_USERS = {
  user: { id: "11111111-1111-1111-1111-111111111111", email: "user@example.com" },
  admin: { id: "22222222-2222-2222-2222-222222222222", email: "admin@example.com" },
};

export async function POST(request) {
  const form = await request.formData();
  const role = form.get("role") === "admin" ? "admin" : "user";
  const user = DUMMY_USERS[role];

  await setSession({ uid: user.id, email: user.email });
  await ensureProfile(user.id, user.email, role);
  await addActivityLog({
    user_id: user.id,
    event_type: "login",
    page_path: "/login",
    status: "success",
  });

  return NextResponse.redirect(new URL("/", request.url));
}
