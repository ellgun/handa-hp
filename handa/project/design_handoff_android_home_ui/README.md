# Handoff: 한다뚝딱 Android UI (Login / Home / Input / Admin / History)

## Overview
Android-style mobile mockup for the 한다뚝딱 (handa.뚝딱) service, covering 5 screens: 로그인, 홈, 정보입력(1단계), 관리자, 이력(마이페이지). Applies the "Vivid Clarity" design system extracted from `references/로그인ui`, `references/정보입력ui`, `references/관리자ui` in the handa-hp repo. Built as one interactive HTML prototype with click-through navigation between screens (state-based, not real routing).

## About the Design Files
The bundled HTML file is a **design reference built in HTML**, not production code to copy directly. It's meant to be recreated inside the target codebase — here, the existing **Next.js (App Router) + React** app at `handa-hp` — using its existing pages (`app/login`, `app/page.js`, `app/input`, `app/admin`, `app/mypage`) and its own CSS approach (`app/globals.css`). Don't paste the inline styles verbatim; port the values into the app's existing stylesheet/components.

## Fidelity
**High-fidelity.** Colors, type sizes/weights, spacing, radii and copy are final. Icons use Material Symbols Outlined glyph names (exact names given below) — swap for the icon set already used in the codebase if different, keeping the same glyph meaning.

## Design Tokens ("Vivid Clarity")
Colors:
- primary (deep navy, headlines/icons): `#1A1A80` (darker variant `#040061` used for AppBar/tab-inactive text in some refs)
- secondary / CTA orange: `#FE6500` (hover/darker `#A33E00`)
- on-surface (body text): `#1C1B1B`
- on-surface-variant (muted text): `#464652`
- outline-variant (borders): `#C7C5D4`
- surface (page bg): `#FCF9F8`
- surface-container (field/card fill): `#F0EDEC`
- surface-container-high: `#EBE7E7`
- error-container / on-error-container: `#FFDAD6` / `#93000A`
- white surface-container-lowest: `#FFFFFF`

Typography:
- Font family: **Do Hyeon** (single weight — do not request bold/700/800, it forces browser faux-bold; keep `font-weight: 400` everywhere)
- Headline (screen titles): 22–28px
- Section heading: 20–24px
- Body: 16–18px
- Label / nav / small: 12–15px

Radii: pills/buttons `9999px`, cards `14–20px`, inputs `14px`.
Shadows: soft, e.g. `0 2px 12px rgba(0,0,0,0.04)` for cards, `0 10px 24px rgba(254,101,0,0.28)` for the primary CTA.
Spacing rhythm: 8px base unit; screen side padding 20px; section gaps 24–40px.
Touch targets: buttons/inputs minimum 48–64px tall.

## Assets
- `logo.png` — handa.뚝딱 wordmark + house mark (navy `#1A1A80` / orange `#FE6500`), copied from the repo's `public/logo.png`. Used centered in every screen's top header, ~26–34px tall.
- Icons: Google "Material Symbols Outlined" webfont, glyph names used: `person`, `lock`, `visibility`, `arrow_forward`, `bolt`, `edit_note`, `auto_awesome`, `mail`, `local_cafe`, `content_cut`, `restaurant`, `storefront`, `edit_square`, `history`, `admin_panel_settings`, `group`, `monitoring`, `folder_open`, `add_a_photo`, `trending_up`, `how_to_reg`, `pending_actions`, `mark_email_read`, `folder_off`.
- Google login button uses the standard 4-color "G" SVG mark (inlined in the HTML, no external asset needed).

## Screens

### 1. Login (`app/login`)
- Purpose: dummy Google/email login, entry point before session exists.
- Layout: full-height, two large blurred circular gradient blobs decorating top-right (orange `#FFB74D→#FE6500`) and bottom-left (navy `#7A7DE0→#1A1A80`) behind the content (`position:absolute`, `border-radius:50%`, `filter` via gradient, `opacity` 0.85–0.9).
- Top-center: logo image, 34px tall.
- Center block: "안녕하세요" (34px) + "계정에 로그인하세요" (18px, muted), both centered.
- Two pill inputs (white bg, `border-radius:9999px`, `box-shadow:0 4px 20px rgba(0,0,0,0.06)`, 14px/20px padding): 이메일 (person icon), 비밀번호 (lock icon + visibility icon).
- "비밀번호를 잊으셨나요?" muted link, right-aligned.
- Action row: "로그인" label (26px) + circular 56px orange-gradient button with `arrow_forward` icon → **navigates to Home**.
- Google button: full-width, 50px tall, navy `#1A1A80`, pill, white text "구글 계정으로 로그인" → **navigates to Home**.
- Footer: "계정이 없으신가요? 회원가입" (회원가입 bold + underline).

### 2. Home (`app/page.js`)
- Sticky header, 64px: logo centered absolutely; 40px circular profile/마이페이지 icon button pinned right.
- Hero: small pill chip "⚡ 무료 AI 진단 도구" (surface-container bg), H1 "사장님 홈페이지,\n5분이면 뚝딱!" (28px), subtitle (18px muted), full-width 64px CTA button "시작하기" (orange, `arrow_forward` icon) → **navigates to Input**.
- "이렇게 진행돼요": 3-column row, each a 60px circle icon (light-orange bg, orange icon) + 16px label + 13px description. Steps: 정보 입력 (`edit_note`) → AI 생성 (`auto_awesome`) → 이메일 수신 (`mail`).
- "업종별 시안 예시": heading + horizontally scrolling row of 3 cards (200px wide, rounded 20px, white bg, 1px navy-10%-opacity border): 120px gradient header block with a white icon (카페/미용실/식당), label + "미리보기" link below.
- Footer note (14px muted, centered): disclaimer text.
- Sticky bottom nav, 76px, 4 items (홈/입력/이력/관리자 — 관리자 only if admin), active item colored orange `#FE6500`, inactive `#464652`. Clicking an item navigates to that screen.

