import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Google 로그인(Supabase Auth) 전용 서버 클라이언트.
// anon/publishable key만 사용하며 service role key는 사용하지 않는다.

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 호출된 경우 쿠키 쓰기는 무시한다.
            // 세션 갱신은 middleware에서 처리된다.
          }
        },
      },
    }
  );
}
