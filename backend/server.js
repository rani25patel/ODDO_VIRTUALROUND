require("dotenv").config();

const app = require("./app");

const { connectDB } = require("./config/db");

// Connect Database
connectDB();

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("======================================");
    console.log("🚀 AssetFlow ERP Backend Started");
    console.log(`🌐 Server Running : http://localhost:${PORT}`);
    console.log("======================================");

});