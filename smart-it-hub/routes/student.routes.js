const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");

router.get("/student/:studentId", studentController.getStudent);
router.get("/student-courses/:studentId", studentController.getStudentCourses);
router.get("/leaderboard", studentController.getLeaderboard);
router.get("/course-dashboard/:courseCode/:studentId", studentController.getCourseDashboard);

module.exports = router;
