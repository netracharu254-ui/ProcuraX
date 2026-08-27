const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
    {
        poNumber: {
            type: String,
            required: true,
            unique: true
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },

        orderDate: {
            type: Date,
            default: Date.now
        },

        expectedDeliveryDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "SENT",
                "DELIVERED",
                "CLOSED"
            ],
            default: "DRAFT"
        },

        totalAmount: {
            type: Number,
            required: true
        },

        notes: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PurchaseOrder",
    purchaseOrderSchema
);