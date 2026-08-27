const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true
        },

        contactPerson: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true
        },

        gstNumber: {
            type: String,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        documents: {
            gstCertificate: {
                type: String,
                default: ""
            },

            businessRegistration: {
                type: String,
                default: ""
            },

            isoCertificate: {
                type: String,
                default: ""
            }
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "UNDER_REVIEW",
                "APPROVED",
                "REJECTED",
                "ACTIVE"
            ],
            default: "PENDING"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Vendor", vendorSchema);