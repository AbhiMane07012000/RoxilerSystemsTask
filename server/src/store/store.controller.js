const prisma = require("../../config/db");

/**
 * @swagger
 * tags:
 *   name: Store
 *   description: Store operations
 */

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores (Normal users can view all stores with ratings)
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Search stores by name
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *         description: Search stores by address
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, address, createdAt]
 *           default: name
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Stores fetched successfully
 *       500:
 *         description: Internal server error
 */
const listStores = async (req, res) => {
  try {
    const {
      name,
      address,
      sortBy = "name",
      order = "asc",
    } = req.query;

    const userId = req.user.id;

    const stores = await prisma.store.findMany({
      where: {
        name: name ? { contains: name, mode: "insensitive" } : undefined,
        address: address ? { contains: address, mode: "insensitive" } : undefined,
      },
      include: {
        ratings: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
    });

    const result = stores.map((store) => {
      const overallRating =
        store.ratings.length > 0
          ? Number(
              (
                store.ratings.reduce((sum, r) => sum + r.rating, 0) /
                store.ratings.length
              ).toFixed(1)
            )
          : 0;

      const userRating = store.ratings.find((r) => r.userId === userId);

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        overallRating,
        userRating: userRating ? userRating.rating : null,
        totalRatings: store.ratings.length,
      };
    });

    res.status(200).json({
      count: result.length,
      stores: result,
    });
  } catch (error) {
    console.error("List Stores Error:", error);
    res.status(500).json({
      message: "Failed to fetch stores",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get store details by ID
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store details fetched successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const getStoreById = async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const userId = req.user.id;

    if (Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid store ID",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        ratings: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const overallRating =
      store.ratings.length > 0
        ? Number(
            (
              store.ratings.reduce((sum, r) => sum + r.rating, 0) /
              store.ratings.length
            ).toFixed(1)
          )
        : 0;

    const userRating = store.ratings.find((r) => r.userId === userId);

    res.status(200).json({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      overallRating,
      userRating: userRating ? userRating.rating : null,
      totalRatings: store.ratings.length,
      owner: store.owner,
    });
  } catch (error) {
    console.error("Get Store Error:", error);
    res.status(500).json({
      message: "Failed to fetch store details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/admin/stores:
 *   post:
 *     summary: Create a new store (Admin only)
 *     tags: [Store]
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
 *               - address
 *               - ownerId
 *             properties:
 *               name:
 *                 type: string
 *                 example: The Pizza Place
 *               email:
 *                 type: string
 *                 example: pizza@store.com
 *               address:
 *                 type: string
 *                 example: 123 Main St, Pune, Maharashtra
 *               ownerId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Store created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
const createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    // Validation
    if (!name || !email || !address || !ownerId) {
      return res.status(400).json({
        message: "All fields (name, email, address, ownerId) are required",
      });
    }

    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        message: "Store name must be between 3 and 100 characters",
      });
    }

    if (address.length < 10 || address.length > 400) {
      return res.status(400).json({
        message: "Address must be between 10 and 400 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Check if store email already exists
    const existingStore = await prisma.store.findUnique({
      where: { email },
    });

    if (existingStore) {
      return res.status(409).json({
        message: "Store email already exists",
      });
    }

    // Check if owner exists and is a STORE_OWNER
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return res.status(404).json({
        message: "Owner user not found",
      });
    }

    if (owner.role !== "STORE_OWNER") {
      return res.status(400).json({
        message: "User must have STORE_OWNER role to own a store",
      });
    }

    const store = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (error) {
    console.error("Create Store Error:", error);
    res.status(500).json({
      message: "Failed to create store",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update store details (Admin only)
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store updated successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const updateStore = async (req, res) => {
  try {
    const storeId = Number(req.params.id);
    const { name, email, address } = req.body;

    if (Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid store ID",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: name || store.name,
        email: email || store.email,
        address: address || store.address,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Store updated successfully",
      store: updatedStore,
    });
  } catch (error) {
    console.error("Update Store Error:", error);
    res.status(500).json({
      message: "Failed to update store",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete a store (Admin only)
 *     tags: [Store]
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
 *         description: Store deleted successfully
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const deleteStore = async (req, res) => {
  try {
    const storeId = Number(req.params.id);

    if (Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid store ID",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    await prisma.store.delete({
      where: { id: storeId },
    });

    res.status(200).json({
      message: "Store deleted successfully",
      deletedStoreId: storeId,
    });
  } catch (error) {
    console.error("Delete Store Error:", error);
    res.status(500).json({
      message: "Failed to delete store",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  listStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
};
