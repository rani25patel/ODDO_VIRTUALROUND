const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {

    try {

        const token = req.header("Authorization");

        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Access Denied"
            });

        }

        const decoded = jwt.verify(
            token.replace("Bearer ", ""),
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }

};

module.exports = auth;