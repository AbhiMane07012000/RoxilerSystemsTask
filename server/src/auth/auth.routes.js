const express = require("express");
const { register, login, me, refresh, logout } = require("./auth.controller");
const protect = require("./auth.middleware");

const router = express.Router();

router.post("/register", register);


router.post("/login", login);


router.post("/refresh", refresh);


router.post("/logout", protect, logout);


router.get("/me", protect, me);

module.exports = router;