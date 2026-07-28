import { redirect } from "next/navigation";
import { getSession } from "../../lib/dummyAuth";
import {
  getProfileById,
  getAllProfilesWithStats,
  getAllActivityLogs,
  getAllEmailLogs,
  getAllDraftsWithUser,
  getAdminSummary,
  addActivityLog,
} from "../../lib/dummyStore";
import AdminTabs from "./AdminTabs";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = getProfileById(session.uid);
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  addActivityLog({
    user_id: session.uid,
    event_type: "admin_view",
    page_path: "/admin",
    status: "success",
  });

  const summary = getAdminSummary();
  const profiles = getAllProfilesWithStats();
  const activityLogs = getAllActivityLogs();
  const emailLogs = getAllEmailLogs();
  const drafts = getAllDraftsWithUser();

  return (
    <section className="page admin-page">
      <h1>관리자 대시보드</h1>
      <AdminTabs
        summary={summary}
        profiles={profiles}
        activityLogs={activityLogs}
        emailLogs={emailLogs}
        drafts={drafts}
      />
    </section>
  );
}
