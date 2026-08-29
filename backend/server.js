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

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static("uploads")
);

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// IMPORT ROUTES
// =====================================================

const authRoutes =
  require("./routes/authRoutes");

const vendorRoutes =
  require("./routes/vendorRoutes");

const productRoutes =
  require("./routes/productRoutes");

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

// PRODUCTS
app.use(
  "/api/products",
  productRoutes
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
  res.status(200).json({
    message: "VMS Backend is running!",
    status: "success",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Backend is healthy",
    status: "OK",
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
    error: err.message,
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
  