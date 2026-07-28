import fs from "fs";
import path from "path";

// 로컬 테스트 버전 전용 더미 데이터 저장소.
// DATA_MODEL.md의 profiles / draft_inputs / drafts / email_delivery_logs / activity_logs
// 스키마 모양을 흉내낸 JSON 파일 기반 저장소이며, 실 Supabase 테이블을 대체한다.
// 실 서비스 전환 시 이 파일 전체를 Supabase 클라이언트 호출로 교체한다.

const DB_PATH = path.join(process.cwd(), "data", "dummy-db.json");

const SEED_DB = {
  profiles: [
    {
      id: "dummy-admin-uid",
      email: "admin@example.com",
      role: "admin",
      created_at: "2026-01-01T00:00:00.000Z",
      last_login_at: null,
    },
    {
      id: "dummy-user-uid",
      email: "user@example.com",
      role: "user",
      created_at: "2026-01-01T00:00:00.000Z",
      last_login_at: null,
    },
  ],
  draft_inputs: [],
  drafts: [],
  email_delivery_logs: [],
  activity_logs: [],
};

// Vercel 서버리스 함수는 파일시스템이 읽기 전용이라 data/dummy-db.json에 쓸 수 없다.
// 쓰기가 실패하면 이 서버리스 인스턴스가 살아있는 동안만 유지되는 메모리 저장소로 폴백한다.
// 로컬 개발 환경(쓰기 가능)에서는 기존과 동일하게 파일에 저장된다.
let memoryDb = null;

function ensureDb() {
  if (memoryDb) return;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DB, null, 2), "utf-8");
    }
  } catch {
    memoryDb = structuredClone(SEED_DB);
  }
}

function readDb() {
  ensureDb();
  if (memoryDb) return memoryDb;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    memoryDb = structuredClone(SEED_DB);
    return memoryDb;
  }
}

function writeDb(db) {
  if (memoryDb) {
    memoryDb = db;
    return;
  }
  try {
    ensureDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch {
    memoryDb = db;
  }
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getProfileById(id) {
  const db = readDb();
  return db.profiles.find((p) => p.id === id) || null;
}

export function touchLastLogin(id) {
  const db = readDb();
  const profile = db.profiles.find((p) => p.id === id);
  if (profile) {
    profile.last_login_at = new Date().toISOString();
    writeDb(db);
  }
}

// Google 로그인(Supabase Auth)은 dummy-db.json 시드에 없는 실제 uuid로 로그인한다.
// 최초 로그인 시 profiles에 role=user로 등록해야 /admin·마이페이지의 role 조회가 정상 동작한다.
export function ensureProfile(id, email) {
  const db = readDb();
  const now = new Date().toISOString();
  let profile = db.profiles.find((p) => p.id === id);
  if (!profile) {
    profile = { id, email: email || null, role: "user", created_at: now, last_login_at: now };
    db.profiles.push(profile);
  } else {
    profile.last_login_at = now;
    if (email) profile.email = email;
  }
  writeDb(db);
  return profile;
}

export function addDraftInput(input) {
  const db = readDb();
  const record = {
    id: newId("input"),
    created_at: new Date().toISOString(),
    ...input,
  };
  db.draft_inputs.push(record);
  writeDb(db);
  return record;
}

export function addDraft(draft) {
  const db = readDb();
  const record = {
    id: newId("draft"),
    email_sent: false,
    created_at: new Date().toISOString(),
    ...draft,
  };
  db.drafts.push(record);
  writeDb(db);
  return record;
}

export function getDraftById(id) {
  const db = readDb();
  return db.drafts.find((d) => d.id === id) || null;
}

export function getDraftInputById(id) {
  const db = readDb();
  return db.draft_inputs.find((d) => d.id === id) || null;
}

export function getDraftsByUser(userId) {
  const db = readDb();
  return db.drafts
    .filter((d) => d.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function updateDraft(id, patch) {
  const db = readDb();
  const draft = db.drafts.find((d) => d.id === id);
  if (draft) {
    Object.assign(draft, patch);
    writeDb(db);
  }
  return draft || null;
}

export function addEmailLog(log) {
  const db = readDb();
  const record = {
    id: newId("email-log"),
    created_at: new Date().toISOString(),
    ...log,
  };
  db.email_delivery_logs.push(record);
  writeDb(db);
  return record;
}

export function addActivityLog(log) {
  const db = readDb();
  const record = {
    id: newId("activity"),
    created_at: new Date().toISOString(),
    metadata: {},
    ...log,
  };
  db.activity_logs.push(record);
  writeDb(db);
  return record;
}

export function getAllDraftsWithUser() {
  const db = readDb();
  return [...db.drafts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((d) => ({
      ...d,
      user_email: db.profiles.find((p) => p.id === d.user_id)?.email || "알 수 없음",
    }));
}

export function getAllProfilesWithStats() {
  const db = readDb();
  return db.profiles.map((p) => ({
    ...p,
    draft_count: db.drafts.filter((d) => d.user_id === p.id).length,
  }));
}

export function getAllActivityLogs() {
  const db = readDb();
  return [...db.activity_logs].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export function getAllEmailLogs() {
  const db = readDb();
  return [...db.email_delivery_logs].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export function getAdminSummary() {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  const activeToday = new Set(
    db.activity_logs
      .filter((a) => a.created_at.slice(0, 10) === today && a.user_id)
      .map((a) => a.user_id)
  );
  return {
    totalUsers: db.profiles.length,
    activeTodayUsers: activeToday.size,
    draftCount: db.drafts.length,
    emailSentCount: db.email_delivery_logs.filter((e) => e.status === "sent")
      .length,
  };
}
