"use client";

import { useMemo, useState } from "react";
import Icon from "../Icon";

const TABS = [
  { key: "profiles", label: "프로필", icon: "group" },
  { key: "usage", label: "사용 로그", icon: "monitoring" },
  { key: "drafts", label: "시안 기록", icon: "folder_open" },
  { key: "emails", label: "이메일 로그", icon: "mail" },
];

function initials(email) {
  return (email || "?").slice(0, 2).toUpperCase();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("ko-KR");
}

export default function AdminTabs({ summary, profiles, activityLogs, emailLogs, drafts }) {
  const [tab, setTab] = useState("profiles");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filteredActivity = useMemo(() => {
    return activityLogs.filter((log) => {
      if (statusFilter !== "all" && log.status !== statusFilter) return false;
      if (dateFilter && !log.created_at.startsWith(dateFilter)) return false;
      return true;
    });
  }, [activityLogs, statusFilter, dateFilter]);

  const eventCounts = useMemo(() => {
    const counts = {};
    for (const log of activityLogs) {
      counts[log.event_type] = (counts[log.event_type] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [activityLogs]);

  const maxCount = Math.max(1, ...eventCounts.map(([, c]) => c));

  return (
    <>
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profiles" && (
        <>
          <div className="admin-hero-card">
            <p>총 가입 사용자</p>
            <p className="value">{summary.totalUsers}</p>
            <span className="admin-badge">
              <Icon name="trending_up" /> 오늘 활동 {summary.activeTodayUsers}명
            </span>
          </div>
          <div className="admin-stat-row">
            <div className="admin-stat-card accent">
              <p>오늘 활성</p>
              <p className="value">{summary.activeTodayUsers}</p>
            </div>
            <div className="admin-stat-card muted">
              <p>시안 생성</p>
              <p className="value">{summary.draftCount}</p>
            </div>
          </div>

          <h2>최근 프로필</h2>
          {profiles.map((p) => (
            <div className="profile-row" key={p.id}>
              <span className="profile-avatar">{initials(p.email)}</span>
              <div className="info">
                <div className="name">{p.email}</div>
                <div className="meta">
                  {p.role === "admin" ? "관리자" : "일반 사용자"} · 시안 {p.draft_count}건
                </div>
              </div>
              <span className={`status-pill ${p.last_login_at ? "active" : "inactive"}`}>
                {p.last_login_at ? "활성" : "미활동"}
              </span>
            </div>
          ))}
        </>
      )}

      {tab === "usage" && (
        <>
          <h2>오늘의 처리 유형</h2>
          <div className="bar-chart">
            {eventCounts.length === 0 && <p style={{ color: "var(--muted)" }}>기록된 로그가 없습니다.</p>}
            {eventCounts.map(([type, count], i) => (
              <div
                key={type}
                className={`bar ${count === maxCount ? "peak" : ""}`}
                style={{ height: `${(count / maxCount) * 100}%` }}
                title={`${type}: ${count}`}
              />
            ))}
          </div>

          <div>
            <label>
              날짜 필터{" "}
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </label>{" "}
            <label>
              상태 필터{" "}
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">전체</option>
                <option value="success">성공</option>
                <option value="failed">실패</option>
              </select>
            </label>
          </div>

          <h2>기능 실행 로그</h2>
          {filteredActivity.length === 0 && <p style={{ color: "var(--muted)" }}>표시할 로그가 없습니다.</p>}
          {filteredActivity.map((log) => (
            <div className={`log-row ${log.status === "failed" ? "failed" : ""}`} key={log.id}>
              <div>
                <div>{log.event_type}</div>
                <div className="time">{log.page_path || "-"}</div>
              </div>
              <div className="time">{formatDate(log.created_at)}</div>
            </div>
          ))}
        </>
      )}

      {tab === "drafts" && (
        <>
          <h2>시안 기록</h2>
          {drafts.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">
                <Icon name="folder_off" />
              </span>
              <p>아직 생성된 시안이 없습니다</p>
            </div>
          ) : (
            drafts.map((d) => (
              <div className="draft-card" key={d.id}>
                <strong>{d.region_industry}</strong>
                <p className="dummy-note">
                  {d.user_email} · {formatDate(d.created_at)}
                </p>
                <span className={`status-pill ${d.email_sent ? "success" : "inactive"}`}>
                  {d.email_sent ? "발송 완료" : "미발송"}
                </span>
              </div>
            ))
          )}
        </>
      )}

      {tab === "emails" && (
        <>
          <h2>이메일 로그</h2>
          {emailLogs.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">
                <Icon name="mark_email_read" />
              </span>
              <p>발송 대기 중인 이메일이 없습니다</p>
            </div>
          ) : (
            emailLogs.map((log) => (
              <div className={`log-row ${log.status === "failed" ? "failed" : ""}`} key={log.id}>
                <div>
                  <div>{log.status === "sent" ? "발송 성공" : "발송 실패"}</div>
                  <div className="time">{log.error_code || "-"}</div>
                </div>
                <div className="time">{formatDate(log.created_at)}</div>
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
