
const express = require("express");
const router = express.Router();
const labController = require("../controllers/lab.controller");
const { requireRole } = require("../middlewares/auth");

router.post("/book-lab", requireRole("student"), labController.bookLab);
router.get("/lab-occupancy", labController.getLabOccupancy);
router.get("/labs", labController.getLabs);

module.exports = router;
