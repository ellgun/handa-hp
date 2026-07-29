import { NextResponse } from "next/server";
import { getSession } from "../../../lib/dummyAuth";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

// API_CONTRACT.md API 5: 매장 사진을 Supabase Storage(store-images 버킷)에 업로드하고
// 공개 URL을 돌려준다. 입력 폼 2단계에서 사진을 선택하자마자 바로 호출한다.

const BUCKET = "store-images";
const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("photos").slice(0, MAX_FILES);

  if (files.length === 0) {
    return NextResponse.json({ error: "업로드할 사진이 없습니다." }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `지원하지 않는 파일 형식입니다: ${file.type}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "사진 1장당 최대 5MB까지 업로드할 수 있습니다." },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabaseAdmin();
  const urls = [];

  try {
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${session.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, upsert: false });
      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
  } catch (err) {
    console.error("[/api/upload-photos] 업로드 실패:", err.message);
    return NextResponse.json({ error: "사진 업로드에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ urls });
}
