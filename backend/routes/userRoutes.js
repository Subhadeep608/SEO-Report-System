const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { getActiveProjects, getActiveWebsiteUrls, submitReport, getMyReports } = require("../controllers/userController");

router.use(protect, authorize("user"));

router.get("/projects", getActiveProjects);
router.get("/website-urls", getActiveWebsiteUrls);
router.post("/reports", submitReport);
router.get("/reports", getMyReports);

module.exports = router;