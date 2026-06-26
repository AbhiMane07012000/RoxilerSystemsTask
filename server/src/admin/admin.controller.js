const bcrypt = require("bcryptjs");
const prisma = require("../../config/db");


/** 
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin operations
 */

/**
 * @swagger
 * /api/admin/create-user:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - address
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe 
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               address:
 *                 type: string
 *                 example: Pune, Maharashtra, India
 *               role:
 *                 type: string
 *                 enum:
 *                   - SYSTEM_ADMIN
 *                   - STORE_OWNER
 *                   - NORMAL_USER
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      role
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !address ||
      !role
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const allowedRoles = [
      "SYSTEM_ADMIN",
      "STORE_OWNER",
      "NORMAL_USER"
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const existingUser =
      await prisma.user.findUnique({
        where: { email }
      });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

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

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address,
        role
      }
    });

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user"
    });
  }
};

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum:
 *             - SYSTEM_ADMIN
 *             - STORE_OWNER
 *             - NORMAL_USER
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       500:
 *         description: Internal server error
 */
const getUsers = async (req, res) => {
  try {
    const {
      name,
      email,
      address,
      role,
      sortBy = "name",
      order = "asc",
    } = req.query;

    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
        email: {
          contains: email,
          mode: "insensitive",
        },
        address: {
          contains: address,
          mode: "insensitive",
        },
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
      },
      orderBy: {
        [sortBy]: order,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Get Users Error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const getUserById = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        ownedStores: {
          include: {
            ratings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let averageRating = null;

    if (
      user.role === "STORE_OWNER" &&
      user.ownedStores?.length
    ) {
      const ratings = user.ownedStores.flatMap(
        (store) => store.ratings
      );

      averageRating =
        ratings.length > 0
          ? ratings.reduce(
              (sum, rating) => sum + rating.rating,
              0
            ) / ratings.length
          : 0;
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      rating: averageRating,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    res.status(500).json({
      message: "Failed to fetch user details",
    });
  }
};

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 *       500:
 *         description: Internal server error
 */
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] =
      await Promise.all([
        prisma.user.count(),
        prisma.store.count(),
        prisma.rating.count(),
      ]);

    res.status(200).json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    res.status(500).json({
      message: "Failed to fetch dashboard data",
    });
  }
};

module.exports = { createUser, getUsers, getUserById, getDashboard};