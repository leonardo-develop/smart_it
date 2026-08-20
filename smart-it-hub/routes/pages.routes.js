const express = require("express");
const path = require("path");
const router = express.Router();
const { requireAuth, requireRole } = require("../middlewares/auth");

const ROOT_DIR = path.join(__dirname, "..", "..");

router.get("/", (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "landpage", "home.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "loginform", "login2.html"));
});

router.get("/displayp", requireAuth, requireRole("student"), (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "studentinfo", "studentprof.html"));
});

router.get("/doctorp", requireAuth, requireRole("doctor"), (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "docprofile", "doctor.html"));
});

router.get("/managecourses", requireAuth, requireRole("doctor"), (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "managecourse", "manage.html"));
});
// احتياط خليه
// ahmad jamal "if error in url happend iam gonna use it"; 
router.get("/syll.html", requireAuth, (req, res) => {
    res.sendFile(path.join(ROOT_DIR, "syllabus", "syll.html"));
});

module.exports = router;
