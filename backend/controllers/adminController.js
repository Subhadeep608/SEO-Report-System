const User = require("../models/User");
const Project = require("../models/Project");
const Report = require("../models/Report");

// @route POST /api/admin/users
// @desc  Admin creates a User account (credentials handed to user manually)
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

// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/users/:id/status
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

// @route POST /api/admin/projects
// @desc  Admin creates a Project with its fixed keyword.
const createProject = async (req, res) => {
  try {
    const { name, description, keyword } = req.body;
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }
    const project = await Project.create({
      name,
      description: description || "",
      keyword: keyword || "",
      createdBy: req.user._id,
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/projects/:id/keyword
// @desc  Admin updates a Project's fixed keyword.
const updateProjectKeyword = async (req, res) => {
  try {
    const { keyword } = req.body;
    if (keyword === undefined) {
      return res.status(400).json({ message: "keyword is required" });
    }
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { keyword: keyword.trim() },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/admin/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route PATCH /api/admin/projects/:id/status
const setProjectStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/admin/reports
// @desc  Admin views submitted reports with submitter name + submission time.
// Supports optional filters: ?project=<id>&user=<id>&from=<date>&to=<date>
const getReports = async (req, res) => {
  try {
    const { project, user, from, to } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (user) filter.submittedBy = user;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const reports = await Report.find(filter)
      .populate("project", "name keyword")
      .populate("submittedBy", "name loginId")
      .sort({ createdAt: -1 });

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// @route DELETE /api/admin/reports/:id
// @desc  Admin permanently deletes a submitted report
const deleteReport = async (req, res) => {
  try {
    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};




module.exports = {
  createUser,
  getUsers,
  setUserStatus,
  createProject,
  updateProjectKeyword,
  getProjects,
  setProjectStatus,
  getReports,
  deleteReport,
};
