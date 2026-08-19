const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenance.controller");

router.post("/maintenancerequest", maintenanceController.createMaintenanceRequest);
router.get("/mymaintenance/:id", maintenanceController.getMyMaintenance);

module.exports = router;
