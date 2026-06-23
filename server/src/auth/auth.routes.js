const express = require("express");
const { register, login, me, refresh, logout, changePassword } = require("./auth.controller");
const {protect, authorize} = require("./auth.middleware");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh", refresh);

router.post("/logout", protect, logout);

router.get("/me", protect, me);

router.put("/change-password", protect, changePassword);


module.exports = router;
