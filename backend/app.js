const express = require("express");
const cors = require("cors");
const morgan = require("morgan");


const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const assetRoutes = require("./routes/asset.routes");


const app = express();

// =============================
// Middlewares
// =============================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));


app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);


// =============================
// Test Route
// =============================

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Welcome to AssetFlow ERP Backend 🚀"
    });

});

// =============================
// Health Check
// =============================

app.get("/health", (req, res) => {

    res.status(200).json({
        success: true,
        server: "Running",
        uptime: process.uptime()
    });

});

// =============================
// API Routes
// (We will add routes here later)
// =============================

// app.use("/api/auth", authRoutes);
// app.use("/api/assets", assetRoutes);
// app.use("/api/employees", employeeRoutes);

// =============================
// 404 Route
// =============================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route Not Found"

    });

});

module.exports = app;