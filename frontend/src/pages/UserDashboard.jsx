import { useEffect, useState } from "react";
import api from "../api/axios";
import { Button, Input, Select, Card, ErrorText } from "../components/ui";
import { useAuth } from "../context/AuthContext";



const CATEGORY_OPTIONS = ["Blog Submission", "Image Submission", "Social Bookmarking", "PDF Submission", "Business Listing", "Profile Creation"];
const TABS = [
  { id: "submit", label: "Submit Report" },
  { id: "history", label: "My Reports" },
  { id: "ranking", label: "Ranking Report" },
  { id: "rankingHistory", label: "My Ranking Reports" },
];

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("submit");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500 font-display text-xs font-bold text-white">
              U.D
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-ink">User Report Dashboard</p>
              <p className="text-xs text-ink/40">{user?.name} </p>
            </div>
          </div>

          <Button variant="ghost" onClick={logout} className="!py-1.5">
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full px-6 py-8">
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
        {tab === "ranking" && <RankingReportPanel />}
        {tab === "rankingHistory" && <MyRankingReportsPanel />}
      </main>
    </div>
  );
}

function SubmitReportForm() {
  const [projects, setProjects] = useState([]);
  const [websiteUrls, setWebsiteUrls] = useState([]);
  const [form, setForm] = useState({ project: "", websiteUrl: "", keyword: "", category: "", workingUrl: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/user/projects").then((res) => setProjects(res.data.projects));
  }, []);

  // When the project changes, fetch that project's website URLs and reset
  // the two dependent fields (website URL, keyword) since they no longer apply.
  useEffect(() => {
    if (!form.project) {
      setWebsiteUrls([]);
      return;
    }
    api.get("/user/website-urls", { params: { project: form.project } }).then((res) => {
      setWebsiteUrls(res.data.websiteUrls);
    });
    setForm((f) => ({ ...f, websiteUrl: "", keyword: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.project]);

  const selectedWebsiteUrl = websiteUrls.find((w) => w._id === form.websiteUrl);

  const handleWebsiteUrlChange = (id) => {
    setForm({ ...form, websiteUrl: id, keyword: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate URL
    try {
      new URL(form.workingUrl.trim());
    } catch {
      setError("Please enter a valid Working URL.");
      return;
    }
    setError(""); setSuccess(""); setBusy(true);
    try {
      await api.post("/user/reports", {
        project: form.project,
        websiteUrl: form.websiteUrl,
        keyword: form.keyword,
        category: form.category,
        workingUrl: form.workingUrl,
      });
      setSuccess("Report submitted successfully.");
      setForm({ project: form.project, websiteUrl: "", keyword: "", category: "", workingUrl: "" });
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
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>

        <Select
          label="Website URL"
          value={form.websiteUrl}
          onChange={(e) => handleWebsiteUrlChange(e.target.value)}
          required
          disabled={!form.project}
        >
          <option value="">{form.project ? "Select a website URL…" : "Select a project first"}</option>
          {websiteUrls.map((w) => <option key={w._id} value={w._id}>{w.url}</option>)}
        </Select>

        <Select
          label="Keyword"
          value={form.keyword}
          onChange={(e) => setForm({ ...form, keyword: e.target.value })}
          required
          disabled={!form.websiteUrl}
        >
          <option value="">{form.websiteUrl ? "Select a keyword…" : "Select a website URL first"}</option>
          {(selectedWebsiteUrl?.keywords || []).map((k) => <option key={k} value={k}>{k}</option>)}
        </Select>

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">Select a category…</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>

        <div>
          <label className="mb-2 block text-sm font-medium text-ink">
            Working URL
          </label>

          <textarea
            placeholder="https://... (the link to your completed work)"
            value={form.workingUrl}
            onChange={(e) =>
              setForm({ ...form, workingUrl: e.target.value })
            }
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>

        <p className="text-xs text-ink/40">
          Date and time of submission are recorded automatically. Once submitted, a report cannot be edited or deleted.
        </p>

        <ErrorText>{error}</ErrorText>
        {success && <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">{success}</p>}

        <Button type="submit" variant="accent" className="w-full bg-orange-500 text-white hover:bg-orange-600" disabled={busy}>
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
    <Card className="!p-0 overflow-x-auto">
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs text-ink/40">Read-only — submitted reports cannot be edited or deleted.</p>
      </div>
      <table className="min-w-[1200px] w-full table-fixed text-left text-sm">
        <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
          <tr>
            <th className="w-[180px] px-4 py-3 font-medium">Project</th>
            <th className="w-[300px] px-4 py-3 font-medium">Website URL</th>
            <th className="w-[180px] px-4 py-3 font-medium">Keyword</th>
            <th className="w-[300px] px-4 py-3 font-medium">Working URL</th>
            <th className="w-[180px] px-4 py-3 font-medium">Category</th>
            <th className="w-[180px] px-4 py-3 font-medium">Date</th>
            <th className="w-[180px] px-4 py-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {reports.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-ink/40">You haven't submitted any reports yet.</td></tr>
          )}
          {reports.map((r) => {
            const { date, time } = formatDate(r.createdAt);
            return (
              <tr key={r._id}>
                <td className="px-4 py-3 text-ink/70">{r.project?.name || "—"}</td>
                <td className="px-4 py-3">
                  <a href={r.workUrl} target="_blank" rel="noreferrer" className="block max-w-[300px]  text-accent hover:underline break-all whitespace-normal">
                    {r.workUrl}
                  </a>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-accent">{r.keyword || "—"}</td>
                <td className="px-4 py-3">
                  {r.workingUrl
                    ?.split(/\r?\n|,/)
                    .filter((url) => url.trim())
                    .map((url, index) => (
                      <a
                        key={index}
                        href={url.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-[300px] break-all whitespace-normal text-accent hover:underline mb-1"
                      >
                        {url.trim()}
                      </a>
                    ))}
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

function RankingReportPanel() {
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ranks, setRanks] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/user/projects").then((res) => setProjects(res.data.projects));
  }, []);

  useEffect(() => {
    if (!project) {
      setKeywords([]);
      return;
    }
    api.get("/user/ranking-keywords", { params: { project } }).then((res) => {
      setKeywords(res.data.keywords);
      setRanks({});
    });
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setBusy(true);
    try {
      const entries = keywords
        .map((k) => ({ keyword: k, rank: (ranks[k] || "").trim() }))
        .filter((e) => e.rank);

      if (entries.length === 0) {
        setError("Enter at least one rank value.");
        setBusy(false);
        return;
      }

      await api.post("/user/ranking-reports", { project, date, entries });
      setSuccess("Ranking report submitted successfully.");
      setRanks({});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit ranking report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select label="Project" value={project} onChange={(e) => setProject(e.target.value)} required>
            <option value="">Select a project…</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>

          {project && (
            <>
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

              {keywords.length === 0 ? (
                <p className="text-sm text-ink/40">This project has no keywords set up yet.</p>
              ) : (
                <div className="overflow-hidden rounded-md border border-line">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
                      <tr>
                        <th className="w-14 px-3 py-2 font-medium">S.No</th>
                        <th className="px-3 py-2 font-medium">Keyword</th>
                        <th className="w-40 px-3 py-2 font-medium">Current Ranking</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {keywords.map((k, i) => (
                        <tr key={k}>
                          <td className="px-3 py-2 text-ink/60">{i + 1}</td>
                          <td className="px-3 py-2 text-ink/80">{k}</td>
                          <td className="px-3 py-2">
                            <input
                              className="focus-ring w-full rounded-md border border-line bg-white px-2 py-1 text-sm"
                              placeholder="e.g. 4"
                              inputMode="numeric"
                              maxLength={2}
                              value={ranks[k] || ""}
                              onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
                                setRanks({ ...ranks, [k]: digitsOnly });
                              }}
                              required
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <ErrorText>{error}</ErrorText>
              {success && <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">{success}</p>}

              <Button type="submit" variant="accent" className="w-full" disabled={busy || keywords.length === 0}>
                {busy ? "Submitting…" : "Submit ranking report"}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
}

function MyRankingReportsPanel() {
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState("");
  const [rankingReports, setRankingReports] = useState([]);

  useEffect(() => {
    api.get("/user/projects").then((res) => setProjects(res.data.projects));
  }, []);

  useEffect(() => {
    if (!project) {
      setRankingReports([]);
      return;
    }
    api.get("/user/ranking-reports", { params: { project, limit: 4 } }).then((res) => {
      setRankingReports(res.data.rankingReports);
    });
  }, [project]);

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });


  return (
    <div className="space-y-6">
      <Card>
        <Select label="Project" value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
      </Card>

      {!project && (
        <p className="text-sm text-ink/40">Select a project above to view your last 4 ranking reports.</p>
      )}
      {project && rankingReports.length === 0 && (
        <p className="text-sm text-ink/40">You haven't submitted any ranking reports for this project yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rankingReports.map((r) => (
          <Card key={r._id}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-ink">{r.project?.name || "—"}</p>
              <span className="flex flex-col items-end font-mono text-xs text-ink/50">
                <span>{formatDate(r.date)}</span>
                <span className="text-ink/40">{formatTime(r.createdAt)}</span>
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink/40">
                <tr>
                  <th className="w-10 py-1.5 font-medium">Sr.no</th>
                  <th className="py-1.5 font-medium">Keyword</th>
                  <th className="w-32 py-1.5 font-medium">Current Ranking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {r.entries.map((e, i) => (
                  <tr key={e.keyword}>
                    <td className="py-1.5 text-ink/50">{i + 1}</td>
                    <td className="py-1.5 text-ink/80">{e.keyword}</td>
                    <td className="py-1.5 font-mono text-xs text-accent">{e.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}