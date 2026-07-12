const { pool } = require("../config/db");

// ===============================
// Get All Employees
// ===============================

exports.getEmployees = async (req, res) => {

    try {

        const [employees] = await pool.query(`
            SELECT
                e.*,
                d.department_name
            FROM employees e
            LEFT JOIN departments d
            ON e.department_id = d.id
            ORDER BY e.id DESC
        `);

        res.json({
            success: true,
            count: employees.length,
            data: employees
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ===============================
// Get Employee By ID
// ===============================

exports.getEmployee = async (req, res) => {

    try {

        const [employee] = await pool.query(
            "SELECT * FROM employees WHERE id=?",
            [req.params.id]
        );

        if (employee.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Employee Not Found"
            });

        }

        res.json({
            success: true,
            data: employee[0]
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ===============================
// Add Employee
// ===============================

exports.addEmployee = async (req, res) => {

    try {

        const {
            employee_code,
            full_name,
            email,
            phone,
            designation,
            department_id,
            joining_date,
            status
        } = req.body;

        await pool.query(
            `INSERT INTO employees
            (
                employee_code,
                full_name,
                email,
                phone,
                designation,
                department_id,
                joining_date,
                status
            )
            VALUES (?,?,?,?,?,?,?,?)`,
            [
                employee_code,
                full_name,
                email,
                phone,
                designation,
                department_id,
                joining_date,
                status
            ]
        );

        res.status(201).json({
            success: true,
            message: "Employee Added Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ===============================
// Update Employee
// ===============================

exports.updateEmployee = async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            designation,
            department_id,
            joining_date,
            status
        } = req.body;

        await pool.query(
            `UPDATE employees
             SET
             full_name=?,
             email=?,
             phone=?,
             designation=?,
             department_id=?,
             joining_date=?,
             status=?
             WHERE id=?`,
            [
                full_name,
                email,
                phone,
                designation,
                department_id,
                joining_date,
                status,
                req.params.id
            ]
        );

        res.json({
            success: true,
            message: "Employee Updated Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// ===============================
// Delete Employee
// ===============================

exports.deleteEmployee = async (req, res) => {

    try {

        await pool.query(
            "DELETE FROM employees WHERE id=?",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Employee Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};