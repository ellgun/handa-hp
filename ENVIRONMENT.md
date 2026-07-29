# ENVIRONMENT.md — 한다뚝딱 (handa. 뚝딱)

비밀값을 코드와 GitHub에 절대 작성하지 않는다.
로컬에서는 `.env.local`, 배포에서는 Vercel Environment Variables를 사용한다.
`.env.local`은 반드시 `.gitignore`에 포함한다.

---

## 클라이언트에서 사용 가능한 값 (NEXT_PUBLIC_)

| 변수명 | 용도 | 필요 시점 |
|--------|------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | 지금 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 (RLS로 보호됨) | 지금 |
| NEXT_PUBLIC_APP_URL | 로컬/배포 앱 주소 (이메일 링크 생성에 사용) | 지금 |

NEXT_PUBLIC_ 변수는 브라우저에 노출되므로 API 시크릿·서비스 키를 절대 포함하지 않는다.

---

## 서버에서만 사용할 값

| 변수명 | 용도 | 필요 시점 |
|--------|------|----------|
| SUPABASE_SERVICE_ROLE_KEY | 관리자 Route·데이터 저장소 전용 Supabase 서비스 키 | 지금 (연동 완료) |
| GEMINI_API_KEY | Google Gemini API 키 (AI Studio) | 지금 (연동 완료, `/api/generate`) |
| AGENTRIA_API_KEY | Gmail 발송용 Agentria API 키 (가칭 — 실제 변수명은 Agentria 문서 확인 후 확정) | Gmail 발송 연동 구현 시 |

서버 전용 값에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.
이 값들은 서버 Route Handler(`/app/api/...`)에서만 참조한다.
클라이언트 컴포넌트에서 직접 호출하지 않는다.

---

## `.env.example`

```
# Supabase (클라이언트 공개 가능)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# 앱 주소
NEXT_PUBLIC_APP_URL=

# Supabase (서버 전용 — 절대 클라이언트에 노출 금지)
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini API (서버 전용)
GEMINI_API_KEY=

# Gmail 발송 (Agentria API, 서버 전용 — 변수명 확인 후 확정)
AGENTRIA_API_KEY=

# Stitch AI (API 공개 시 추가)
# STITCH_API_KEY=
```

`.env.example`에는 실제 값을 적지 않는다.
새 팀원이 합류하면 `.env.example`을 복사해 `.env.local`을 만들고 실제 값을 채운다.

---

## Vercel 등록 확인

| 환경 | 등록 필요 변수 |
|------|--------------|
| Production | 모든 변수 |
| Preview | 모든 변수 (테스트용 Supabase 프로젝트 권장) |
| Development | 모든 변수 |

- 환경변수 추가·변경 후 Vercel 재배포가 필요하다
- `SUPABASE_SERVICE_ROLE_KEY`는 Production·Preview 환경에서만 등록하고 로컬에서는 사용에 주의한다

---

## 보안 체크

- [ ] `.env.local`이 `.gitignore`에 포함되어 있음
- [ ] GitHub 저장소에 비밀값이 커밋된 이력 없음
- [ ] 클라이언트 코드에서 `GEMINI_API_KEY`, `AGENTRIA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 참조 없음
- [ ] Vercel 환경변수에 실제 값 등록 완료
- [ ] Supabase 대시보드에서 anon key와 service role key 구분 확인



