
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");
const upload = require("../middlewares/upload");
const { requireRole } = require("../middlewares/auth");

router.post(
    "/upload-course-files",
    requireRole("doctor"),
    upload.fields([
        { name: "syllabus_file", maxCount: 1 },
        { name: "slides_files", maxCount: 10 },
        { name: "books_files", maxCount: 10 }
    ]),
    courseController.uploadCourseFiles
);

router.get("/course-details/:code", courseController.getCourseDetails);
router.get("/course-students/:courseCode", requireRole("doctor"), courseController.getCourseStudents);
router.post("/save-course-data", requireRole("doctor"), courseController.saveCourseData);
router.post("/save-grades", requireRole("doctor"), courseController.saveGrades);
router.get("/doctor-courses", requireRole("doctor"), courseController.getDoctorCourses);
router.delete("/delete-course-file", requireRole("doctor"), courseController.deleteCourseFile);

module.exports = router;
