const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

dotenv.config();

// =====================================================
// CREATE EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// IMPORT ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");

const vendorRoutes =
  require("./routes/vendorRoutes");

const purchaseOrderRoutes =
  require("./routes/purchaseOrderRoutes");

const vendorPerformanceRoutes =
  require("./routes/vendorPerformanceRoutes");

const dashboardRoutes =
  require("./routes/dashboardRoutes");

// =====================================================
// API ROUTES
// =====================================================

// AUTH
app.use(
  "/api/auth",
  authRoutes
);

// VENDORS
app.use(
  "/api/vendors",
  vendorRoutes
);

// PURCHASE ORDERS
app.use(
  "/api/purchase-orders",
  purchaseOrderRoutes
);

// VENDOR PERFORMANCE
app.use(
  "/api/vendor-performance",
  vendorPerformanceRoutes
);

// DASHBOARD
app.use(
  "/api/dashboard",
  dashboardRoutes
);

// =====================================================
// HOME ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "VMS Backend is running!",
  });
});

// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    message: "Internal server error",
  });
});

// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "✅ MongoDB connected successfully!"
    );

    // =================================================
    // START SERVER ONLY AFTER DATABASE CONNECTION
    // =================================================

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );
  });