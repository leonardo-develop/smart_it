const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { requireRole, requireOwnership } = require("../middlewares/auth");

router.get("/student/:studentId", requireRole("student"), requireOwnership("studentId"), studentController.getStudent);
router.get("/student-courses/:studentId", requireRole("student"), requireOwnership("studentId"), studentController.getStudentCourses);
router.get("/leaderboard", studentController.getLeaderboard);
router.get("/course-dashboard/:courseCode/:studentId", requireRole("student"), requireOwnership("studentId"), studentController.getCourseDashboard);

module.exports = router;
