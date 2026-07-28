# API_CONTRACT.md — 한다뚝딱 (handa. 뚝딱)

확인하지 않은 API 주소와 응답을 추측하지 않습니다.
공식 문서 확인 + Postman에서 성공한 요청만 기록합니다.
API 키는 반드시 환경변수(.env)로 관리합니다.

> **적용 단계 안내 (API별 실제/더미 처리 확정)**
> - API 1 Gemini, API 2 Stitch AI: **더미 처리** — 실제 호출 없이 더미 텍스트·더미 HTML로 대체
> - API 3 Google 로그인(Supabase Auth): **더미 처리** — 실제 OAuth 연동 없이 "로그인 성공" 상태만 흉내냄
> - API 4 Supabase Database, API 5 Supabase Storage: **더미 처리** — 실 테이블·버킷 대신 DATA_MODEL.md 스키마를 흉내낸 인메모리·JSON 구조로 대체
> - API 6 Gmail 발송(Agentria API): **더미 처리** — 실제 발송 없이 "발송 성공" 상태만 흉내냄
> 이번 버전은 모든 외부 API를 더미로 대체합니다. 실 서비스 전환 시 API 1~6 전체를 실제 연동으로 전환합니다.

---

## API 목록

| # | 이름 | 용도 | 사용 화면 |
|---|------|------|----------|
| 1 | Google Gemini API (AI Studio) | 운영 제안 문구 생성 + 시안 구성 프롬프트 처리 | 04_Loading → 05_Result |
| 2 | Stitch AI | 홈페이지 시안 UI 생성 (입력값 기반 자동 디자인) | 04_Loading → 05_Result |
| 3 | Supabase Auth (Google OAuth) | Google 로그인 / 로그아웃 (테스트 버전은 더미 처리) | 01_Login |
| 4 | Supabase Database | 사용자 입력값·시안 저장 및 조회 | 03_Input, 05_Result, 06_MyPage, 07_Admin |
| 5 | Supabase Storage | 매장 사진 업로드 및 조회 | 03_Input, 05_Result |
| 6 | Gmail 발송 (Agentria API) | 시안 링크 이메일 발송 | 05_Result |

---

## API 1: Google Gemini API (AI Studio) — 운영 제안 문구 생성

- 참고 문서: https://ai.google.dev/api/generate-content
- 요청 주소: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`
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
          "text": "당신은 소상공인 홈페이지 전문 카피라이터입니다.\n아래 매장 정보를 바탕으로 ①메인 헤드라인 ②소개 문구 ③CTA 버튼 텍스트 ④운영 제안 3가지를 작성해주세요.\n\n업종: {업종}\n매장명: {매장명}\n매장 소개: {매장소개}\n분위기: {분위기}\n강조할 장점: {장점}\n원하는 메인 문구: {메인문구}"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}
```
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
- 역할: 사용자 입력값(업종, 색상, 분위기 등)을 프롬프트로 변환해 Stitch에서 시안 UI를 생성
- 연동 방식: Stitch AI는 현재 API 직접 호출이 아닌 **프롬프트 기반 수동/자동화 연동** 방식으로 사용
  - 1단계: Gemini가 Stitch용 UI 프롬프트 생성
  - 2단계: Stitch에서 생성된 시안 HTML/코드 추출
  - 3단계: 추출된 코드를 Supabase에 저장 후 결과 화면에 표시
- 생성 프롬프트 예시:
```
업종: 카페 / 스타일: 모던 / 색상: 블루 / 기능: 예약, 메뉴 소개 / 매장명: 모던바이츠
→ "Create a modern one-page website for a cafe called 모던바이츠. Blue color theme. Include reservation and menu sections."
```
- 화면에 표시할 데이터 위치: 생성된 HTML → 05_Result 시안 미리보기 iframe
- 환경변수명: 해당 없음 (현재 수동 연동) — API 공개 시 `STITCH_API_KEY` 추가 예정

