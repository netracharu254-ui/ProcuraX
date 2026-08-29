const express = require("express");
const VendorPerformance = require("../models/VendorPerformance");
const Vendor = require("../models/vendor");

const router = express.Router();


// ========================================
// 1. GET ALL VENDOR PERFORMANCE
// ========================================

router.get("/", async (req, res) => {
    try {

        const performance =
            await VendorPerformance
                .find()
                .populate(
                    "vendor",
                    "companyName contactPerson email phone status"
                )
                .sort({
                    overallScore: -1
                });

        res.status(200).json(
            performance
        );

    } catch (error) {

        console.error(
            "Fetch Vendor Performance Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch vendor performance",

            error:
                error.message
        });
    }
});


// ========================================
// 2. GET PERFORMANCE OF ONE VENDOR
// ========================================

router.get(
    "/vendor/:vendorId",
    async (req, res) => {

        try {

            const performance =
                await VendorPerformance
                    .findOne({
                        vendor:
                            req.params.vendorId
                    })
                    .populate(
                        "vendor",
                        "companyName contactPerson email phone status"
                    );

            if (!performance) {

                return res.status(404).json({
                    message:
                        "Vendor performance not found"
                });

            }

            res.status(200).json(
                performance
            );

        } catch (error) {

            console.error(
                "Fetch Vendor Performance Error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch vendor performance",

                error:
                    error.message
            });
        }
    }
);


// ========================================
// 3. CREATE / UPDATE PERFORMANCE
// ========================================

router.post(
    "/",
    async (req, res) => {

        try {

            const {
                vendor,
                deliveryScore,
                qualityScore,
                complianceScore,
                totalOrders,
                onTimeOrders,
                qualityIssues,
                remarks
            } = req.body;


            // --------------------------------
            // CHECK VENDOR
            // --------------------------------

            const existingVendor =
                await Vendor.findById(
                    vendor
                );

            if (!existingVendor) {

                return res.status(404).json({
                    message:
                        "Vendor not found"
                });

            }


            // --------------------------------
            // CALCULATE OVERALL SCORE
            // --------------------------------

            const delivery =
                Number(
                    deliveryScore || 0
                );

            const quality =
                Number(
                    qualityScore || 0
                );

            const compliance =
                Number(
                    complianceScore || 0
                );


            const overallScore =
                Math.round(
                    (
                        delivery +
                        quality +
                        compliance
                    ) / 3
                );


            // --------------------------------
            // CREATE OR UPDATE
            // --------------------------------

            const performance =
                await VendorPerformance.findOneAndUpdate(

                    {
                        vendor
                    },

                    {
                        vendor,

                        deliveryScore:
                            delivery,

                        qualityScore:
                            quality,

                        complianceScore:
                            compliance,

                        overallScore,

                        totalOrders:
                            Number(
                                totalOrders || 0
                            ),

                        onTimeOrders:
                            Number(
                                onTimeOrders || 0
                            ),

                        qualityIssues:
                            Number(
                                qualityIssues || 0
                            ),

                        remarks:
                            remarks || ""
                    },

                    {
                        new: true,
                        upsert: true,
                        runValidators: true
                    }
                );


            res.status(200).json({

                message:
                    "Vendor performance saved successfully",

                performance

            });

        } catch (error) {

            console.error(
                "Save Vendor Performance Error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to save vendor performance",

                error:
                    error.message

            });
        }
    }
);


// ========================================
// 4. DELETE PERFORMANCE
// ========================================

router.delete(
    "/:id",
    async (req, res) => {

        try {

            const performance =
                await VendorPerformance.findByIdAndDelete(
                    req.params.id
                );

            if (!performance) {

                return res.status(404).json({
                    message:
                        "Vendor performance not found"
                });

            }

            res.status(200).json({

                message:
                    "Vendor performance deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete Vendor Performance Error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to delete vendor performance",

                error:
                    error.message

            });
        }
    }
);


module.exports = router;