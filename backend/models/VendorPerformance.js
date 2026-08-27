const mongoose = require("mongoose");

const vendorPerformanceSchema = new mongoose.Schema(
    {
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
            unique: true
        },

        deliveryScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        qualityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        complianceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        overallScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        totalOrders: {
            type: Number,
            default: 0
        },

        onTimeOrders: {
            type: Number,
            default: 0
        },

        qualityIssues: {
            type: Number,
            default: 0
        },

        remarks: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "VendorPerformance",
    vendorPerformanceSchema
);