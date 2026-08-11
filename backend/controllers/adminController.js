const User = require("../models/User");
const Project = require("../models/Project");
const WebsiteUrl = require("../models/WebsiteUrl");
const Report = require("../models/Report");
const RankingReport = require("../models/RankingReport");
const XLSX = require("xlsx");

// ---------- Users ----------

const createUser = async (req, res) => {
  try {
    const { name, loginId, password } = req.body;
    if (!name || !loginId || !password) {
      return res.status(400).json({ message: "name, loginId, and password are required" });
    }
    const exists = await User.findOne({ loginId: loginId.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ message: "loginId already in use" });
    }
    const user = await User.create({
      name,
      loginId: loginId.toLowerCase().trim(),
      password,
      role: "user",
      createdBy: req.user._id,
    });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "user" },
      { isActive },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ _id: req.params.id, role: "user" });
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------- Projects (name + description only, no keyword) ----------

const createProject = async (req, res) => {
  try {
    const { name, description, assignedUsers } = req.body;
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const project = await Project.create({
      name,
      description: description || "",
      assignedUsers: Array.isArray(assignedUsers) ? assignedUsers : [],
      createdBy: req.user._id,
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/projects/:id
// @desc  Admin edits a project's name and/or description
const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const update = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "name cannot be empty" });
      }
      update.name = name.trim();
    }
    if (description !== undefined) update.description = description;

    const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true }).populate(
      "assignedUsers",
      "name loginId"
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("assignedUsers", "name loginId")
      .sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/projects/:id/assigned-users
// @desc  Admin decides which Users can see/work on this project
const updateProjectAssignedUsers = async (req, res) => {
  try {
    const { assignedUsers } = req.body;
    if (!Array.isArray(assignedUsers)) {
      return res.status(400).json({ message: "assignedUsers must be an array of user IDs" });
    }
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { assignedUsers },
      { new: true }
    ).populate("assignedUsers", "name loginId");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const setProjectStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// @route DELETE /api/admin/projects/:id
// @desc  Deletes the project and its Website URL entries. Historical reports
// are kept as-is (they already store their own snapshot of the data).
const deleteProject = async (req, res) => {
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Project not found" });
    await WebsiteUrl.deleteMany({ project: req.params.id });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// ---------- Website URLs (belong to a project, carry a keyword list) ----------

// Splits a comma-separated keyword field into clean, deduped values
const parseKeywords = (raw) =>
  (raw || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);




// Escapes regex special characters so a URL can be safely used in a $regex query
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Strips trailing slashes so "example.com/page" and "example.com/page/" are
// treated as the same URL for storage and duplicate checks.
const normalizeUrl = (raw) => (raw || "").trim().replace(/\/+$/, "");

const createWebsiteUrl = async (req, res) => {
  try {
    const { project, url, keywords } = req.body;
    if (!project || !url) {
      return res.status(400).json({ message: "project and url are required" });
    }
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    const trimmedUrl = normalizeUrl(url);

    // Prevent the same URL being added twice under the same project.
    // Matches with or without a trailing slash, in case older records still have one.
    const duplicate = await WebsiteUrl.findOne({
      project,
      url: { $regex: `^${escapeRegex(trimmedUrl)}/?$`, $options: "i" },
    });
    if (duplicate) {
      return res.status(409).json({
        message: "This URL has already been added for this project.",
      });
    }

    const websiteUrl = await WebsiteUrl.create({
      project,
      url: trimmedUrl,
      keywords: parseKeywords(keywords),
      createdBy: req.user._id,
    });
    res.status(201).json({ websiteUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/admin/website-urls?project=<id>
const getWebsiteUrls = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const websiteUrls = await WebsiteUrl.find(filter)
      .populate("project", "name")
      .sort({ createdAt: -1 });
    res.json({ websiteUrls });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/website-urls/:id
// @desc  Admin edits both the URL and keyword list of a Website URL entry
const updateWebsiteUrl = async (req, res) => {
  try {
    const { url, keywords } = req.body;

    const existing = await WebsiteUrl.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Website URL not found" });

    const update = {};
    if (url !== undefined) {
      const trimmedUrl = normalizeUrl(url);
      const duplicate = await WebsiteUrl.findOne({
        _id: { $ne: existing._id },
        project: existing.project,
        url: { $regex: `^${escapeRegex(trimmedUrl)}/?$`, $options: "i" },
      });
      if (duplicate) {
        return res.status(409).json({
          message: "This URL has already been added for this project.",
        });
      }
      update.url = trimmedUrl;
    }
    if (keywords !== undefined) update.keywords = parseKeywords(keywords);

    const websiteUrl = await WebsiteUrl.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ websiteUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/admin/website-urls/:id
const deleteWebsiteUrl = async (req, res) => {
  try {
    const deleted = await WebsiteUrl.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Website URL not found" });
    res.json({ message: "Website URL deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/website-urls/:id/status
const setWebsiteUrlStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const websiteUrl = await WebsiteUrl.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!websiteUrl) return res.status(404).json({ message: "Website URL not found" });
    res.json({ websiteUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------- Reports ----------

const getReports = async (req, res) => {
  try {
    const { project, user, websiteUrl, category, from, to } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.submittedBy = user;
    if (websiteUrl) filter.websiteUrl = websiteUrl;
    if (category) filter.category = category;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const reports = await Report.find(filter)
      .populate("project", "name")
      .populate("websiteUrl", "url")
      .populate("submittedBy", "name loginId")
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Report not found" });
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const exportReports = async (req, res) => {
  try {
    const { user, from, to } = req.query;
    const filter = {};
    if (user) filter.submittedBy = user;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }
    const reports = await Report.find(filter)
      .populate("project", "name")
      .populate("submittedBy", "name loginId")
      .sort({ createdAt: -1 });

    const rows = reports.map((r) => {
      const createdAt = new Date(r.createdAt);
      return {
        User: r.submittedBy?.name || r.submittedByName,
        Project: r.project?.name || "",
        Keyword: r.keyword,
        "Website URL": r.workUrl,
        "Working URL": r.workingUrl,
        Category: r.category,
        Date: createdAt.toLocaleDateString(),
        Time: createdAt.toLocaleTimeString(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="reports-export.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// @route GET /api/admin/ranking-reports?project=<id>
// @desc  All ranking reports submitted for a project, newest first
const getRankingReports = async (req, res) => {
  try {
    const { project, page = 1, limit = 2 } = req.query;
    if (!project) {
      return res.status(400).json({ message: "project query param is required" });
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 2);

    const total = await RankingReport.countDocuments({ project });
    const rankingReports = await RankingReport.find({ project })
      .populate("project", "name")
      .populate("submittedBy", "name loginId")
      .sort({ date: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      rankingReports,
      total,
      page: pageNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route DELETE /api/admin/ranking-reports/:id
const deleteRankingReport = async (req, res) => {
  try {
    const deleted = await RankingReport.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Ranking report not found" });
    res.json({ message: "Ranking report deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  setUserStatus,
  deleteUser,
  createProject,
  updateProject,
  updateProjectAssignedUsers,
  getProjects,
  setProjectStatus,
  deleteProject,
  createWebsiteUrl,
  getWebsiteUrls,
  updateWebsiteUrl,
  setWebsiteUrlStatus,
  deleteWebsiteUrl,
  getReports,
  deleteReport,
  exportReports,
  getRankingReports,
  deleteRankingReport,
};