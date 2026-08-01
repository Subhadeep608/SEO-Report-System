import { useEffect, useState } from "react";
import api from "../api/axios";
import { Button, Input, Select, Card, Badge, ErrorText } from "../components/ui";
import DashboardLayout from "../components/DashboardLayout";

const TABS = [
  { id: "reports", label: "Reports" },
  { id: "users", label: "Users" },
  { id: "projects", label: "Projects" },
  { id: "websiteUrls", label: "Website URLs" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("reports");

  return (
    <DashboardLayout title="Admin" roleLabel="Manage users, projects & reports">
      <div className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "border-accent text-accent" : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "reports" && <ReportsPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "projects" && <ProjectsPanel />}
      {tab === "websiteUrls" && <WebsiteUrlsPanel />}
      {tab === "websiteUrls" && <WebsiteUrlsPanel />}
    </DashboardLayout>
  );
}

function ReportsPanel() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ project: "", user: "" });

  const load = async () => {
    const params = {};
    if (filters.project) params.project = filters.project;
    if (filters.user) params.user = filters.user;
    const [reportsRes, projectsRes, usersRes] = await Promise.all([
      api.get("/admin/reports", { params }),
      api.get("/admin/projects"),
      api.get("/admin/users"),
    ]);
    setReports(reportsRes.data.reports);
    setProjects(projectsRes.data.projects);
    setUsers(usersRes.data.users);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const handleDelete = async (report) => {
    const confirmed = window.confirm(`Delete this report by ${report.submittedByName}? This cannot be undone.`);
    if (!confirmed) return;
    await api.delete(`/admin/reports/${report._id}`);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select label="Filter by project" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="w-56">
            <Select label="Filter by user" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })}>
              <option value="">All users</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </div>
          <Button variant="ghost" onClick={() => setFilters({ project: "", user: "" })}>Clear filters</Button>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-ink/40">
              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
              live
            </span>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Keyword</th>
              <th className="px-4 py-3 font-medium">Website URL</th>
              <th className="px-4 py-3 font-medium">Working URL</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {reports.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-ink/40">No reports submitted yet.</td></tr>
            )}
            {reports.map((r) => {
              const { date, time } = formatDate(r.createdAt);
              return (
                <tr key={r._id} className="group hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-ink">{r.submittedByName}</td>
                  <td className="px-4 py-3 text-ink/70">{r.project?.name || "—"}</td>
                  <td className="px-4 py-3"><Badge tone="accent">{r.keyword || "—"}</Badge></td>
                  <td className="px-4 py-3">
                    <a href={r.workUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">{r.workUrl}</a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={r.workingUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">{r.workingUrl}</a>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{r.category}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{time}</td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => handleDelete(r)}
                      title="Delete report"
                      className="rounded-md p-1.5 text-ink/30 opacity-0 transition hover:bg-warn/10 hover:text-warn group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", loginId: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/users");
    setUsers(res.data.users);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setBusy(true);
    try {
      await api.post("/admin/users", form);
      setForm({ name: "", loginId: "", password: "" });
      setSuccess("User created. Send them the login ID and password.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (u) => {
    await api.patch(`/admin/users/${u._id}/status`, { isActive: !u.isActive });
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <h2 className="font-display text-base font-semibold text-ink">Create a User</h2>
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Login ID" value={form.loginId} onChange={(e) => setForm({ ...form, loginId: e.target.value })} required />
          <Input label="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <ErrorText>{error}</ErrorText>
          {success && <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">{success}</p>}
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create user"}</Button>
        </form>
      </Card>

      <Card className="lg:col-span-3">
        <h2 className="font-display text-base font-semibold text-ink">Users</h2>
        <div className="mt-4 divide-y divide-line">
          {users.length === 0 && <p className="py-4 text-sm text-ink/40">No users created yet.</p>}
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink">{u.name}</p>
                <p className="font-mono text-xs text-ink/40">{u.loginId}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={u.isActive ? "good" : "warn"}>{u.isActive ? "active" : "disabled"}</Badge>
                <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => toggleStatus(u)}>{u.isActive ? "Disable" : "Enable"}</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ProjectsPanel() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get("/admin/projects");
    setProjects(res.data.projects);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.post("/admin/projects", form);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (p) => {
    await api.patch(`/admin/projects/${p._id}/status`, { isActive: !p.isActive });
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <h2 className="font-display text-base font-semibold text-ink">Create a Project</h2>
        <p className="mt-1 text-sm text-ink/50">
          Add website URLs and their keywords for this project from the "Website URLs" tab after creating it.
        </p>
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <Input label="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button>
        </form>
      </Card>

      <Card className="lg:col-span-3">
        <h2 className="font-display text-base font-semibold text-ink">Projects</h2>
        <div className="mt-4 divide-y divide-line">
          {projects.length === 0 && <p className="py-4 text-sm text-ink/40">No projects created yet.</p>}
          {projects.map((p) => (
            <div key={p._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink">{p.name}</p>
                {p.description && <p className="text-xs text-ink/40">{p.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={p.isActive ? "good" : "warn"}>{p.isActive ? "active" : "disabled"}</Badge>
                <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => toggleStatus(p)}>{p.isActive ? "Disable" : "Enable"}</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function WebsiteUrlsPanel() {
  const [projects, setProjects] = useState([]);
  const [websiteUrls, setWebsiteUrls] = useState([]);
  const [form, setForm] = useState({ project: "", url: "", keywords: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [keywordDrafts, setKeywordDrafts] = useState({});

  const load = async () => {
    const [projectsRes, urlsRes] = await Promise.all([
      api.get("/admin/projects"),
      api.get("/admin/website-urls"),
    ]);
    setProjects(projectsRes.data.projects);
    setWebsiteUrls(urlsRes.data.websiteUrls);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.post("/admin/website-urls", form);
      setForm({ project: form.project, url: "", keywords: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add website URL");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (w) => {
    await api.patch(`/admin/website-urls/${w._id}/status`, { isActive: !w.isActive });
    load();
  };

  const saveKeywords = async (id) => {
    const keywords = keywordDrafts[id];
    if (keywords === undefined) return;
    await api.patch(`/admin/website-urls/${id}/keywords`, { keywords });
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <h2 className="font-display text-base font-semibold text-ink">Add a Website URL</h2>
        <p className="mt-1 text-sm text-ink/50">
          Users pick this URL after selecting the project, then pick one of its keywords.
        </p>
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <Select label="Project" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
            <option value="">Select a project…</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
          <Input label="Website URL" type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          <Input
            label="Keywords (comma separated)"
            placeholder="e.g. seo services, link building"
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
          />
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Adding…" : "Add website URL"}</Button>
        </form>
      </Card>

      <Card className="lg:col-span-3 !p-0 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Website URLs</h2>
        </div>
        <div className="divide-y divide-line">
          {websiteUrls.length === 0 && <p className="px-6 py-6 text-sm text-ink/40">No website URLs added yet.</p>}
          {websiteUrls.map((w) => (
            <div key={w._id} className="px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink/40">{w.project?.name || "—"}</p>
                  <a href={w.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline break-all">{w.url}</a>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={w.isActive ? "good" : "warn"}>{w.isActive ? "active" : "disabled"}</Badge>
                  <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => toggleStatus(w)}>{w.isActive ? "Disable" : "Enable"}</Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="focus-ring flex-1 rounded-md border border-line bg-white px-2 py-1.5 font-mono text-xs"
                  placeholder="keyword1, keyword2, …"
                  defaultValue={w.keywords.join(", ")}
                  onChange={(e) => setKeywordDrafts({ ...keywordDrafts, [w._id]: e.target.value })}
                />
                <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => saveKeywords(w._id)}>Save</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}