### 3. Input — Step 1 (`app/input`)
- Sticky header: logo centered (26px) + "정보 입력" label stacked below it (13px muted).
- Sticky progress bar directly under header: "1단계 / 3단계" / "매장 프로필" row + 12px-tall track (`#E5E2E1`) with 33%-filled orange bar.
- H1 "매장에 대해 알려주세요" (26px) + helper text.
- 매장 이름 field (required, 60px input, `surface-container` fill, 14px radius) with helper caption above.
- 매장 카테고리 (required): 2-up grid of 80px toggle buttons (음식점 `restaurant`, 카페 `local_cafe`); selected state = white bg + 2px orange border + orange icon/text, unselected = `surface-container` bg + navy icon/text.
- 매장 소개 (optional): 100px textarea placeholder block.
- 매장 사진: 180px dashed-border upload placeholder, orange `add_a_photo` icon in a light-orange circle + "사진을 추가하려면 탭하세요".
- Sticky "다음 단계" button (60px, orange, `arrow_forward` icon) above the bottom nav → **navigates to Home** (this prototype doesn't include the loading/result steps).
- Same bottom nav as Home, "입력" tab active.

### 4. Admin (`app/admin`)
- Sticky header: logo centered (30px) + small "HD" avatar circle pinned right.
- Horizontal scrollable pill tab bar, 4 tabs: 프로필 (`group`), 사용 로그 (`monitoring`), 시안 기록 (`folder_open`), 이메일 로그 (`mail`). Active tab = navy fill + white text/icon; inactive = `surface-container` fill.
- **프로필 tab** (default): navy hero stat card (총 가입 사용자 128, +12% orange badge with `trending_up`), 2-up stat row (오늘 활성 24 orange card / 승인 대기 3 light card), then a "최근 프로필" list — each row is a `surface-container` card with a colored initials-circle avatar (no photos — use 2-character Korean initials), name (navy), business + status text (muted), and a status pill (활성 = orange/white, 검토 중 = light-gray/navy).
- **사용 로그 tab**: a simple 5-bar bar chart card ("오늘의 처리량", bars at 35/55/70/95/60%, peak bar orange) + a list of 3 log rows (time / event type / detail); one row uses the error palette (`#FFDAD6` bg / `#93000A` text) to show a failure state.
- **시안 기록 / 이메일 로그 tabs**: centered empty-state (100px icon circle + heading + muted caption) — "아직 생성된 시안이 없습니다" / "발송 대기 중인 이메일이 없습니다".
- Same bottom nav, "관리자" tab active.

### 5. History / MyPage (`app/mypage`)
- Sticky header: logo centered (26px) + "이력" label stacked below.
- User row: `surface-container` card with navy initials avatar + name + email.
- H1 "생성한 시안 이력" + helper text.
- List of draft cards (white bg, 1px navy-10% border, 16px radius): business/variant name + generation date, a status pill (발송 완료 = green `#E6F4EA`/`#146C2E`, 발송 실패 = `#FFDAD6`/`#93000A`), and two action buttons ("시안 다시보기" — outline navy pill, "이메일 재발송" — filled orange pill).
- "로그아웃" full-width outline button below the list.
- Same bottom nav, "이력" tab active.

## Interactions & Behavior
- All navigation is client-side screen switching (a single `screen` state: `login | home | input | admin | history`), driven by button `onClick`s and the bottom nav taps — there is no browser routing in the prototype. In the real app this maps to Next.js route navigation (`<Link>`/`router.push`) between the existing pages.
- Category buttons on Input toggle a `selectedCategory` state (single-select).
- Admin tabs toggle an `adminTab` state (single-select, default `profiles`).
- Buttons use a pressed/active scale-down (`transform: scale(0.95–0.98)`) for tap feedback — no other animation.
- No loading, error, or form-validation states are implemented in this mockup; the real Input/Loading/Result flow (per `PROJECT_BRIEF.md` / `UI_REFERENCE.md`) still needs those.

## State Management (for reference)
- `screen`: which of the 5 views is shown.
- `selectedCategory`: Input screen's chosen business category.
- `adminTab`: which Admin sub-tab is active.
- No real data fetching — all list/stat content is static mock data matching the repo's "더미데이터" (dummy data) approach.

## Screenshots
See `screenshots/` — `1-login.png`, `2-home.png`, `3-input.png`, `4-admin.png`, `5-history.png`.

## Files
- `한다뚝딱 Home (Android).dc.html` — the full interactive prototype (all 5 screens, inline-styled, Material Symbols + Do Hyeon fonts via Google Fonts CDN).
- `logo.png` — wordmark asset used in every header.

Cross-reference against the existing repo docs for full-flow context: `PROJECT_BRIEF.md`, `UI_REFERENCE.md`, `ROUTES_AND_FLOWS.md`, and the three design-token sources this mockup was built from: `references/로그인ui/DESIGN.md`, `references/정보입력ui/DESIGN.md`, `references/관리자ui/DESIGN.md`.
