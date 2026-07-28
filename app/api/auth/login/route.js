import { NextResponse } from "next/server";
import { setSession } from "../../../../lib/dummyAuth";
import { touchLastLogin, addActivityLog } from "../../../../lib/dummyStore";

// 로컬 테스트 버전 전용 더미 로그인. 실제 Google OAuth 호출 없음.
const DUMMY_USERS = {
  user: { id: "dummy-user-uid", email: "user@example.com" },
  admin: { id: "dummy-admin-uid", email: "admin@example.com" },
};

export async function POST(request) {
  const form = await request.formData();
  const role = form.get("role") === "admin" ? "admin" : "user";
  const user = DUMMY_USERS[role];

  await setSession({ uid: user.id, email: user.email });
  touchLastLogin(user.id);
  addActivityLog({
    user_id: user.id,
    event_type: "login",
    page_path: "/login",
    status: "success",
  });

  return NextResponse.redirect(new URL("/", request.url));
}
