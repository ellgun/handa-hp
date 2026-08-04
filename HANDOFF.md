# HANDOFF (작업 인수인계)

이 문서는 다른 컴퓨터/새 세션에서 이 프로젝트 작업을 이어갈 때 빠르게 맥락을 잡기 위한 메모입니다.
앱의 기획/구조 문서는 `PROJECT_BRIEF.md`, `ROUTES_AND_FLOWS.md`, `API_CONTRACT.md`, `DATA_MODEL.md`, `UI_REFERENCE.md`를 우선 참고하세요. 이 문서는 그 문서들이 다루지 않는 "세션 연속성" 정보만 담습니다.

## 1. 새 컴퓨터에서 시작하는 순서

```bash
git clone https://github.com/ellgun/handa-hp.git
cd handa-hp
npm install
npm i -g vercel   # 미설치 시
vercel link       # 이 프로젝트(handa-hp)에 연결
vercel env pull .env.local   # 배포 환경변수를 그대로 복원
npm run dev
```

`.env.local`은 Git에 커밋되지 않으며(`.gitignore` 처리), Vercel 프로젝트에 이미 등록된 환경변수(Supabase, Gemini API, Gmail SMTP)를 `vercel env pull`로 복원하는 것이 원칙입니다. 비밀값을 파일이나 메모에 평문으로 옮기지 않습니다.

## 2. 배포 상태

- Vercel 프로젝트 `handa-hp`에 연결되어 있고 production 배포가 정상 동작 중입니다.
- 도메인: `handa-hp.vercel.app` 외 프리뷰 도메인들.

## 3. 최근 작업 흐름 (최신순)

- 인증 화면(로그인/회원가입) 보라·골드 톤 리디자인, 웰컴 화면 추가, 이미지 로고 적용
- 앱 폰트를 Do Hyeon → Tmoney RoundWind로 교체
- 이메일/비밀번호 인증으로 전환, Gmail SMTP 발송 전환 관련 문서화
- Resend 대신 Gmail SMTP로 실제 메일 발송 구현
- Supabase Auth 기반 이메일/비밀번호 로그인·회원가입 실연동
- (더 이전 이력은 `git log`로 확인)

## 4. 최근 논의된 결정 사항

- **Google Drive ↔ GitHub 연동은 불필요하다고 결론.** 로컬 main과 origin/main이 이미 동기화되어 있어 코드는 GitHub만으로 충분히 백업됨. Drive에 코드 전체를 올리는 것은 중복 관리 포인트만 늘림.
- 유일한 로컬 전용 자산은 `.env.local`(비밀값)이며, 이는 Vercel 환경변수가 원본(source of truth)이므로 `vercel env pull`로 복원하는 방식을 채택.

## 5. 남은 이슈

- (해당 시점 기준 특별히 진행 중인 미해결 이슈 없음)
