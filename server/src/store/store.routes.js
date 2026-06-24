const express = require("express");
const {
  listStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
} = require("./store.controller");
const { protect, authorize } = require("../auth/auth.middleware");

const router = express.Router();

// Public routes (requires authentication but accessible to all roles)
router.get("/", protect, listStores);
router.get("/:id", protect, getStoreById);

// Admin only routes
router.post("/", protect, authorize("SYSTEM_ADMIN"), createStore);
router.put("/:id", protect, authorize("SYSTEM_ADMIN"), updateStore);
router.delete("/:id", protect, authorize("SYSTEM_ADMIN"), deleteStore);

module.exports = router;
