const express = require("express");

const Vendor = require("../models/vendor");

const router = express.Router();


// ========================================
// 1. CREATE VENDOR
// ========================================

router.post("/", async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      category,
      notes,
    } = req.body;

    // Check required fields
    if (
      !companyName ||
      !contactPerson ||
      !email ||
      !phone
    ) {
      return res.status(400).json({
        message:
          "Please provide company name, contact person, email and phone",
      });
    }

    // Check duplicate email
    const existingVendor = await Vendor.findOne({
      email: email.toLowerCase(),
    });

    if (existingVendor) {
      return res.status(400).json({
        message:
          "A vendor with this email already exists",
      });
    }

    // Create vendor
    const vendor = await Vendor.create({
      companyName,
      contactPerson,
      email,
      phone,
      address,
      category,
      notes,
    });

    res.status(201).json({
      message: "Vendor created successfully",
      vendor,
    });
  } catch (error) {
    console.error("Create Vendor Error:", error);

    res.status(500).json({
      message: "Failed to create vendor",
      error: error.message,
    });
  }
});


// ========================================
// 2. GET ALL VENDORS
// ========================================

router.get("/", async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({
      createdAt: -1,
    });

    res.status(200).json(vendors);
  } catch (error) {
    console.error("Fetch Vendors Error:", error);

    res.status(500).json({
      message: "Failed to fetch vendors",
      error: error.message,
    });
  }
});


// ========================================
// 3. GET SINGLE VENDOR
// ========================================

router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(
      req.params.id
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    res.status(200).json(vendor);
  } catch (error) {
    console.error(
      "Fetch Single Vendor Error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch vendor",
      error: error.message,
    });
  }
});


// ========================================
// 4. UPDATE VENDOR
// ========================================

router.put("/:id", async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      address,
      category,
      status,
      notes,
    } = req.body;

    const vendor = await Vendor.findById(
      req.params.id
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    // Update fields only if provided
    if (companyName !== undefined) {
      vendor.companyName = companyName;
    }

    if (contactPerson !== undefined) {
      vendor.contactPerson = contactPerson;
    }

    if (email !== undefined) {
      vendor.email = email.toLowerCase();
    }

    if (phone !== undefined) {
      vendor.phone = phone;
    }

    if (address !== undefined) {
      vendor.address = address;
    }

    if (category !== undefined) {
      vendor.category = category;
    }

    if (status !== undefined) {
      vendor.status = status;
    }

    if (notes !== undefined) {
      vendor.notes = notes;
    }

    await vendor.save();

    res.status(200).json({
      message: "Vendor updated successfully",
      vendor,
    });
  } catch (error) {
    console.error(
      "Update Vendor Error:",
      error
    );

    res.status(500).json({
      message: "Failed to update vendor",
      error: error.message,
    });
  }
});


// ========================================
// 5. UPDATE VENDOR STATUS
// ========================================

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "ACTIVE",
      "INACTIVE",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid vendor status",
      });
    }

    const vendor = await Vendor.findById(
      req.params.id
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    vendor.status = status;

    await vendor.save();

    res.status(200).json({
      message:
        "Vendor status updated successfully",
      vendor,
    });
  } catch (error) {
    console.error(
      "Update Vendor Status Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update vendor status",
      error: error.message,
    });
  }
});


// ========================================
// 6. DELETE VENDOR
// ========================================

router.delete("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(
      req.params.id
    );

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found",
      });
    }

    await Vendor.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Vendor Error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete vendor",
      error: error.message,
    });
  }
});


// ========================================
// EXPORT
// ========================================

module.exports = router;