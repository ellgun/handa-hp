import { getSupabaseAdmin } from "./supabaseAdmin";

// profiles / draft_inputs / drafts / email_delivery_logs / activity_logs 실제 Supabase 테이블 접근.
// 스키마: supabase/schema.sql. 항상 service role 키로 접근하며, 소유권 확인(자기 데이터만
// 조회/수정)은 이 파일을 호출하는 쪽(Route Handler, Server Component)에서 session.uid 기준으로 한다.

function throwIfError(error) {
  if (error) throw error;
}

export async function getProfileById(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data;
}

export async function touchLastLogin(id) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", id);
  throwIfError(error);
}

// Google 로그인(Supabase Auth)과 더미 로그인(이메일/관리자 테스트) 모두 최초 로그인 시
// profiles가 없으면 새로 만든다. role은 최초 생성 시에만 반영하고, 기존 프로필의 role은
// 덮어쓰지 않는다 (관리자로 수동 승격된 계정 보호).
export async function ensureProfile(id, email, role = "user") {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(selectError);

  if (!existing) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ id, email: email || null, role, created_at: now, last_login_at: now })
      .select()
      .single();
    throwIfError(error);
    return data;
  }

  const patch = { last_login_at: now };
  if (email) patch.email = email;
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  throwIfError(error);
  return data;
}

export async function addDraftInput(input) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("draft_inputs").insert(input).select().single();
  throwIfError(error);
  return data;
}

export async function addDraft(draft) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("drafts")
    .insert({ email_sent: false, ...draft })
    .select()
    .single();
  throwIfError(error);
  return data;
}

export async function getDraftById(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("drafts").select("*").eq("id", id).maybeSingle();
  throwIfError(error);
  return data;
}

export async function getDraftInputById(id) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("draft_inputs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function getDraftsByUser(userId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("drafts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data || [];
}

export async function updateDraft(id, patch) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("drafts")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function addEmailLog(log) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("email_delivery_logs").insert(log).select().single();
  throwIfError(error);
  return data;
}

export async function addActivityLog(log) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({ metadata: {}, ...log })
    .select()
    .single();
  throwIfError(error);
  return data;
}

export async function getAllDraftsWithUser() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("drafts")
    .select("*, profiles(email)")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return (data || []).map(({ profiles, ...draft }) => ({
    ...draft,
    user_email: profiles?.email || "알 수 없음",
  }));
}

export async function getAllProfilesWithStats() {
  const supabase = getSupabaseAdmin();
  const [{ data: profiles, error: profilesError }, { data: drafts, error: draftsError }] =
    await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("drafts").select("user_id"),
    ]);
  throwIfError(profilesError);
  throwIfError(draftsError);

  return (profiles || []).map((p) => ({
    ...p,
    draft_count: (drafts || []).filter((d) => d.user_id === p.id).length,
  }));
}

export async function getAllActivityLogs() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data || [];
}

export async function getAllEmailLogs() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("email_delivery_logs")
    .select("*")
    .order("created_at", { ascending: false });
  throwIfError(error);
  return data || [];
}

export async function getAdminSummary() {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalUsers, error: usersError },
    { count: draftCount, error: draftsError },
    { count: emailSentCount, error: emailError },
    { data: todayLogs, error: todayError },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("drafts").select("*", { count: "exact", head: true }),
    supabase
      .from("email_delivery_logs")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase.from("activity_logs").select("user_id, created_at").not("user_id", "is", null),
  ]);
  throwIfError(usersError);
  throwIfError(draftsError);
  throwIfError(emailError);
  throwIfError(todayError);

  const activeToday = new Set(
    (todayLogs || [])
      .filter((log) => log.created_at.slice(0, 10) === today)
      .map((log) => log.user_id)
  );

  return {
    totalUsers: totalUsers || 0,
    activeTodayUsers: activeToday.size,
    draftCount: draftCount || 0,
    emailSentCount: emailSentCount || 0,
  };
}
