const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getAllAssets,
    getAssetById,
    addAsset,
    updateAsset,
    deleteAsset,
    searchAssests,
    filterByStatus,
    filterByDepartment
} = require("../controllers/assetController");

// ==============================
// GET ALL ASSETS
// ==============================

router.get(
    "/",
    auth,
    getAllAssets
);

// ==============================
// GET ASSET BY ID
// ==============================

router.get(
    "/:id",
    auth,
    getAssetById
);

// ==============================
// ADD ASSET
// ==============================

router.post(
    "/",
    auth,
    roleMiddleware("Admin", "Asset Manager"),
    addAsset
);

// ==============================
// UPDATE ASSET
// ==============================

router.put(
    "/:id",
    auth,
    roleMiddleware("Admin", "Asset Manager"),
    updateAsset
);

// ==============================
// DELETE ASSET
// ==============================

router.delete(
    "/:id",
    auth,
    roleMiddleware("Admin"),
    deleteAsset
);

module.exports = router;