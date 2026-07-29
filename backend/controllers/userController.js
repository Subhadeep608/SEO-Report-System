const Project = require("../models/Project");
const Report = require("../models/Report");

// @route GET /api/user/projects
// @desc  Populates the project dropdown on the report form (active projects only)
const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .select("name keyword")
      .sort({ name: 1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Splits a comma-separated Work URL field into clean, deduped URLs
const parseUrls = (raw) =>
  raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

// @route POST /api/user/reports
// @desc  User submits a report tied to a project. Keyword is taken from the
// project server-side (never trusted from the client) so it can't be tampered with.
const submitReport = async (req, res) => {
  try {
    const { project, workUrl, category } = req.body;
    if (!project || !workUrl || !category) {
      return res.status(400).json({ message: "project, workUrl, and category are required" });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc || !projectDoc.isActive) {
      return res.status(404).json({ message: "Project not found or inactive" });
    }

    const incomingUrls = parseUrls(workUrl);
    if (incomingUrls.length === 0) {
      return res.status(400).json({ message: "At least one valid work URL is required" });
    }

    // Check every individual URL against every URL already used in this
    // project (existing reports may themselves contain multiple URLs).
    const existingReports = await Report.find({ project: projectDoc._id }).select("workUrl");
    const usedUrls = new Set();
    existingReports.forEach((r) => parseUrls(r.workUrl).forEach((u) => usedUrls.add(u)));

    const duplicates = incomingUrls.filter((u) => usedUrls.has(u));
    if (duplicates.length > 0) {
      return res.status(409).json({
        message: `This URL has already been submitted for this project: ${duplicates[0]}`,
      });
    }

    const report = await Report.create({
      project: projectDoc._id,
      keyword: projectDoc.keyword,
      workUrl: incomingUrls.join(", "),
      category: category.trim(),
      submittedBy: req.user._id,
      submittedByName: req.user.name,
    });

    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/user/reports
// @desc  User views their own submitted reports. Read-only by design —
// there are intentionally no update/delete endpoints for reports.
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ submittedBy: req.user._id })
      .populate("project", "name")
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getActiveProjects, submitReport, getMyReports };