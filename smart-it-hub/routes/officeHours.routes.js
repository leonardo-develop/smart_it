
const express = require("express");
const router = express.Router();
const officeHoursController = require("../controllers/officeHours.controller");

router.get("/get-office-hours", officeHoursController.getOfficeHours);
router.get("/suggest-office-hours", officeHoursController.suggestOfficeHours);
router.post("/add-office-hour", officeHoursController.addOfficeHour);
router.post("/save-office-hour", officeHoursController.saveOfficeHour);
router.delete("/delete-office-hour/:id", officeHoursController.deleteOfficeHour);

module.exports = router;
