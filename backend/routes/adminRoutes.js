const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
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
  getAllListEntries,
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.post("/users", createUser);
router.get("/users", getUsers);
router.patch("/users/:id/status", setUserStatus);
router.delete("/users/:id", deleteUser);

router.post("/projects", createProject);
router.get("/projects", getProjects);
router.patch("/projects/:id", updateProject);
router.patch("/projects/:id/assigned-users", updateProjectAssignedUsers);
router.patch("/projects/:id/status", setProjectStatus);
router.delete("/projects/:id", deleteProject);

router.post("/website-urls", createWebsiteUrl);
router.get("/website-urls", getWebsiteUrls);
router.patch("/website-urls/:id", updateWebsiteUrl);
router.patch("/website-urls/:id/status", setWebsiteUrlStatus);
router.delete("/website-urls/:id", deleteWebsiteUrl);

router.get("/reports/export", exportReports);
router.get("/reports", getReports);
router.delete("/reports/:id", deleteReport);

router.get("/ranking-reports", getRankingReports);
router.delete("/ranking-reports/:id", deleteRankingReport);

router.get("/list-entries", getAllListEntries);


module.exports = router;