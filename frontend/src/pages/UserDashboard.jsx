import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Select, Card, ErrorText } from "../components/ui";

const CATEGORY_OPTIONS = ["Development", "Design", "Testing", "Research", "Content", "Other"];
const TABS = [
  { id: "submit", label: "Submit Report" },
  { id: "history", label: "My Reports" },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("submit");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500 font-display text-xs font-bold text-white">
              U.D
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-ink">Report Dashboard</p>
              <p className="text-xs text-ink/40">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink/70">{user?.role}</span>
            <Button variant="ghost" onClick={logout} className="!py-1.5">
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex gap-1 border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === t.id ? "border-orange-500 text-orange-500" : "border-transparent text-ink/50 hover:text-ink"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "submit" && <SubmitReportForm onSubmitted={() => setTab("history")} />}
        {tab === "history" && <MyReportsList />}
      </main>
    </div>
  );
}

function SubmitReportForm({ onSubmitted }) {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project: "", workUrl: "", category: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/user/projects").then((res) => setProjects(res.data.projects));
  }, []);

  const selectedProject = projects.find((p) => p._id === form.project);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await api.post("/user/reports", {
        project: form.project,
        workUrl: form.workUrl,
        category: form.category,
      });
      setSuccess("Report submitted successfully.");
      setForm({ project: "", workUrl: "", category: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Select
          label="Project"
          value={form.project}
          onChange={(e) => setForm({ ...form, project: e.target.value })}
          required
        >
          <option value="">Select a project…</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </Select>

        <Input
          label="Keyword (fixed — set by admin)"
          value={selectedProject?.keyword || ""}
          readOnly
          disabled
          className="cursor-not-allowed bg-line/30 font-mono"
          placeholder="Auto-filled after you select a project"
        />

        <Input
          label="Work URL"
          type="url"
          placeholder="https://…"
          value={form.workUrl}
          onChange={(e) => setForm({ ...form, workUrl: e.target.value })}
          required
        />

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">Select a category…</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <p className="text-xs text-ink/50">
          Date and time of submission are recorded automatically. Once submitted, a report cannot be edited or deleted.
        </p>

        <ErrorText>{error}</ErrorText>
        {success && <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">{success}</p>}

        <Button type="submit" variant="orange" className="w-full" disabled={busy}>
          {busy ? "Submitting…" : "Submit report"}
        </Button>
      </form>
    </Card>
  );
}

function MyReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/reports").then((res) => {
      setReports(res.data.reports);
      setLoading(false);
    });
  }, []);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  if (loading) return <Card><p className="text-sm text-ink/40">Loading…</p></Card>;

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs text-ink/60">Read-only — submitted reports cannot be edited or deleted.</p>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Keyword</th>
            <th className="px-4 py-3 font-medium">Work URL</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {reports.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-ink/40">
                You haven't submitted any reports yet.
              </td>
            </tr>
          )}
          {reports.map((r) => {
            const { date, time } = formatDate(r.createdAt);
            return (
              <tr key={r._id}>
                <td className="px-4 py-3 text-ink/70">{r.project?.name || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{r.keyword || "—"}</td>
                <td className="px-4 py-3">
                  <a href={r.workUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    {r.workUrl}
                  </a>
                </td>
                <td className="px-4 py-3 text-ink/70">{r.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{date}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
