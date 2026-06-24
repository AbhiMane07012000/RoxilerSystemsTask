const express = require("express");
const {
  submitRating,
  updateRating,
  deleteRating,
  getStoreRatings,
  getMyRating,
} = require("./rating.controller");
const { protect, authorize } = require("../auth/auth.middleware");

const router = express.Router();

router.post("/", protect, authorize("NORMAL_USER"), submitRating);
router.put("/:storeId", protect, authorize("NORMAL_USER"), updateRating);
router.delete("/:storeId", protect, authorize("NORMAL_USER"), deleteRating);

router.get("/my-rating/:storeId", protect, authorize("NORMAL_USER"), getMyRating);

router.get("/store/:storeId", protect, authorize("STORE_OWNER"), getStoreRatings);

module.exports = router;
