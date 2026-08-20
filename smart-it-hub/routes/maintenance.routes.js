const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenance.controller");
const { requireRole } = require("../middlewares/auth");

router.post("/maintenancerequest", requireRole("doctor"), maintenanceController.createMaintenanceRequest);
router.get("/mymaintenance/:id", requireRole("doctor"), maintenanceController.getMyMaintenance);

module.exports = router;
