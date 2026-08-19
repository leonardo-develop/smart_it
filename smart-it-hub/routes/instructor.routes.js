
const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructor.controller");

router.get("/doctor/:id", instructorController.getDoctor);
router.get("/doctor-achievements/:id", instructorController.getDoctorAchievements);
router.get("/all-faculty", instructorController.getAllFaculty);
router.get("/instructors", instructorController.getAllInstructors);

module.exports = router;
