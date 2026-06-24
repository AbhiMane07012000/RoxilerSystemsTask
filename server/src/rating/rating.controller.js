const prisma = require("../../config/db");

/**
 * @swagger
 * tags:
 *   name: Rating
 *   description: Rating operations for stores
 */

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Submit a rating for a store (Normal users only)
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - rating
 *             properties:
 *               storeId:
 *                 type: integer
 *                 example: 1
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *     responses:
 *       201:
 *         description: Rating submitted successfully
 *       400:
 *         description: Bad request or invalid rating
 *       404:
 *         description: Store not found
 *       409:
 *         description: Rating already exists
 *       500:
 *         description: Internal server error
 */
const submitRating = async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user.id;

    // Validation
    if (!storeId || rating === undefined || rating === null) {
      return res.status(400).json({
        message: "storeId and rating are required",
      });
    }

    if (!Number.isInteger(storeId)) {
      return res.status(400).json({
        message: "Invalid storeId",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    // Check if user already has a rating for this store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (existingRating) {
      return res.status(409).json({
        message: "You have already submitted a rating for this store. Use the update endpoint to modify it.",
      });
    }

    const newRating = await prisma.rating.create({
      data: {
        userId,
        storeId,
        rating,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error("Submit Rating Error:", error);
    res.status(500).json({
      message: "Failed to submit rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/ratings/{storeId}:
 *   put:
 *     summary: Update your rating for a store (Normal users only)
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Bad request or invalid rating
 *       404:
 *         description: Store or rating not found
 *       500:
 *         description: Internal server error
 */
const updateRating = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const { rating } = req.body;
    const userId = req.user.id;

    // Validation
    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid storeId",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5",
      });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    // Check if user has a rating for this store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!existingRating) {
      return res.status(404).json({
        message: "You have not submitted a rating for this store yet",
      });
    }

    const updatedRating = await prisma.rating.update({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      data: { rating },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Rating updated successfully",
      rating: updatedRating,
    });
  } catch (error) {
    console.error("Update Rating Error:", error);
    res.status(500).json({
      message: "Failed to update rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/ratings/{storeId}:
 *   delete:
 *     summary: Delete your rating for a store (Normal users only)
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       404:
 *         description: Store or rating not found
 *       500:
 *         description: Internal server error
 */
const deleteRating = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const userId = req.user.id;

    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid storeId",
      });
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!existingRating) {
      return res.status(404).json({
        message: "Rating not found",
      });
    }

    await prisma.rating.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    res.status(200).json({
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("Delete Rating Error:", error);
    res.status(500).json({
      message: "Failed to delete rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/ratings/store/{storeId}:
 *   get:
 *     summary: Get all ratings for a store (Store owner can view)
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Store ratings fetched successfully
 *       404:
 *         description: Store not found or unauthorized
 *       500:
 *         description: Internal server error
 */
const getStoreRatings = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const userId = req.user.id;

    if (isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid storeId",
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

    // Only store owner can view all ratings for their store
    if (store.ownerId !== userId) {
      return res.status(403).json({
        message: "Unauthorized. Only store owner can view ratings.",
      });
    }

    const ratings = await prisma.rating.findMany({
      where: { storeId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const averageRating =
      ratings.length > 0
        ? Number(
            (
              ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      storeId,
      storeName: store.name,
      totalRatings: ratings.length,
      averageRating,
      ratings,
    });
  } catch (error) {
    console.error("Get Store Ratings Error:", error);
    res.status(500).json({
      message: "Failed to fetch store ratings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/ratings/my-rating/{storeId}:
 *   get:
 *     summary: Get your rating for a store
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Your rating fetched successfully
 *       404:
 *         description: Store not found or rating does not exist
 *       500:
 *         description: Internal server error
 */
const getMyRating = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const userId = req.user.id;

    if (Number.isNaN(storeId)) {
      return res.status(400).json({
        message: "Invalid storeId",
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

    const myRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!myRating) {
      return res.status(200).json({
        storeId,
        storeName: store.name,
        userRating: null,
        message: "You have not rated this store yet",
      });
    }

    res.status(200).json({
      storeId,
      storeName: store.name,
      userRating: myRating.rating,
      submittedAt: myRating.createdAt,
      lastUpdated: myRating.updatedAt,
    });
  } catch (error) {
    console.error("Get My Rating Error:", error);
    res.status(500).json({
      message: "Failed to fetch your rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  submitRating,
  updateRating,
  deleteRating,
  getStoreRatings,
  getMyRating,
};
