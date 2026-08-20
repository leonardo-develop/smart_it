
const express = require("express");
const router = express.Router();
const officeHoursController = require("../controllers/officeHours.controller");
const { requireRole } = require("../middlewares/auth");

router.get("/get-office-hours", requireRole("doctor"), officeHoursController.getOfficeHours);
router.get("/suggest-office-hours", requireRole("doctor"), officeHoursController.suggestOfficeHours);
router.post("/add-office-hour", requireRole("doctor"), officeHoursController.addOfficeHour);
router.post("/save-office-hour", requireRole("doctor"), officeHoursController.saveOfficeHour);
router.delete("/delete-office-hour/:id", requireRole("doctor"), officeHoursController.deleteOfficeHour);

module.exports = router;
