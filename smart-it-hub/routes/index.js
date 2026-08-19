const express = require("express");
const router = express.Router();
router.use(require("./auth.routes"));
router.use(require("./course.routes"));
router.use(require("./student.routes"));
router.use(require("./instructor.routes"));
router.use(require("./officeHours.routes"));
router.use(require("./maintenance.routes"));
router.use(require("./lab.routes"));

module.exports = router;
