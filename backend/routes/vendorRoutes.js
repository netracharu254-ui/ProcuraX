const express = require("express");
const Vendor = require("../models/Vendor");

const router = express.Router();


// ========================================
// 1. REGISTER NEW VENDOR
// ========================================

router.post("/", async (req, res) => {
    try {
        const vendor = await Vendor.create(req.body);

        res.status(201).json({
            message: "Vendor registered successfully",
            vendor: vendor
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to register vendor",
            error: error.message
        });
    }
});


// ========================================
// 2. GET ALL VENDORS
// ========================================

router.get("/", async (req, res) => {
    try {
        const vendors = await Vendor.find();

        res.status(200).json(vendors);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch vendors",
            error: error.message
        });
    }
});


// ========================================
// 3. UPDATE VENDOR STATUS
// ========================================

router.put("/:id/status", async (req, res) => {
    try {

        const { status } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        res.status(200).json({
            message: "Vendor status updated successfully",
            vendor: vendor
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to update vendor status",
            error: error.message
        });

    }
});


module.exports = router;