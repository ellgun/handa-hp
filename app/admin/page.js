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
} from "../../lib/dataStore";
import AdminTabs from "./AdminTabs";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await getProfileById(session.uid);
  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  await addActivityLog({
    user_id: session.uid,
    event_type: "admin_view",
    page_path: "/admin",
    status: "success",
  });

  const [summary, profiles, activityLogs, emailLogs, drafts] = await Promise.all([
    getAdminSummary(),
    getAllProfilesWithStats(),
    getAllActivityLogs(),
    getAllEmailLogs(),
    getAllDraftsWithUser(),
  ]);

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
