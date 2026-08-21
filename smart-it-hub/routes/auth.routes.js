
const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", authController.logout);

module.exports = router;
