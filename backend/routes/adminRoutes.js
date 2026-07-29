const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createUser,
  getUsers,
  setUserStatus,
  createProject,
  updateProjectKeyword,
  getProjects,
  setProjectStatus,
  getReports,
  deleteReport,
} = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.post("/users", createUser);
router.get("/users", getUsers);
router.patch("/users/:id/status", setUserStatus);

router.post("/projects", createProject);
router.get("/projects", getProjects);
router.patch("/projects/:id/keyword", updateProjectKeyword);
router.patch("/projects/:id/status", setProjectStatus);

router.get("/reports", getReports);
router.delete("/reports/:id", deleteReport);
module.exports = router;
