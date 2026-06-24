const express = require("express");
const {
  getStoreOwnerDashboard,
  getStoreRatingsList,
} = require("./store-owner.controller");
const { protect, authorize } = require("../auth/auth.middleware");

const router = express.Router();

router.get("/dashboard", protect, authorize("STORE_OWNER"), getStoreOwnerDashboard);
router.get("/ratings/:storeId", protect, authorize("STORE_OWNER"), getStoreRatingsList);

module.exports = router;
