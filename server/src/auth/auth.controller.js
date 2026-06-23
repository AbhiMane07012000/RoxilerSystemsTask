const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");
const { generateAccessToken, generateRefreshToken } = require("../../utils/token");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               role:
 *                 type: enum
 *                 enum: [SUPERADMIN, STOREUSER, NORMALUSER]
 *                 example: NORMALUSER
 *                 default: NORMALUSER
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Email and password are required
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Registration failed
 */
const register = async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const allowedRoles = ["SUPERADMIN", "STOREUSER", "NORMALUSER"];
  const assignedRole = allowedRoles.includes(role) ? role : "NORMALUSER";

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: assignedRole },
    });
    res.status(201).json({ message: "User created", userId: user.id });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and get tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Returns accessToken and refreshToken
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Login failed
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🍪 store refresh token in cookie
    res.cookie("jid", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/auth/refresh",
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user info
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        name: user.name,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Get a new access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns new accessToken and refreshToken
 *       401:
 *         description: No refresh token provided
 *       403:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Failed to refresh token
 */
const refresh = async (req, res) => {
  const token = req.cookies.jid;

  if (!token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tokenVersion: { increment: 1 },
    },
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const newRefreshToken = generateRefreshToken(updatedUser);

  res.cookie("jid", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/refresh",
  });

  const accessToken = generateAccessToken(updatedUser);

  return res.json({ accessToken });
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: No refresh token provided
 *       500:
 *         description: Logout failed
 */
const logout = async (req, res) => {
  const userId = req.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      tokenVersion: { increment: 1 }, // 🔥 invalidate ALL refresh tokens
    },
  });

  res.clearCookie("jid", { path: "/api/auth/refresh" });

  res.json({ message: "Logged out" });
};

module.exports = { register, login, me, refresh, logout };
