const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();
const User = require("../models/User");

// =====================================================
// CHECK USER ROLE ENUM
// =====================================================

console.log(
  "USER ROLE ENUM:",
  User.schema.path("role").enumValues
);

// Allowed roles
const ALLOWED_ROLES = [
  "ADMIN",
  "MANAGER",
  "PROCUREMENT",
  "VENDOR",
  "CUSTOMER",
];

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Clean email
    const cleanEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({
      email: cleanEmail,
    });

    // User not found
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Successful login
    return res.status(200).json({
      message: "Login successful",

      token: "vms-" + user._id,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});

// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    // -----------------------------------------------
    // Check required fields
    // -----------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required",
      });
    }

    // -----------------------------------------------
    // Password validation
    // -----------------------------------------------

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    // -----------------------------------------------
    // Clean input
    // -----------------------------------------------

    const cleanName = name.trim();
    const cleanEmail = email.toLowerCase().trim();

    // -----------------------------------------------
    // Set role
    // -----------------------------------------------

    const selectedRole = role
      ? role.toUpperCase().trim()
      : "ADMIN";

    // -----------------------------------------------
    // Check role
    // -----------------------------------------------

    if (!ALLOWED_ROLES.includes(selectedRole)) {
      return res.status(400).json({
        message:
          "Invalid role. Allowed roles: ADMIN, MANAGER, PROCUREMENT, VENDOR, CUSTOMER",
      });
    }

    // -----------------------------------------------
    // Check existing user
    // -----------------------------------------------

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // -----------------------------------------------
    // Hash password
    // -----------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // -----------------------------------------------
    // Create user
    // -----------------------------------------------

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: selectedRole,
    });

    // -----------------------------------------------
    // Success response
    // -----------------------------------------------

    return res.status(201).json({
      message: "User created successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
});

// =====================================================
// TEST AUTH ROUTE
// GET /api/auth/test
// =====================================================

router.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Auth routes are working!",
  });
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;