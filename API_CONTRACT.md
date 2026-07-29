# API_CONTRACT.md — 한다뚝딱 (handa. 뚝딱)

확인하지 않은 API 주소와 응답을 추측하지 않습니다.
공식 문서 확인 + Postman에서 성공한 요청만 기록합니다.
API 키는 반드시 환경변수(.env)로 관리합니다.

---

## API 목록

| # | 이름 | 용도 | 사용 화면 |
|---|------|------|----------|
| 1 | Google Gemini API (AI Studio) | 운영 제안 문구 생성 + 시안 HTML 생성 | 04_Loading → 05_Result |
| 2 | Stitch AI | 보류 (MCP 전용·비공식) — 시안 HTML은 API 1(Gemini)로 대체 생성 | - |
| 3 | Supabase Auth (Google OAuth) | Google 로그인 / 로그아웃 | 01_Login |
| 4 | Supabase Database | 사용자 입력값·시안 저장 및 조회 | 03_Input, 05_Result, 06_MyPage, 07_Admin |
| 5 | Supabase Storage | 매장 사진 업로드 및 조회 | 03_Input, 05_Result |
| 6 | Gmail 발송 (Agentria API) | 시안 링크 이메일 발송 | 05_Result |

---

## API 1: Google Gemini API (AI Studio) — 운영 제안 문구 생성

- 참고 문서: https://ai.google.dev/api/generate-content
- 요청 주소: `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`
  - `gemini-1.5-pro`, `gemini-2.5-flash` 같은 스냅샷 모델명은 2026년 기준 이미 지원 종료됐다. 항상 최신 flash 모델을 가리키는 `gemini-flash-latest` 별칭을 사용한다.
- 방식: POST
- 헤더:
  - `Content-Type: application/json`
- Body:
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "당신은 소상공인 홈페이지 전문 카피라이터입니다.\n아래 매장 정보를 바탕으로 ①메인 헤드라인 ②소개 문구 ③CTA 버튼 텍스트 ④운영 제안 1가지를 작성해주세요.\n\n업체명: {store_name}\n지역/업종: {region_industry}\n매장 소개: {strengths}\n분위기: {mood}\n강조할 제품/메인 문구: {main_product_copy}"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096
  }
}
```
- 주의: gemini-flash-latest는 응답 전에 내부 추론(thinking) 토큰을 상당히 소모한다. `maxOutputTokens`를 1024처럼 낮게 잡으면 추론에 다 쓰이고 실제 답변이 중간에 잘리는 걸 확인했다 — 4096 이상을 권장한다.
- 성공 응답 예시:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "①헤드라인: 사장님의 맛, 이제 온라인에서도!\n②소개 문구: 12년 전통의 진심을 담은 카페...\n③CTA: 지금 예약하기\n④운영 제안: ..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ]
}
```
- 실패 응답 예시:
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```
- 화면에 표시할 데이터 위치: `candidates[0].content.parts[0].text` → 05_Result 운영 제안 카드
- 환경변수명: `GEMINI_API_KEY`

---

## API 2: Stitch AI — 홈페이지 시안 UI 생성

- 서비스: Google Stitch AI (https://stitch.withgoogle.com)
- **2026-07 기준 보류·미사용**: Stitch의 프로그래밍 방식 접근은 REST가 아니라 MCP(Model Context Protocol) 전용이며(`stitch.googleapis.com/mcp`), 공개된 SDK(google-labs-code/stitch-sdk)도 "공식 지원 제품 아님"으로 명시돼 있어 확인 없이 구현하지 않았다.
- **대체 방식**: 시안 HTML은 API 1과 동일한 Gemini API로 직접 생성한다 (Stitch도 내부적으로 Gemini를 사용하는 도구라 같은 접근). 요청/응답 형식은 API 1과 동일하며, 프롬프트만 "완성된 원페이지 홈페이지 HTML을 생성"하도록 다르게 구성한다 (`app/api/generate/route.js`의 `buildHtmlPrompt` 참고).
- 화면에 표시할 데이터 위치: 생성된 HTML → 05_Result 시안 미리보기 iframe (`sandbox=""`로 스크립트 실행 차단)
- 환경변수명: 해당 없음 (API 1의 `GEMINI_API_KEY` 재사용)

---

## API 3: Supabase Auth (Google OAuth) — 로그인 / 로그아웃

- 참고 문서: https://supabase.com/docs/guides/auth/social-login/auth-google
- 방식: Supabase JS SDK의 `supabase.auth.signInWithOAuth({ provider: 'google' })` 호출 → Google 로그인 화면으로 리디렉션 → 인증 완료 후 지정된 콜백 주소로 복귀
- Google 자체 REST 엔드포인트를 앱에서 직접 호출하지 않는다 (Supabase Auth가 OAuth 교환을 대행)
- 세션 확인: `supabase.auth.getSession()` / `supabase.auth.onAuthStateChange()`
- 로그아웃: `supabase.auth.signOut()`
- 성공 시 확인 가능한 값: `session.user.id`(uuid), `session.user.email`
- 로그인으로 확인된 사용자 정보(uid, 이메일)는 Supabase `profiles` 테이블에 저장한다 (API 4 참고)
- 화면에 표시할 데이터 위치: `session.user.email` → 06_MyPage 상단 / 로그인 실패 시 오류 메시지 표시
- 환경변수명: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Google Client ID/Secret은 Supabase 대시보드에 등록, 앱 환경변수 아님)

---

## API 4: Supabase Database — 시안 저장 및 조회

- 요청 주소: `{NEXT_PUBLIC_SUPABASE_URL}/rest/v1/drafts`
- 방식: POST (저장) / GET (조회)
- 헤더:
  - `apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  - `Authorization: Bearer ${ACCESS_TOKEN}`
  - `Content-Type: application/json`
