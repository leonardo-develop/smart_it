
const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructor.controller");
const { requireRole, requireOwnership } = require("../middlewares/auth");

router.get("/doctor/:id", requireRole("doctor"), requireOwnership("id"), instructorController.getDoctor);
router.get("/doctor-achievements/:id", requireRole("doctor"), requireOwnership("id"), instructorController.getDoctorAchievements);
router.get("/all-faculty", instructorController.getAllFaculty);
router.get("/instructors", instructorController.getAllInstructors);

module.exports = router;
