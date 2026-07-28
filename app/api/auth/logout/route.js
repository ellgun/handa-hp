import { NextResponse } from "next/server";
import { getSession, clearSession } from "../../../../lib/dummyAuth";
import { addActivityLog } from "../../../../lib/dummyStore";

export async function POST(request) {
  const session = await getSession();
  if (session) {
    addActivityLog({
      user_id: session.uid,
      event_type: "logout",
      page_path: null,
      status: "success",
    });
  }
  await clearSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
