const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const generateToken = require("../utils/jwt");

// ===============================
// Register User
// ===============================

exports.register = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;

        const [userExists] = await pool.query(

            "SELECT * FROM users WHERE email = ?",

            [email]

        );

        if (userExists.length > 0) {

            return res.status(400).json({

                success: false,

                message: "Email already exists"

            });

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(

            `INSERT INTO users(name,email,password,role)
             VALUES(?,?,?,?)`,

            [
                name,
                email,
                hashedPassword,
                role || "Employee"
            ]

        );

        res.status(201).json({

            success: true,

            message: "User Registered Successfully"

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// ===============================
// Login User
// ===============================

exports.login = async (req, res) => {

    try {

        const {

            email,

            password

        } = req.body;

        const [rows] = await pool.query(

            "SELECT * FROM users WHERE email=?",

            [email]

        );

        if (rows.length === 0) {

            return res.status(401).json({

                success: false,

                message: "Invalid Email"

            });

        }

        const user = rows[0];

        const match = await bcrypt.compare(

            password,

            user.password

        );

        if (!match) {

            return res.status(401).json({

                success: false,

                message: "Invalid Password"

            });

        }

        const token = generateToken(user);

        res.json({

            success: true,

            message: "Login Successful",

            token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                role: user.role

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};