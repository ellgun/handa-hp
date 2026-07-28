# DATA_MODEL.md — 한다뚝딱 (handa. 뚝딱)

> **적용 단계 안내**
> 이 문서는 실 서비스 전환 시 사용할 Supabase 스키마입니다.
> 현재 진행 단계는 **로컬 + 더미데이터 테스트**이며, 이 테이블들을 실제로 생성하지 않습니다.
> 로컬/더미 단계에서 데이터가 필요하면 이 구조를 흉내낸 더미 데이터(메모리·JSON)로 대체하고, 테스트 통과 후 이 스키마 그대로 Supabase에 적용합니다.

## 공통 원칙

- 모든 사용자 데이터는 Supabase 사용자 ID(uuid)와 연결한다.
- 일반 사용자는 자기 행만 조회한다.
- 관리자 조회는 서버에서 권한 확인 후 수행한다.
- 이메일 본문과 외부 API 전체 응답은 저장하지 않는다.
- 긴 문자열 저장을 피하고 필요한 요약만 저장한다.
- 생성된 시안 HTML 전문은 저장하되, Gemini 전체 프롬프트·응답은 저장하지 않는다.

---

## 1. profiles

목적: 이메일 로그인 사용자 기본 정보와 역할 저장

필드:

- id: uuid, auth.users.id와 동일
- email: text
- role: text, 기본값 user, 허용값 user 또는 admin
- created_at: timestamptz
- last_login_at: timestamptz

주의:

- id가 기본 사용자 식별자다.
- 이메일은 변경될 수 있으므로 관계 기본키로 사용하지 않는다.
- 이름·프로필 사진은 수집하지 않는다 (개인정보 최소 수집 원칙).

---

## 2. draft_inputs

목적: 사용자가 입력한 매장 정보 저장 (시안 생성의 원본 데이터)

필드:

- id: uuid
- user_id: uuid, profiles.id 참조
- industry: text (업종 — 카페/식당/미용실/의류/기타)
- region: text (지역/분야 세분화)
- store_name: text (매장명)
- contact: text (연락처)
- sns_url: text, nullable (SNS 주소)
- business_number: varchar(20), nullable (사업자등록번호)
- main_product_copy: varchar(500) (강조 제품 및 메인 문구)
- strengths: text (매장 장점 — 자유 입력)
- benchmark_url: text, nullable (벤치마킹 사이트 링크)
- color_theme: text (색상 테마 — 빨강/검정/노랑/보라/주황/초록/파랑/하양)
- mood: text (홈페이지 분위기 — 전문적/따뜻한/고급/편안/건강)
- extra_requests: text, nullable (추가 요구사항)
- receipt_email: text (시안 수신 이메일)
- image_urls: text[], nullable (업로드된 매장 사진 URL 목록, Supabase Storage 경로)
- created_at: timestamptz

저장하지 않을 데이터:

- 사업자등록번호 진위 확인 결과 원문
- 업로드 이미지 바이너리 원본 (Storage URL만 저장)

---

## 3. drafts

목적: AI가 생성한 홈페이지 시안 및 운영 제안 저장

필드:

- id: uuid
- user_id: uuid, profiles.id 참조
- input_id: uuid, draft_inputs.id 참조
- store_name: text (빠른 목록 표시용 복사본)
- industry: text (빠른 목록 표시용 복사본)
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

목적: Resend 이메일 발송 결과만 저장

필드:

- id: uuid
- user_id: uuid, profiles.id 참조
- draft_id: uuid, drafts.id 참조
- status: text, 허용값 requested / sent / failed
- http_status: integer, nullable (Resend HTTP 응답 코드)
- provider_request_id: text, nullable (Resend 발송 ID)
- error_code: varchar(100), nullable
- created_at: timestamptz

절대 저장하지 않을 데이터:

- 이메일 제목(subject)
- 이메일 본문(body)
- API key
- Resend 전체 응답 원문

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
  "industry": "카페",
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

## RLS 개념

profiles:
- 사용자는 자기 profile 조회 가능
- 사용자는 허용된 자기 필드(last_login_at)만 수정 가능
- role 필드는 서버에서만 수정 가능

draft_inputs:
- user_id = auth.uid()인 행만 조회·삽입

drafts:
- user_id = auth.uid()인 행만 조회·삽입
- html_content는 본인 행만 조회 가능

email_delivery_logs:
- 사용자는 자기 발송 상태(status)만 조회
- 삽입은 서버 Route에서만 처리

activity_logs:
- 일반 사용자는 자기 로그만 제한적으로 조회하거나 조회하지 않음
- 관리자는 서버 권한 확인 후 전체 조회

---

## 관리자 권한

- profiles.role = admin인 사용자만 관리자 기능 사용
- UI 메뉴 숨김과 별개로 서버에서 role을 다시 확인
- service role key는 관리자 서버 Route에서만 사용
- 관리자도 이메일 본문·API key는 열람 불가

