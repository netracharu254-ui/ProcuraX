const express = require("express");
const Vendor = require("../models/Vendor");
const PurchaseOrder = require("../models/PurchaseOrder");

const router = express.Router();

// ========================================
// DASHBOARD STATISTICS
// ========================================

router.get("/stats", async (req, res) => {
    try {

        // -------------------------------
        // VENDOR COUNTS
        // -------------------------------

        const totalVendors =
            await Vendor.countDocuments();

        const approvedVendors =
            await Vendor.countDocuments({
                status: "APPROVED"
            });

        const pendingVendors =
            await Vendor.countDocuments({
                status: "PENDING"
            });

        const rejectedVendors =
            await Vendor.countDocuments({
                status: "REJECTED"
            });


        // -------------------------------
        // PURCHASE ORDER COUNTS
        // -------------------------------

        const totalPurchaseOrders =
            await PurchaseOrder.countDocuments();

        const draftPOs =
            await PurchaseOrder.countDocuments({
                status: "DRAFT"
            });

        const pendingApprovalPOs =
            await PurchaseOrder.countDocuments({
                status: "PENDING_APPROVAL"
            });

        const approvedPOs =
            await PurchaseOrder.countDocuments({
                status: "APPROVED"
            });

        const sentPOs =
            await PurchaseOrder.countDocuments({
                status: "SENT"
            });

        const deliveredPOs =
            await PurchaseOrder.countDocuments({
                status: "DELIVERED"
            });

        const closedPOs =
            await PurchaseOrder.countDocuments({
                status: "CLOSED"
            });


        // -------------------------------
        // TOTAL PO VALUE
        // -------------------------------

        const poValueResult =
            await PurchaseOrder.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$totalAmount"
                        }
                    }
                }
            ]);

        const totalPOValue =
            poValueResult.length > 0
                ? poValueResult[0].total
                : 0;


        // -------------------------------
        // RESPONSE
        // -------------------------------

        res.status(200).json({

            vendors: {
                total: totalVendors,
                approved: approvedVendors,
                pending: pendingVendors,
                rejected: rejectedVendors
            },

            purchaseOrders: {
                total: totalPurchaseOrders,
                draft: draftPOs,
                pendingApproval:
                    pendingApprovalPOs,
                approved: approvedPOs,
                sent: sentPOs,
                delivered: deliveredPOs,
                closed: closedPOs
            },

            totalPOValue

        });

    } catch (error) {

        console.error(
            "Dashboard Stats Error:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch dashboard statistics",

            error:
                error.message

        });

    }
});

module.exports = router;