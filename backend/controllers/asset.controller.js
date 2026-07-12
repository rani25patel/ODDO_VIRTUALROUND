const { pool } = require("../config/db");

// ==========================================
// Get All Assets
// ==========================================
exports.getAllAssets = async (req, res) => {

    try {

        const [assets] = await pool.query(`
            SELECT
                a.*,
                d.department_name
            FROM assets a
            LEFT JOIN departments d
            ON a.department_id = d.id
            ORDER BY a.id DESC
        `);

        res.status(200).json({
            success: true,
            count: assets.length,
            data: assets
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ==========================================
// Get Asset By ID
// ==========================================
exports.getAssetById = async (req, res) => {

    try {

        const { id } = req.params;

        const [asset] = await pool.query(
            `SELECT * FROM assets WHERE id=?`,
            [id]
        );

        if (asset.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Asset Not Found"
            });

        }

        res.status(200).json({
            success: true,
            data: asset[0]
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ==========================================
// Add New Asset
// ==========================================
exports.addAsset = async (req, res) => {

    try {

        const {
            asset_code,
            asset_name,
            category,
            department_id,
            purchase_date,
            purchase_cost,
            status
        } = req.body;

        await pool.query(
            `INSERT INTO assets
            (
                asset_code,
                asset_name,
                category,
                department_id,
                purchase_date,
                purchase_cost,
                status
            )
            VALUES(?,?,?,?,?,?,?)`,
            [
                asset_code,
                asset_name,
                category,
                department_id,
                purchase_date,
                purchase_cost,
                status
            ]
        );

        res.status(201).json({
            success: true,
            message: "Asset Added Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ==========================================
// Update Asset
// ==========================================
exports.updateAsset = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            asset_name,
            category,
            department_id,
            purchase_date,
            purchase_cost,
            status
        } = req.body;

        await pool.query(
            `UPDATE assets
            SET
                asset_name=?,
                category=?,
                department_id=?,
                purchase_date=?,
                purchase_cost=?,
                status=?
            WHERE id=?`,
            [
                asset_name,
                category,
                department_id,
                purchase_date,
                purchase_cost,
                status,
                id
            ]
        );

        res.json({
            success: true,
            message: "Asset Updated Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ==========================================
// Delete Asset
// ==========================================
exports.deleteAsset = async (req, res) => {

    try {

        const { id } = req.params;

        await pool.query(
            "DELETE FROM assets WHERE id=?",
            [id]
        );

        res.json({
            success: true,
            message: "Asset Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};