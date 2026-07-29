import { createClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 클라이언트. service role key로 RLS를 우회해 데이터 테이블에 접근한다.
// 이 파일은 Route Handler / Server Component 등 서버 코드에서만 import한다.
// 절대 클라이언트 컴포넌트에서 import하지 않는다 (service role key가 브라우저 번들에 포함됨).

let client = null;

export function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local에 추가한 뒤 서버를 재시작하세요."
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
