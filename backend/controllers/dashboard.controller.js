const { pool } = require("../config/db");

exports.getDashboard = async (req, res) => {

    try {

        const [[assets]] = await pool.query(
            "SELECT COUNT(*) AS totalAssets FROM assets"
        );

        const [[available]] = await pool.query(
            "SELECT COUNT(*) AS availableAssets FROM assets WHERE status='Available'"
        );

        const [[allocated]] = await pool.query(
            "SELECT COUNT(*) AS allocatedAssets FROM assets WHERE status='Allocated'"
        );

        const [[maintenance]] = await pool.query(
            "SELECT COUNT(*) AS maintenanceAssets FROM assets WHERE status='Maintenance'"
        );

        const [[employees]] = await pool.query(
            "SELECT COUNT(*) AS totalEmployees FROM users"
        );

        const [[departments]] = await pool.query(
            "SELECT COUNT(*) AS totalDepartments FROM departments"
        );

        res.status(200).json({
            success: true,
            data: {
                totalAssets: assets.totalAssets,
                availableAssets: available.availableAssets,
                allocatedAssets: allocated.allocatedAssets,
                maintenanceAssets: maintenance.maintenanceAssets,
                totalEmployees: employees.totalEmployees,
                totalDepartments: departments.totalDepartments
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};