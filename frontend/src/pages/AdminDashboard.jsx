import { useEffect, useState } from "react";
import api from "../api/axios";
import { Button, Input, Select, Card, Badge, ErrorText } from "../components/ui";
import DashboardLayout from "../components/DashboardLayout";

const CATEGORY_OPTIONS = ["Blog Submission", "Image Submission", "Social Bookmarking", "PDF Submission", "Business Listing", "Profile Creation"];

const TABS = [
  { id: "reports", label: "Reports" },
  { id: "users", label: "Users" },
  { id: "projects", label: "Projects" },
  { id: "websiteUrls", label: "Website URLs" },
  { id: "rankingReports", label: "Ranking Reports" },
  { id: "allLists", label: "All Lists" },
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
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === t.id ? "border-accent text-accent" : "border-transparent text-ink/50 hover:text-ink"
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
      {tab === "rankingReports" && <RankingReportsPanel />}
      {tab === "allLists" && <AllListsPanel />}
    </DashboardLayout>
  );
}

function ReportsPanel() {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [websiteUrls, setWebsiteUrls] = useState([]);
  const [filters, setFilters] = useState({ project: "", user: "", websiteUrl: "", category: "", from: "", to: "" });

  const load = async () => {
    const params = {};
    if (filters.project) params.project = filters.project;
    if (filters.user) params.user = filters.user;
    if (filters.websiteUrl) params.websiteUrl = filters.websiteUrl;
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
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

  // When the project filter changes, load that project's Website URLs and
  // reset the Website URL filter since it no longer applies.
  useEffect(() => {
    if (!filters.project) {
      setWebsiteUrls([]);
      return;
    }
    api.get("/admin/website-urls", { params: { project: filters.project } }).then((res) => {
      setWebsiteUrls(res.data.websiteUrls);
    });
    setFilters((f) => ({ ...f, websiteUrl: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.project]);


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
        <div className="mb-3 flex items-center gap-2 text-sm text-ink/50">
          <div className=" flex items-center gap-2 ">
            <span className="flex items-center gap-1.5 text-xs text-ink/80 bg-[#f7f8fa] py-2 px-4 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
              Live
            </span>
          </div>

          <Button variant="orange" onClick={() => setFilters({ project: "", user: "", category: "", from: "", to: "" })}>Clear filters</Button>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select label="Filter by project" value={filters.project} onChange={(e) => setFilters({ ...filters, project: e.target.value })}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="w-40">
            <Select label="Filter by user" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })}>
              <option value="">All users</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </div>
          <div className="w-56">
            <Select
              label="Filter by website URL"
              value={filters.websiteUrl}
              onChange={(e) => setFilters({ ...filters, websiteUrl: e.target.value })}
              disabled={!filters.project}
            >
              <option value="">{filters.project ? "All website URLs" : "Select a project first"}</option>
              {websiteUrls.map((w) => <option key={w._id} value={w._id}>{w.url}</option>)}
            </Select>
          </div>
          <div className="w-44">
            <Select label="Filter by category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="w-40">
            <Input label="From date" type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="w-40">
            <Input label="To date" type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>

        </div>
      </Card>

      <Card className="!p-0 overflow-x-auto">
        <table className="min-w-[1200px] w-full table-fixed text-left text-sm">
          <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="w-[60px] px-4 py-3 font-medium">Sr.No</th>
              <th className="w-[180px] px-4 py-3 font-medium">User</th>
              <th className="w-[180px] px-4 py-3 font-medium">Project</th>
              <th className="w-[180px] px-4 py-3 font-medium">Keyword</th>
              <th className="w-[300px] px-4 py-3 font-medium">Website URL</th>
              <th className="w-[300px] px-4 py-3 font-medium">Submitted URL</th>
              <th className="w-[150px] px-4 py-3 font-medium">Category</th>
              <th className="w-[120px] px-4 py-3 font-medium">Date</th>
              <th className="w-[120px] px-4 py-3 font-medium">Time</th>
              <th className="w-[60px] w-10 px-2 py-3"></th>
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
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{reports.indexOf(r) + 1}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.submittedByName}</td>
                  <td className="px-4 py-3 text-ink/70">{r.project?.name || "—"}</td>
                  <td className="px-4 py-3"><Badge tone="accent">{r.keyword || "—"}</Badge></td>
                  <td className="px-4 py-3">
                    <a href={r.workUrl} target="_blank" rel="noreferrer" className="block max-w-[230px]  text-accent hover:underline break-all whitespace-normal">
                      {r.workUrl}
                    </a>
                  </td>
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

  const handleDelete = async (u) => {
    const confirmed = window.confirm(`Delete user "${u.name}"? This cannot be undone.`);
    if (!confirmed) return;
    await api.delete(`/admin/users/${u._id}`);
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
                <Button variant="danger" className="!py-1 !px-3 text-xs" onClick={() => handleDelete(u)}>Delete</Button>
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
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", assignedUsers: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });
  const [editError, setEditError] = useState("");

  const load = async () => {
    const [projectsRes, usersRes] = await Promise.all([
      api.get("/admin/projects"),
      api.get("/admin/users"),
    ]);
    setProjects(projectsRes.data.projects);
    setUsers(usersRes.data.users);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.post("/admin/projects", form);
      setForm({ name: "", description: "", assignedUsers: [] });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setBusy(false);
    }
  };

  const toggleFormUser = (userId) => {
    setForm((f) => ({
      ...f,
      assignedUsers: f.assignedUsers.includes(userId)
        ? f.assignedUsers.filter((id) => id !== userId)
        : [...f.assignedUsers, userId],
    }));
  };

  const toggleStatus = async (p) => {
    await api.patch(`/admin/projects/${p._id}/status`, { isActive: !p.isActive });
    load();
  };

  const handleDelete = async (p) => {
    const confirmed = window.confirm(
      `Delete project "${p.name}"? This also deletes all of its Website URLs. This cannot be undone.`
    );
    if (!confirmed) return;
    await api.delete(`/admin/projects/${p._id}`);
    load();
  };

  const toggleProjectUser = async (project, userId) => {
    const currentIds = project.assignedUsers.map((u) => u._id);
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    await api.patch(`/admin/projects/${project._id}/assigned-users`, { assignedUsers: newIds });
    load();
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditDraft({ name: p.name, description: p.description || "" });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ name: "", description: "" });
    setEditError("");
  };

  const saveEdit = async (id) => {
    setEditError("");
    try {
      await api.patch(`/admin/projects/${id}`, editDraft);
      setEditingId(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update project");
    }
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

          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">
              Assign users (optional)
            </span>
            {users.length === 0 ? (
              <p className="text-sm text-ink/40">No users created yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleFormUser(u._id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${form.assignedUsers.includes(u._id)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line text-ink/60 hover:bg-line/40"
                      }`}
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="accent" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create project"}</Button>
        </form>
      </Card>

      <Card className="lg:col-span-3">
        <h2 className="font-display text-base font-semibold text-ink">Projects</h2>
        <div className="mt-4 divide-y divide-line">
          {projects.length === 0 && <p className="py-4 text-sm text-ink/40">No projects created yet.</p>}
          {projects.map((p, index) => {
            const assignedIds = p.assignedUsers.map((u) => u._id);
            const isEditing = editingId === p._id;
            return (
              <div key={p._id} className="py-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      label="Project name"
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                    />
                    <Input
                      label="Description (optional)"
                      value={editDraft.description}
                      onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                    />
                    <ErrorText>{editError}</ErrorText>
                    <div className="flex gap-2">
                      <Button variant="accent" className="!py-1.5 !px-3 text-xs" onClick={() => saveEdit(p._id)}>Save</Button>
                      <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Serial no */}
                      <p className="w-5 text-sm font-medium text-ink/40">{index + 1}</p>
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        {p.description && <p className="text-xs text-ink/40">{p.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={p.isActive ? "good" : "warn"}>{p.isActive ? "active" : "disabled"}</Badge>
                      <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => startEdit(p)}>Edit</Button>
                      <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => toggleStatus(p)}>{p.isActive ? "Disable" : "Enable"}</Button>
                      <Button variant="danger" className="!py-1 !px-3 text-xs" onClick={() => handleDelete(p)}>Delete</Button>
                    </div>
                  </div>
                )}

                <div className="mt-2 pl-8">
                  <p className="mb-1 text-xs text-ink/40">Assigned users:</p>
                  {users.length === 0 ? (
                    <p className="text-xs text-ink/30">No users created yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {users.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => toggleProjectUser(p, u._id)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${assignedIds.includes(u._id)
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-line text-ink/50 hover:bg-line/40"
                            }`}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function WebsiteUrlsPanel() {
  const [projects, setProjects] = useState([]);
  const [websiteUrls, setWebsiteUrls] = useState([]);
  const [filterProject, setFilterProject] = useState("");
  const [form, setForm] = useState({ project: "", url: "", keywords: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ url: "", keywords: "" });

  const loadProjects = async () => {
    const res = await api.get("/admin/projects");
    setProjects(res.data.projects);
  };

  const loadWebsiteUrls = async (projectId) => {
    if (!projectId) {
      setWebsiteUrls([]);
      return;
    }
    const res = await api.get("/admin/website-urls", { params: { project: projectId } });
    setWebsiteUrls(res.data.websiteUrls);
  };

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadWebsiteUrls(filterProject); }, [filterProject]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api.post("/admin/website-urls", form);
      setForm({ project: form.project, url: "", keywords: "" });
      // If we're currently viewing the same project this URL belongs to, refresh the list
      if (filterProject === form.project) loadWebsiteUrls(filterProject);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add website URL");
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (w) => {
    await api.patch(`/admin/website-urls/${w._id}/status`, { isActive: !w.isActive });
    loadWebsiteUrls(filterProject);
  };

  const handleDelete = async (w) => {
    const confirmed = window.confirm(`Delete this website URL? This cannot be undone.`);
    if (!confirmed) return;
    await api.delete(`/admin/website-urls/${w._id}`);
    loadWebsiteUrls(filterProject);
  };

  const startEdit = (w) => {
    setEditingId(w._id);
    setEditDraft({ url: w.url, keywords: w.keywords.join(", ") });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ url: "", keywords: "" });
  };

  const saveEdit = async (id) => {
    await api.patch(`/admin/website-urls/${id}`, {
      url: editDraft.url,
      keywords: editDraft.keywords,
    });
    setEditingId(null);
    loadWebsiteUrls(filterProject);
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
          <div className="mt-3">
            <Select label="Filter by project" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>
        </div>
        <div className="divide-y divide-line">
          {!filterProject && (
            <p className="px-6 py-6 text-sm text-ink/40">Select a project above to view its website URLs.</p>
          )}
          {filterProject && websiteUrls.length === 0 && (
            <p className="px-6 py-6 text-sm text-ink/40">No website URLs added for this project yet.</p>
          )}
          {websiteUrls.map((w) => (
            <div key={w._id} className="px-6 py-4">
              {editingId === w._id ? (
                <div className="space-y-3">
                  <Input
                    label="Website URL"
                    type="url"
                    value={editDraft.url}
                    onChange={(e) => setEditDraft({ ...editDraft, url: e.target.value })}
                  />
                  <Input
                    label="Keywords (comma separated)"
                    value={editDraft.keywords}
                    onChange={(e) => setEditDraft({ ...editDraft, keywords: e.target.value })}
                    className="font-mono"
                  />
                  <div className="flex gap-2">
                    <Button variant="accent" className="!py-1.5 !px-3 text-xs" onClick={() => saveEdit(w._id)}>Save</Button>
                    <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink/80">{websiteUrls.indexOf(w) + 1}</p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <a href={w.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-accent hover:underline break-all">{w.url}</a>
                    <p className="mt-1 text-xs text-ink/50 break-words">
                      {w.keywords.length > 0 ? w.keywords.join(", ") : "No keywords set"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={w.isActive ? "good" : "warn"}>{w.isActive ? "active" : "disabled"}</Badge>
                    <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => startEdit(w)}>Edit</Button>
                    <Button variant="ghost" className="!py-1 !px-3 text-xs" onClick={() => toggleStatus(w)}>{w.isActive ? "Disable" : "Enable"}</Button>
                    <Button variant="danger" className="!py-1 !px-3 text-xs" onClick={() => handleDelete(w)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function RankingReportsPanel() {
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState("");
  const [rankingReports, setRankingReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 2;

  useEffect(() => {
    api.get("/admin/projects").then((res) => setProjects(res.data.projects));
  }, []);

  const load = () => {
    if (!filterProject) {
      setRankingReports([]);
      setTotalPages(1);
      return;
    }
    api
      .get("/admin/ranking-reports", { params: { project: filterProject, page, limit: PAGE_SIZE } })
      .then((res) => {
        setRankingReports(res.data.rankingReports);
        setTotalPages(res.data.totalPages);
      });
  };

  useEffect(() => {
    setPage(1);
  }, [filterProject]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterProject, page]);

  const handleDelete = async (r) => {
    const confirmed = window.confirm(
      `Delete this ranking report submitted by ${r.submittedBy?.name || "this user"}? This cannot be undone.`
    );
    if (!confirmed) return;
    await api.delete(`/admin/ranking-reports/${r._id}`);
    load();
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });


  return (
    <div className="space-y-6">
      <Card>
        <div className="w-64">
          <Select label="Filter by project" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">Select a project…</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        </div>
      </Card>

      {!filterProject && (
        <p className="text-sm text-ink/40">Select a project above to view its ranking reports.</p>
      )}
      {filterProject && rankingReports.length === 0 && (
        <p className="text-sm text-ink/40">No ranking reports submitted for this project yet.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {rankingReports.map((r) => (
          <Card key={r._id} className="relative">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{r.submittedBy?.name || "—"}</p>
                <p className="text-xs text-ink/40">{r.submittedBy?.loginId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex flex-col items-end font-mono text-xs text-ink/50">
                  <span>{formatDate(r.date)}</span>
                  <span className="text-ink/40">{formatTime(r.createdAt)}</span>
                </span>
                <Button variant="danger" className="!py-1 !px-3 text-xs" onClick={() => handleDelete(r)}>Delete</Button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-ink/40">
                <tr>
                  <th className="w-10 py-1.5 font-medium">Sr.No</th>
                  <th className="py-1.5 font-medium">Keyword</th>
                  <th className="w-32 py-1.5 font-medium">Current Ranking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...r.entries]
                  .sort((a, b) => Number(a.rank) - Number(b.rank))
                  .map((e, i) => (
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

      {filterProject && rankingReports.length > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            className="!py-1.5 !px-4 text-xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-ink/50">Page {page} of {totalPages}</span>
          <Button
            variant="ghost"
            className="!py-1.5 !px-4 text-xs"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}


function AllListsPanel() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ category: "", user: "" });
  const [entries, setEntries] = useState([]);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  useEffect(() => {
    api.get("/admin/users").then((res) => setUsers(res.data.users));
  }, []);

  const load = () => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.user) params.user = filters.user;
    api.get("/admin/list-entries", { params }).then((res) => setEntries(res.data.listEntries));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const togglePassword = (id) => {
    setVisiblePasswords((v) => ({ ...v, [id]: !v[id] }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Select label="Filter by category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="w-56">
            <Select label="Filter by user" value={filters.user} onChange={(e) => setFilters({ ...filters, user: e.target.value })}>
              <option value="">All users</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface/60 text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">URL</th>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Password</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {entries.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-ink/40">No lists found.</td></tr>
            )}
            {entries.map((e) => (
              <tr key={e._id}>
                <td className="px-4 py-3 font-medium text-ink">{e.createdBy?.name || e.createdByName}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">{e.category}</span></td>
                <td className="px-4 py-3">
                  <a href={e.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{e.url}</a>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/70">{e.loginId}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-mono text-xs text-ink/70">
                    {visiblePasswords[e._id] ? e.password : "••••••••"}
                    <button type="button" onClick={() => togglePassword(e._id)} className="text-accent hover:underline">
                      {visiblePasswords[e._id] ? "hide" : "show"}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}