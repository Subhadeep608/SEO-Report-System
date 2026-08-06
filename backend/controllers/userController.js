const Project = require("../models/Project");
const WebsiteUrl = require("../models/WebsiteUrl");
const Report = require("../models/Report");
const RankingReport = require("../models/RankingReport");


// @route GET /api/user/projects
const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true }).select("name").sort({ name: 1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/user/website-urls?project=<id>
// @desc  Populates the Website URL dropdown once a project is chosen
const getActiveWebsiteUrls = async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ message: "project query param is required" });
    }
    const websiteUrls = await WebsiteUrl.find({ project, isActive: true })
      .select("url keywords")
      .sort({ url: 1 });
    res.json({ websiteUrls });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Escapes regex special characters so a keyword can be safely used in a $regex query
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @route POST /api/user/reports
const submitReport = async (req, res) => {
  try {
    const { project, websiteUrl, keyword, category, workingUrl } = req.body;
    if (!project || !websiteUrl || !keyword || !category || !workingUrl) {
      return res.status(400).json({ message: "project, websiteUrl, keyword, category, and workingUrl are required" });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc || !projectDoc.isActive) {
      return res.status(404).json({ message: "Project not found or inactive" });
    }

    const websiteUrlDoc = await WebsiteUrl.findOne({ _id: websiteUrl, project, isActive: true });
    if (!websiteUrlDoc) {
      return res.status(404).json({ message: "Website URL not found or inactive" });
    }

    // Never trust the keyword string from the client blindly — make sure it's
    // actually one of the keywords set up for this URL.
    const trimmedKeyword = keyword.trim();
    const validKeyword = websiteUrlDoc.keywords.some(
      (k) => k.toLowerCase() === trimmedKeyword.toLowerCase()
    );
    if (!validKeyword) {
      return res.status(400).json({ message: "That keyword is not valid for the selected website URL" });
    }

    // Prevent this exact website URL + keyword combo from being submitted
    // more than once for this project (by anyone, not just this user).
    // const duplicateCombo = await Report.findOne({
    //   project: projectDoc._id,
    //   websiteUrl: websiteUrlDoc._id,
    //   keyword: { $regex: `^${escapeRegex(trimmedKeyword)}$`, $options: "i" },
    // });
    // if (duplicateCombo) {
    //   return res.status(409).json({
    //     message: `This website URL has already been submitted with the project "${projectDoc.name}".`,
    //   });
    // }

    // Prevent the same working URL from being submitted more than once
    // within this project, regardless of who submits it.
    const trimmedWorkingUrl = workingUrl.trim();
    const duplicateWorkingUrl = await Report.findOne({
      project: projectDoc._id,
      workingUrl: { $regex: `^${escapeRegex(trimmedWorkingUrl)}$`, $options: "i" },
    });
    if (duplicateWorkingUrl) {
      return res.status(409).json({
        message: "This URL has already been submitted for this project.",
      });
    }

    const report = await Report.create({
      project: projectDoc._id,
      websiteUrl: websiteUrlDoc._id,
      workUrl: websiteUrlDoc.url,
      keyword: trimmedKeyword,
      workingUrl: trimmedWorkingUrl,
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

// @route GET /api/user/ranking-keywords?project=<id>
// @desc  Every distinct keyword across all active Website URLs of a project,
// used to build the rows of the ranking report table.
const getRankingKeywords = async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ message: "project query param is required" });
    }
    const websiteUrls = await WebsiteUrl.find({ project, isActive: true }).select("keywords");
    const keywordSet = new Set();
    websiteUrls.forEach((w) => w.keywords.forEach((k) => keywordSet.add(k)));
    const keywords = Array.from(keywordSet).sort((a, b) => a.localeCompare(b));
    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route POST /api/user/ranking-reports
const submitRankingReport = async (req, res) => {
  try {
    const { project, date, entries } = req.body;
    if (!project || !date || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "project, date, and at least one entry are required" });
    }

    const projectDoc = await Project.findById(project);
    if (!projectDoc || !projectDoc.isActive) {
      return res.status(404).json({ message: "Project not found or inactive" });
    }

    const cleanEntries = entries
      .map((e) => ({ keyword: (e.keyword || "").trim(), rank: (e.rank || "").trim() }))
      .filter((e) => e.keyword && e.rank);

    if (cleanEntries.length === 0) {
      return res.status(400).json({ message: "Enter at least one rank value" });
    }

    // Rank must be a 1 or 2 digit number (e.g. "4", "27") — no letters or other text.
    const invalidRank = cleanEntries.find((e) => !/^\d{1,2}$/.test(e.rank));
    if (invalidRank) {
      return res.status(400).json({
        message: `Current Ranking field "${invalidRank.keyword}" must be a number from 1 to 99.`,
      });
    }

    const rankingReport = await RankingReport.create({
      project: projectDoc._id,
      date: new Date(date),
      entries: cleanEntries,
      submittedBy: req.user._id,
      submittedByName: req.user.name,
    });

    res.status(201).json({ message: "Ranking report submitted successfully", rankingReport });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @route GET /api/user/ranking-reports
// @desc  This user's own submitted ranking reports
const getMyRankingReports = async (req, res) => {
  try {
    const { project, limit = 4 } = req.query;
    const filter = { submittedBy: req.user._id };
    if (project) filter.project = project;

    const rankingReports = await RankingReport.find(filter)
      .populate("project", "name")
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.max(1, parseInt(limit, 10) || 4));
    res.json({ rankingReports });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getActiveProjects,
  getActiveWebsiteUrls,
  submitReport,
  getMyReports,
  getRankingKeywords,
  submitRankingReport,
  getMyRankingReports,
};