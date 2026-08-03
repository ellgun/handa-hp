# ROUTES_AND_FLOWS.md — 한다뚝딱 (handa. 뚝딱)

---

## 페이지 구조

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | 01_Login | Google 로그인 (Supabase Auth) |
| `/` | 02_Home | 서비스 소개, 샘플 시안, 시작하기 CTA |
| `/input` | 03_Input | 매장 정보 입력 폼 (11개 항목 + 사진 업로드) |
| `/loading` | 04_Loading | AI 처리 중 진행 상태 표시 |
| `/result/[draftId]` | 05_Result | 시안 미리보기, 운영 제안, 이메일 발송 |
| `/mypage` | 06_MyPage | 생성 히스토리, 시안 다시보기 |
| `/admin` | 07_Admin | 관리자 대시보드 (통계·로그) |

---

## 보호 규칙

- 비로그인 사용자는 `/login`, `/` 만 접근 가능
- 비로그인 사용자가 `/input`, `/result`, `/mypage` 접근 시 `/login`으로 리디렉션
- 로그인 사용자가 `/login`에 접근하면 `/`(홈)으로 이동
- `/mypage`는 로그인 필수
- `/admin`은 로그인 + `profiles.role = admin` 모두 필요
- `/admin` 권한 확인은 서버에서 수행 (클라이언트 단독 처리 금지)

---

## 정상 흐름

```
/login
→ Google 로그인
→ / (홈)
→ "시작하기" 클릭
→ /input (매장 정보 입력)
→ 11개 항목 입력 + 사진 업로드
→ "AI 시안 만들기" 제출
→ /loading (Gemini + Stitch AI 처리)
→ /result/[draftId] (시안 미리보기)
→ "이메일로 받기" 클릭
→ Gmail 발송 (Agentria API)
→ /mypage에서 히스토리 확인
```

---

## 이메일 발송 실패 흐름

```
시안 생성 성공 (/result/[draftId])
→ "이메일로 받기" 클릭
→ Gmail(Agentria API) 발송 실패
→ 시안은 drafts 테이블에 유지
→ email_delivery_logs에 status = failed 저장
→ 결과 화면에 "발송 실패 — 다시 시도하기" 버튼 표시
→ 재시도 클릭 시 발송 재요청
```

---

## AI 처리 실패 흐름

```
/input 제출
→ /loading 진입
→ Gemini API 또는 Stitch AI 처리 실패
→ activity_logs에 api_failed 기록
→ "다시 시도하기" 버튼 표시
→ 재시도 클릭 시 동일 입력값으로 재요청
→ 재시도 실패 시 "잠시 후 다시 시도해 주세요" 안내 후 /input으로 복귀
```

---

## 필수 입력값 누락 흐름

```
/input에서 제출 시도
→ 필수 항목 미입력 감지
→ 해당 필드 강조(빨간 테두리) + 안내 메시지 표시
→ 페이지 제출 차단 (API 호출 없음)
→ 사용자가 항목 채운 후 재제출
```

---

## 관리자 흐름

```
/admin 접근
→ 로그인 여부 확인
→ 비로그인 시 /login으로 리디렉션
→ 로그인 확인 후 서버에서 profiles.role 확인
→ role = admin → 통계·사용자 목록·로그 표시
→ role = user → 403 또는 / (홈)으로 이동
```

---

## Server Route 구조 (API)

| 경로 | 역할 | 사용 서비스 |
|------|------|------------|
| `POST /api/generate` | 시안 생성 요청 처리 | Gemini API + Stitch AI |
| `POST /api/email` | 이메일 발송 요청 | Gmail (Agentria API) |
| `GET /api/admin/users` | 관리자 사용자 목록 조회 | Supabase (service role) |
| `GET /api/admin/logs` | 관리자 활동 로그 조회 | Supabase (service role) |

모든 Server Route는 서버에서 인증·권한을 재확인한다.
`/api/admin/*`는 `profiles.role = admin` 확인 없이 데이터를 반환하지 않는다.

---

## 로그 발생 지점

| event_type | 발생 시점 |
|------------|----------|
| `login` | 로그인 성공 |
| `logout` | 로그아웃 |
| `page_view` | 각 페이지 진입 |
| `draft_input_submitted` | 정보 입력 제출 |
| `draft_created` | 시안 생성 성공 |
| `draft_failed` | 시안 생성 실패 |
| `email_send_requested` | 이메일 발송 요청 |
| `email_send_succeeded` | 이메일 발송 성공 |
| `email_send_failed` | 이메일 발송 실패 |
| `admin_view` | 관리자 페이지 조회 |
| `api_failed` | 외부 API(Gemini/Stitch/Gmail) 실패 |