---

## API 3: Supabase Auth (Google OAuth) — 로그인 / 로그아웃

- 참고 문서: https://supabase.com/docs/guides/auth/social-login/auth-google
- 방식: Supabase JS SDK의 `supabase.auth.signInWithOAuth({ provider: 'google' })` 호출 → Google 로그인 화면으로 리디렉션 → 인증 완료 후 지정된 콜백 주소로 복귀
- Google 자체 REST 엔드포인트를 앱에서 직접 호출하지 않는다 (Supabase Auth가 OAuth 교환을 대행)
- 세션 확인: `supabase.auth.getSession()` / `supabase.auth.onAuthStateChange()`
- 로그아웃: `supabase.auth.signOut()`
- 테스트 버전 처리: 실제 Google OAuth 연동 없이 "로그인 성공" 상태를 더미로 흉내낸다. 실제 연동(Supabase 대시보드 Google 제공자 활성화, Google Cloud Console Client ID/Secret 발급)은 이후 단계에서 진행
- 성공 시 확인 가능한 값(SDK 세션 객체 기준, 실 연동 시): `session.user.id`(uuid), `session.user.email` — 더미 버전에서는 고정된 더미 uid/이메일 사용
- 로그인으로 확인된 사용자 정보(uid, 이메일)는 실 Supabase 테이블이 아닌 인메모리/JSON 더미 구조에 저장한다 (API 4 참고)
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
  "industry": "카페",
  "store_name": "모던바이츠",
  "style": "모던",
  "color": "블루",
  "email": "user@example.com",
  "html_content": "<!DOCTYPE html>...",
  "email_sent": false,
  "created_at": "2026-07-27T10:00:00Z"
}
```
- 성공 응답 예시:
```json
[
  {
    "id": 1,
    "user_id": "uuid-here",
    "store_name": "모던바이츠",
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
- 테스트 버전 처리: 실 Supabase 테이블 대신 DATA_MODEL.md의 `drafts` 스키마 모양을 흉내낸 인메모리·JSON 더미 구조로 대체한다

---

## API 5: Supabase Storage — 매장 사진 업로드

- 요청 주소: `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/store-images/{파일명}`
- 방식: POST
- 헤더:
  - `apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}`
  - `Authorization: Bearer ${ACCESS_TOKEN}`
  - `Content-Type: image/jpeg` (또는 image/png)
- Body: 이미지 바이너리 (multipart/form-data)
- 성공 응답 예시:
```json
{
  "Key": "store-images/uuid-filename.jpg"
}
```
- 실패 응답 예시:
```json
{
  "statusCode": "413",
  "error": "Payload Too Large",
  "message": "The object exceeded the maximum allowed size"
}
```
- 화면에 표시할 데이터 위치: 03_Input 사진 업로드 미리보기 / 생성된 시안 HTML 내 이미지 삽입
- 환경변수명: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 테스트 버전 처리: 실 Supabase Storage 대신 로컬 더미 저장(예: 임시 로컬 경로 또는 메모리 참조)으로 대체한다

---

## API 6: Gmail 발송 (Agentria API) — 이메일 발송

- Gmail 발송은 Agentria에서 만든 Gmail 어빌리티 API를 통해 요청한다 (claude.md 9조 기준)
- 앱 내부 서버 Route가 Agentria API를 호출하며, 브라우저에서 Agentria 비밀키를 직접 호출하지 않는다
- 요청 주소·인증 헤더·Body 형식: **아직 확인되지 않음** — Agentria 공식 문서 또는 Postman 테스트로 성공 사례를 확인한 뒤 이 항목에 기재한다 (추측 기재 금지)
- 테스트 버전 처리: 실제 발송 없이 "발송 성공" 상태를 더미로 흉내낸다. 실제 Agentria 연동은 이후 단계에서 스펙 확인 후 진행
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