- Body (저장 시):
```json
{
  "user_id": "uuid-here",
  "input_id": "uuid-here",
  "store_name": "모던바이츠",
  "region_industry": "서울 / 카페",
  "html_content": "<!DOCTYPE html>...",
  "suggestion_summary": "헤드라인 / 운영 제안",
  "email_sent": false,
  "created_at": "2026-07-27T10:00:00Z"
}
```
- 성공 응답 예시:
```json
[
  {
    "id": "uuid-here",
    "user_id": "uuid-here",
    "store_name": "모던바이츠",
    "region_industry": "서울 / 카페",
    "created_at": "2026-07-27T10:00:00Z",
    "email_sent": false
  }
]
```
- 실패 응답 예시:
```json
{
  "code": "42501",
  "message": "new row violates row-level security policy"
}
```
- 화면에 표시할 데이터 위치: 06_MyPage 시안 히스토리 목록 / 07_Admin 사용자 활동 로그
- 환경변수명: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## API 5: Supabase Storage — 매장 사진 업로드

- 클라이언트가 Supabase Storage를 직접 호출하지 않고, 앱 서버 Route `POST /api/upload-photos`를 통해 업로드한다 (더미 로그인 계정도 동일하게 동작해야 해서 service role로 통일).
- 앱 서버 Route: `POST /api/upload-photos`
  - Body: `multipart/form-data`, 필드명 `photos` (최대 3장, 장당 5MB, jpeg/png/webp/gif만 허용)
  - 성공 응답: `{ "urls": ["https://.../storage/v1/object/public/store-images/...", ...] }`
  - 실패 응답: `{ "error": "..." }` (400/401/500)
- 서버 내부에서는 `SUPABASE_SERVICE_ROLE_KEY`로 Storage `store-images` 버킷(공개)에 `{user_id}/{timestamp}-{random}.{ext}` 경로로 저장하고, `getPublicUrl()`로 공개 URL을 만들어 반환한다.
- 화면에 표시할 데이터 위치: 03_Input 사진 업로드 미리보기 / 생성된 시안 HTML 내 `<img>` 삽입
- 환경변수명: `SUPABASE_SERVICE_ROLE_KEY` (서버 전용)

---

## API 6: Gmail 발송 (Agentria API) — 이메일 발송

- Gmail 발송은 Agentria에서 만든 Gmail 어빌리티 API를 통해 요청한다 (claude.md 9조 기준)
- 앱 내부 서버 Route가 Agentria API를 호출하며, 브라우저에서 Agentria 비밀키를 직접 호출하지 않는다
- 요청 주소·인증 헤더·Body 형식: **아직 확인되지 않음** — Agentria 공식 문서 또는 Postman 테스트로 성공 사례를 확인한 뒤 이 항목에 기재한다 (추측 기재 금지)
- 이메일 발송 로그에는 본문 전체가 아닌 다음만 저장: user_id, 관련 데이터 ID, 발송 상태, HTTP 상태 코드, Agentria 요청/메시지 ID(있는 경우), 짧은 오류 코드, 발송 시각
- 화면에 표시할 데이터 위치: 05_Result 이메일 발송 성공/실패 안내 메시지
- 환경변수명: 확인 후 기재 (가칭 `AGENTRIA_API_KEY` — 실제 명칭은 Agentria 문서 확인 필요)

---

## 환경변수 목록 (.env)

```
# Google Gemini (AI Studio)
GEMINI_API_KEY=

# Stitch AI (API 공개 시 추가)
# STITCH_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Gmail 발송 (Agentria API) — 변수명 확인 후 확정
AGENTRIA_API_KEY=

# 앱 설정
NEXT_PUBLIC_APP_URL=
```

---

## 주의사항

- 모든 API 키는 `.env` 파일로만 관리하며 코드에 직접 입력하지 않는다
- `.env` 파일은 `.gitignore`에 반드시 포함한다
- OpenAI 응답이 HTML이 아닐 경우 재시도 로직을 구현한다
- Supabase Row Level Security(RLS)는 반드시 활성화한다 — 사용자는 본인 데이터만 접근 가능
- 관리자 권한은 서버 사이드에서 검증한다 (클라이언트 단독 처리 금지)


