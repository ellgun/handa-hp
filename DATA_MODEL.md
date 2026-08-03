# DATA_MODEL.md — 한다뚝딱 (handa. 뚝딱)

> 이 문서는 Supabase에 실제로 생성해서 사용할 스키마입니다.

## 공통 원칙

- 모든 사용자 데이터는 Supabase 사용자 ID(uuid)와 연결한다.
- 일반 사용자는 자기 행만 조회한다.
- 관리자 조회는 서버에서 권한 확인 후 수행한다.
- 이메일 본문과 외부 API 전체 응답은 저장하지 않는다.
- 긴 문자열 저장을 피하고 필요한 요약만 저장한다.
- 생성된 시안 HTML 전문은 저장하되, Gemini 전체 프롬프트·응답은 저장하지 않는다.

---

## 1. profiles

목적: Google 로그인·더미 로그인(개발용) 사용자 공통 정보와 역할 저장

필드:

- id: uuid, Google 로그인은 auth.users.id와 동일. 더미 로그인(개발용)은 고정 UUID 리터럴 사용
- email: text
- role: text, 기본값 user, 허용값 user 또는 admin
- created_at: timestamptz
- last_login_at: timestamptz

주의:

- id가 기본 사용자 식별자다.
- 이메일은 변경될 수 있으므로 관계 기본키로 사용하지 않는다.
- 이름·프로필 사진은 수집하지 않는다 (개인정보 최소 수집 원칙).
- id는 현재 auth.users에 대한 외래키가 없다 — 더미 로그인 계정이 auth.users에 존재하지 않는 고정 UUID를 쓰기 때문. 더미 로그인을 제거하는 시점에 FK를 추가한다.

---

## 2. draft_inputs

목적: 사용자가 입력한 매장 정보 저장 (시안 생성의 원본 데이터)

필드 (실제 입력 폼 `app/input/page.js` 기준 — 3단계로 나뉜 7개 필수 항목만 수집한다):

- id: uuid
- user_id: uuid, profiles.id 참조
- store_name: text, 필수 (1단계 — 업체명, region_industry와 분리된 별도 컬럼)
- region_industry: text, 필수 (1단계 — 지역/업종, 예: "서울 / 카페")
- email: text, 필수 (1단계 — 시안 수신 이메일)
- main_product_copy: varchar(200), 필수 (2단계 — 강조 제품 및 메인 문구)
- strengths: text, 필수 (2단계 — 매장 장점 자유 입력)
- image_urls: text[], nullable (2단계 — Supabase Storage `store-images` 버킷에 업로드된 사진의 공개 URL, 선택)
- color_theme: text, 필수 (3단계 — 색상 테마: 빨강/검정/노랑/보라/주황/초록/파랑/하양)
- mood: text, 필수 (3단계 — 홈페이지 분위기: 전문적/따뜻한/고급/편안/건강)
- created_at: timestamptz

폼에서 더 이상 수집하지 않는 컬럼 (기존 데이터 보존을 위해 컬럼 자체는 남겨두고 nullable로 전환):
- contact, sns_url, business_number, benchmark_url, extra_requests

저장하지 않을 데이터:

- 사업자등록번호 진위 확인 결과 원문
- 업로드 이미지 바이너리 원본

---

## 3. drafts

목적: AI가 생성한 홈페이지 시안 및 운영 제안 저장

필드:

- id: uuid
- user_id: uuid, profiles.id 참조
- input_id: uuid, draft_inputs.id 참조
- store_name: text (빠른 목록 표시용 복사본)
- region_industry: text (빠른 목록 표시용 복사본)
- html_content: text (생성된 시안 HTML 전문)
- suggestion_summary: varchar(1000), nullable (운영 제안 요약 — Gemini 응답 전문 아님)
- email_sent: boolean, 기본값 false
- created_at: timestamptz

저장하지 않을 데이터:

- Gemini 전체 프롬프트
- Gemini 전체 응답 원문
- Stitch AI 중간 처리 데이터
- 불필요하게 긴 LLM 출력

---

## 4. email_delivery_logs

목적: Gmail 발송(Gmail SMTP) 결과만 저장

필드:

- id: uuid
- user_id: uuid, profiles.id 참조
- draft_id: uuid, drafts.id 참조
- status: text, 허용값 requested / sent / failed
- http_status: integer, nullable (SMTP 응답 코드, 예: 250)
- provider_request_id: text, nullable (Gmail 메시지 ID)
- error_code: varchar(100), nullable
- created_at: timestamptz

절대 저장하지 않을 데이터:

- 이메일 제목(subject)
- 이메일 본문(body)
- API key
- Gmail SMTP 전체 응답 원문

---

## 5. activity_logs

목적: 사용자·관리자 활동 분석 및 오류 추적 (07_Admin 화면에 표시)

필드:

- id: uuid
- user_id: uuid, nullable (비로그인 접근 시 null)
- event_type: text (예: draft_created / email_sent / login / page_view)
- page_path: text, nullable (예: /input, /result)
- target_type: text, nullable (예: draft / email)
- target_id: text, nullable (관련 리소스 ID)
- status: text, 허용값 success / failed
- error_code: varchar(100), nullable
- metadata: jsonb, 기본값 빈 객체 {}
- created_at: timestamptz

metadata 허용 예시:
```json
{
  "color_theme": "블루",
  "mood": "모던"
}
```

metadata 금지 예시:

- 이메일 본문
- Gemini 전체 프롬프트·응답
- 사업자등록번호
- API key / 토큰

---

## RLS (supabase/schema.sql 기준)

앱은 지금 모든 데이터 접근을 서버(Route Handler/Server Component)에서 service role 키로 수행하므로, 아래 정책은 RLS가 요구사항으로 켜져 있음을 보장하는 안전망이며 현재 앱 동작에는 영향을 주지 않는다. 사용자 간 데이터 분리는 각 서버 코드가 `session.uid`로 직접 비교해서 처리한다 (`lib/dataStore.js` 호출부).

profiles:
- select/update: auth.uid() = id

draft_inputs:
- select/insert: auth.uid() = user_id

drafts:
- select/insert: auth.uid() = user_id

email_delivery_logs:
- select: auth.uid() = user_id
- insert/update: 정책 없음 (서버 service role에서만 처리)

activity_logs:
- 정책 없음 — 일반 사용자는 직접 조회 불가, 관리자는 서버 service role로만 조회

---

## 관리자 권한

- profiles.role = admin인 사용자만 관리자 기능 사용
- UI 메뉴 숨김과 별개로 서버에서 role을 다시 확인
- service role key는 관리자 서버 Route에서만 사용
- 관리자도 이메일 본문·API key는 열람 불가

