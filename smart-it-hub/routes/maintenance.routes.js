const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenance.controller");
const { requireRole } = require("../middlewares/auth");

router.use(requireRole("doctor"));
router.post("/maintenancerequest", maintenanceController.createMaintenanceRequest);
router.get("/mymaintenance/:id", maintenanceController.getMyMaintenance);

module.exports = router;
