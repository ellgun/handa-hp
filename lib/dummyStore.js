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

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DB, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
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
