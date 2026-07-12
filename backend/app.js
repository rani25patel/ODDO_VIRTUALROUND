import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// =======================
// Middlewares
// =======================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

// =======================
// Home Route
// =======================

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Welcome to AssetFlow ERP Backend 🚀"
    });

});

// =======================
// Health Check
// =======================

app.get("/health", (req, res) => {

    res.status(200).json({
        status: "OK",
        server: "Running",
        uptime: process.uptime()
    });

});

// =======================
// 404 Route
// =======================

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API Route Not Found"
    });

});

export default app;