const mongoose = require("mongoose");

const purchaseOrderSchema = new mongoose.Schema(
  {
    // =====================================================
    // PURCHASE ORDER NUMBER
    // =====================================================

    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =====================================================
    // CUSTOMER
    // =====================================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =====================================================
    // VENDOR
    // =====================================================

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    // =====================================================
    // ORDER DATE
    // =====================================================

    orderDate: {
      type: Date,
      default: Date.now,
    },

    // =====================================================
    // EXPECTED DELIVERY DATE
    // =====================================================

    expectedDeliveryDate: {
      type: Date,
      required: true,
    },

    // =====================================================
    // PURCHASE ORDER STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "SENT",
        "DELIVERED",
        "CLOSED",
      ],

      default: "PENDING_APPROVAL",
    },

    // =====================================================
    // TOTAL AMOUNT
    // =====================================================

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // NOTES
    // =====================================================

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // REJECTION REASON
    // =====================================================

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PurchaseOrder",
  purchaseOrderSchema
);