const User = require("../models/User");
const Project = require("../models/Project");
const WebsiteUrl = require("../models/WebsiteUrl");
const Report = require("../models/Report");
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

// ---------- Projects (name + description only, no keyword) ----------

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user._id,
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ projects });
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

// ---------- Website URLs (belong to a project, carry a keyword list) ----------

// Splits a comma-separated keyword field into clean, deduped values
const parseKeywords = (raw) =>
  (raw || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

// @route POST /api/admin/website-urls
// @desc  Admin adds a Website URL under a project, with its keyword list
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

    const websiteUrl = await WebsiteUrl.create({
      project,
      url: url.trim(),
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

// @route PATCH /api/admin/website-urls/:id/keywords
const updateWebsiteUrlKeywords = async (req, res) => {
  try {
    const { keywords } = req.body;
    const websiteUrl = await WebsiteUrl.findByIdAndUpdate(
      req.params.id,
      { keywords: parseKeywords(keywords) },
      { new: true }
    );
    if (!websiteUrl) return res.status(404).json({ message: "Website URL not found" });
    res.json({ websiteUrl });
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
    const { project, user,category, from, to } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.submittedBy = user;
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

module.exports = {
  createUser,
  getUsers,
  setUserStatus,
  createProject,
  getProjects,
  setProjectStatus,
  createWebsiteUrl,
  getWebsiteUrls,
  updateWebsiteUrlKeywords,
  setWebsiteUrlStatus,
  getReports,
  deleteReport,
  exportReports,
};