const express = require("express");

const {
  createUser,
  getUsers,
  getDashboard,
  getUserById,
} = require("./admin.controller");
const { protect, authorize } = require("../auth/auth.middleware");

const router = express.Router();

router.get("/dashboard", protect, authorize("SYSTEM_ADMIN"), getDashboard);

router.post("/users", protect, authorize("SYSTEM_ADMIN"), createUser);

router.get("/users", protect, authorize("SYSTEM_ADMIN"), getUsers);

router.get("/users/:id", protect, authorize("SYSTEM_ADMIN"), getUserById);

module.exports = router;
