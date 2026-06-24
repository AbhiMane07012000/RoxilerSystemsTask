const prisma = require("../../config/db");

/**
 * @swagger
 * tags:
 *   name: StoreOwner
 *   description: Store Owner operations and dashboard
 */

/**
 * @swagger
 * /api/store-owner/dashboard:
 *   get:
 *     summary: Get store owner dashboard with statistics
 *     tags: [StoreOwner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *       500:
 *         description: Internal server error
 */
const getStoreOwnerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all stores owned by this user
    const stores = await prisma.store.findMany({
      where: { ownerId: userId },
      include: {
        ratings: true,
      },
    });

    // Calculate statistics
    const storesData = stores.map((store) => {
      const averageRating =
        store.ratings.length > 0
          ? Number(
              (
                store.ratings.reduce((sum, r) => sum + r.rating, 0) /
                store.ratings.length
              ).toFixed(1)
            )
          : 0;

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        totalRatings: store.ratings.length,
        averageRating,
      };
    });

    const totalRatingsCount = stores.reduce((sum, store) => sum + store.ratings.length, 0);
    const overallAverageRating =
      totalRatingsCount > 0
        ? Number(
            (
              stores.reduce(
                (sum, store) =>
                  sum + store.ratings.reduce((rSum, r) => rSum + r.rating, 0),
                0
              ) / totalRatingsCount
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      userId,
      totalStores: stores.length,
      totalRatings: totalRatingsCount,
      overallAverageRating,
      stores: storesData,
    });
  } catch (error) {
    console.error("Store Owner Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * @swagger
 * /api/store-owner/ratings/{storeId}:
 *   get:
 *     summary: Get list of users who rated a store (Store owner only)
 *     tags: [StoreOwner]
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
 *         description: Ratings fetched successfully
 *       403:
 *         description: Forbidden - you don't own this store
 *       404:
 *         description: Store not found
 *       500:
 *         description: Internal server error
 */
const getStoreRatingsList = async (req, res) => {
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
      include: {
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        message: "Store not found",
      });
    }

    if (store.ownerId !== userId) {
      return res.status(403).json({
        message: "Unauthorized - you do not own this store",
      });
    }

    const averageRating =
      store.ratings.length > 0
        ? Number(
            (
              store.ratings.reduce((sum, r) => sum + r.rating, 0) /
              store.ratings.length
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      storeId: store.id,
      storeName: store.name,
      storeEmail: store.email,
      storeAddress: store.address,
      averageRating,
      totalRatings: store.ratings.length,
      ratings: store.ratings,
    });
  } catch (error) {
    console.error("Get Store Ratings List Error:", error);
    res.status(500).json({
      message: "Failed to fetch store ratings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getStoreOwnerDashboard,
  getStoreRatingsList,
};
