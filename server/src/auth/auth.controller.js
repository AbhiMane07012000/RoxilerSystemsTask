const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/token");

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
 *                 example: Password@123
 *               role:
 *                 type: enum
 *                 enum: [SYSTEM_ADMIN, STORE_OWNER, NORMAL_USER]
 *                 example: NORMAL_USER
 *                 default: NORMAL_USER
 *               address:
 *                 type: string
 *                 example: 1 Main Street, Pune, Maharashtra, India
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
  const { name, email, password, address, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const allowedRoles = ["SYSTEM_ADMIN", "STORE_OWNER", "NORMAL_USER"];
  const assignedRole = allowedRoles.includes(role) ? role : "NORMAL_USER";

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { email: true },
  });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }
  try {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8-16 chars and contain uppercase & special character",
      });
    }

    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({
        message: "Name must be between 20 and 60 characters",
      });
    }

    if (address && address.length > 400) {
      return res.status(400).json({
        message: "Address cannot exceed 400 characters",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, address, role: assignedRole },
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
 *                 example: Password@123
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
        address: user.address,
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
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
  });

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
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

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or old password incorrect
 *       500:
 *         description: Internal server error
 */
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  const isValid = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!isValid) {
    return res.status(400).json({
      message: "Old password incorrect"
    });
  }

  const hashed = await bcrypt.hash(
    newPassword,
    10
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed }
  });

  res.json({
    message: "Password updated successfully"
  });
};

module.exports = { register, login, me, refresh, logout, changePassword };
