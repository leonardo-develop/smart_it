
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/course.controller");
const upload = require("../middlewares/upload");

router.post(
    "/upload-course-files",
    upload.fields([
        { name: "syllabus_file", maxCount: 1 },
        { name: "slides_files", maxCount: 10 },
        { name: "books_files", maxCount: 10 }
    ]),
    courseController.uploadCourseFiles
);

router.get("/course-details/:code", courseController.getCourseDetails);
router.get("/course-students/:courseCode", courseController.getCourseStudents);
router.post("/save-course-data", courseController.saveCourseData);
router.post("/save-grades", courseController.saveGrades);
router.get("/doctor-courses", courseController.getDoctorCourses);
router.delete("/delete-course-file", courseController.deleteCourseFile);

module.exports = router;
