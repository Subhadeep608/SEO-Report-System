const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
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
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.post("/users", createUser);
router.get("/users", getUsers);
router.patch("/users/:id/status", setUserStatus);

router.post("/projects", createProject);
router.get("/projects", getProjects);
router.patch("/projects/:id/status", setProjectStatus);

router.post("/website-urls", createWebsiteUrl);
router.get("/website-urls", getWebsiteUrls);
router.patch("/website-urls/:id/keywords", updateWebsiteUrlKeywords);
router.patch("/website-urls/:id/status", setWebsiteUrlStatus);

router.get("/reports/export", exportReports);
router.get("/reports", getReports);
router.delete("/reports/:id", deleteReport);

module.exports = router;