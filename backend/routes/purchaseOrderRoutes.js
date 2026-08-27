const express = require("express");
const PurchaseOrder = require("../models/PurchaseOrder");
const POLineItem = require("../models/POLineItem");

const router = express.Router();


// ========================================
// 1. CREATE PURCHASE ORDER
// ========================================

router.post("/", async (req, res) => {
    try {
        const {
            poNumber,
            vendor,
            expectedDeliveryDate,
            totalAmount,
            notes,
            items
        } = req.body;

        // Check required fields
        if (
            !poNumber ||
            !vendor ||
            !expectedDeliveryDate ||
            totalAmount === undefined
        ) {
            return res.status(400).json({
                message:
                    "Please provide all required Purchase Order details"
            });
        }

        // Create Purchase Order
        const purchaseOrder =
            await PurchaseOrder.create({
                poNumber,
                vendor,
                expectedDeliveryDate,
                totalAmount,
                notes
            });

        // Create PO Line Items
        if (items && items.length > 0) {

            const lineItems = items.map((item) => ({
                purchaseOrder:
                    purchaseOrder._id,

                productName:
                    item.productName,

                quantity:
                    Number(item.quantity),

                unitPrice:
                    Number(item.unitPrice),

                totalPrice:
                    Number(item.quantity) *
                    Number(item.unitPrice)
            }));

            await POLineItem.insertMany(
                lineItems
            );
        }

        res.status(201).json({
            message:
                "Purchase Order created successfully",

            purchaseOrder
        });

    } catch (error) {

        console.error(
            "Create PO Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to create Purchase Order",

            error: error.message
        });
    }
});


// ========================================
// 2. GET ALL PURCHASE ORDERS
// ========================================

router.get("/", async (req, res) => {
    try {

        const purchaseOrders =
            await PurchaseOrder
                .find()
                .populate(
                    "vendor",
                    "companyName contactPerson email phone"
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json(
            purchaseOrders
        );

    } catch (error) {

        console.error(
            "Fetch PO Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch Purchase Orders",

            error: error.message
        });
    }
});


// ========================================
// 3. GET SINGLE PURCHASE ORDER
// ========================================

router.get("/:id", async (req, res) => {
    try {

        const purchaseOrder =
            await PurchaseOrder
                .findById(req.params.id)
                .populate(
                    "vendor",
                    "companyName contactPerson email phone"
                );

        if (!purchaseOrder) {

            return res.status(404).json({
                message:
                    "Purchase Order not found"
            });
        }

        const items =
            await POLineItem.find({
                purchaseOrder:
                    purchaseOrder._id
            });

        res.status(200).json({
            purchaseOrder,
            items
        });

    } catch (error) {

        console.error(
            "Fetch Single PO Error:",
            error
        );

        res.status(500).json({
            message:
                "Failed to fetch Purchase Order",

            error: error.message
        });
    }
});


// ========================================
// 4. UPDATE PO STATUS
// STATE MACHINE
// ========================================

router.put(
    "/:id/status",
    async (req, res) => {

        try {

            const { status } =
                req.body;


            // --------------------------------
            // ALLOWED STATE TRANSITIONS
            // --------------------------------

            const allowedTransitions = {

                DRAFT: [
                    "PENDING_APPROVAL"
                ],

                PENDING_APPROVAL: [
                    "APPROVED"
                ],

                APPROVED: [
                    "SENT"
                ],

                SENT: [
                    "DELIVERED"
                ],

                DELIVERED: [
                    "CLOSED"
                ],

                CLOSED: []

            };


            // --------------------------------
            // FIND PURCHASE ORDER
            // --------------------------------

            const purchaseOrder =
                await PurchaseOrder.findById(
                    req.params.id
                );


            if (!purchaseOrder) {

                return res.status(404).json({
                    message:
                        "Purchase Order not found"
                });

            }


            // --------------------------------
            // CURRENT STATUS
            // --------------------------------

            const currentStatus =
                purchaseOrder.status;


            // --------------------------------
            // POSSIBLE NEXT STATES
            // --------------------------------

            const possibleNextStatuses =
                allowedTransitions[
                    currentStatus
                ];


            // --------------------------------
            // VALIDATE TRANSITION
            // --------------------------------

            if (
                !possibleNextStatuses ||
                !possibleNextStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    message:
                        `Invalid status transition: ${currentStatus} → ${status}`

                });

            }


            // --------------------------------
            // UPDATE STATUS
            // --------------------------------

            purchaseOrder.status =
                status;


            await purchaseOrder.save();


            // --------------------------------
            // SUCCESS RESPONSE
            // --------------------------------

            res.status(200).json({

                message:
                    "Purchase Order status updated successfully",

                purchaseOrder

            });

        } catch (error) {

            console.error(
                "Update PO Status Error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update Purchase Order status",

                error:
                    error.message

            });

        }
    }
);


// ========================================
// 5. EXPORT ROUTER
// ========================================

module.exports = router;