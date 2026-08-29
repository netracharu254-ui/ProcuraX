const express = require("express");
const multer = require("multer");

const PurchaseOrder = require("../models/PurchaseOrder");
const POLineItem = require("../models/POLineItem");

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      file.originalname.replace(/\s+/g, "-");

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
      );
    }
  },
});

// =====================================================
// HELPER - POPULATE PURCHASE ORDER
// =====================================================

const populatePurchaseOrder = (query) => {
  return query
    .populate(
      "customer",
      "name email"
    )
    .populate(
      "vendor",
      "companyName contactPerson email phone"
    );
};

// =====================================================
// 1. CREATE PURCHASE ORDER
// CUSTOMER
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      poNumber,
      customer,
      vendor,
      expectedDeliveryDate,
      totalAmount,
      notes,
      items,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !poNumber ||
      !customer ||
      !vendor ||
      !expectedDeliveryDate ||
      totalAmount === undefined
    ) {
      return res.status(400).json({
        message:
          "Please provide all required Purchase Order details",
      });
    }

    // -------------------------------------------------
    // VALIDATE ITEMS
    // -------------------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message:
          "Purchase Order must contain at least one item",
      });
    }

    // -------------------------------------------------
    // CHECK DUPLICATE PO NUMBER
    // -------------------------------------------------

    const existingPO =
      await PurchaseOrder.findOne({
        poNumber,
      });

    if (existingPO) {
      return res.status(409).json({
        message:
          "Purchase Order number already exists",
      });
    }

    // -------------------------------------------------
    // CREATE PURCHASE ORDER
    // -------------------------------------------------

    const purchaseOrder =
      await PurchaseOrder.create({
        poNumber,

        customer,

        vendor,

        expectedDeliveryDate,

        totalAmount: Number(totalAmount),

        notes: notes || "",

        // IMPORTANT:
        // Customer order goes directly
        // for admin approval.

        status: "PENDING_APPROVAL",
      });

    // -------------------------------------------------
    // CREATE PO LINE ITEMS
    // -------------------------------------------------

    const lineItems = items.map((item) => {
      const quantity =
        Number(item.quantity);

      const unitPrice =
        Number(item.unitPrice);

      return {
        purchaseOrder:
          purchaseOrder._id,

        productName:
          item.productName,

        itemPhoto:
          item.itemPhoto || "",

        quantity,

        unitPrice,

        totalPrice:
          quantity * unitPrice,
      };
    });

    await POLineItem.insertMany(
      lineItems
    );

    // -------------------------------------------------
    // RETURN POPULATED PO
    // -------------------------------------------------

    const populatedPO =
      await populatePurchaseOrder(
        PurchaseOrder.findById(
          purchaseOrder._id
        )
      );

    res.status(201).json({
      message:
        "Purchase Order created and sent for approval",

      purchaseOrder: populatedPO,
    });
  } catch (error) {
    console.error(
      "Create PO Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create Purchase Order",

      error: error.message,
    });
  }
});

// =====================================================
// 2. GET ALL PURCHASE ORDERS
// ADMIN
// =====================================================

router.get("/", async (req, res) => {
  try {
    const purchaseOrders =
      await populatePurchaseOrder(
        PurchaseOrder.find()
      ).sort({
        createdAt: -1,
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

      error: error.message,
    });
  }
});

// =====================================================
// 3. GET CUSTOMER ORDERS
// CUSTOMER
// =====================================================

router.get(
  "/customer/:customerId",
  async (req, res) => {
    try {
      const { customerId } =
        req.params;

      if (
        !customerId ||
        !require("mongoose").Types.ObjectId.isValid(
          customerId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid customer ID",
        });
      }

      const purchaseOrders =
        await populatePurchaseOrder(
          PurchaseOrder.find({
            customer: customerId,
          })
        ).sort({
          createdAt: -1,
        });

      res.status(200).json(
        purchaseOrders
      );
    } catch (error) {
      console.error(
        "Fetch Customer Orders Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch customer orders",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 4. GET PENDING APPROVAL ORDERS
// ADMIN
// =====================================================

router.get(
  "/pending",
  async (req, res) => {
    try {
      const purchaseOrders =
        await populatePurchaseOrder(
          PurchaseOrder.find({
            status:
              "PENDING_APPROVAL",
          })
        ).sort({
          createdAt: -1,
        });

      res.status(200).json(
        purchaseOrders
      );
    } catch (error) {
      console.error(
        "Fetch Pending PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch pending Purchase Orders",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 5. GET SINGLE PURCHASE ORDER
// =====================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const purchaseOrder =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            req.params.id
          )
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      const items =
        await POLineItem.find({
          purchaseOrder:
            purchaseOrder._id,
        });

      res.status(200).json({
        purchaseOrder,

        items,
      });
    } catch (error) {
      console.error(
        "Fetch Single PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch Purchase Order",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 6. ADMIN APPROVE PURCHASE ORDER
// =====================================================

router.put(
  "/:id/approve",
  async (req, res) => {
    try {
      const purchaseOrder =
        await PurchaseOrder.findById(
          req.params.id
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      // Only pending orders can be approved

      if (
        purchaseOrder.status !==
        "PENDING_APPROVAL"
      ) {
        return res.status(400).json({
          message:
            `Cannot approve order with status ${purchaseOrder.status}`,
        });
      }

      purchaseOrder.status =
        "APPROVED";

      purchaseOrder.rejectionReason =
        "";

      await purchaseOrder.save();

      const updatedPO =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            purchaseOrder._id
          )
        );

      res.status(200).json({
        message:
          "Purchase Order approved successfully",

        purchaseOrder: updatedPO,
      });
    } catch (error) {
      console.error(
        "Approve PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to approve Purchase Order",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 7. ADMIN REJECT PURCHASE ORDER
// =====================================================

router.put(
  "/:id/reject",
  async (req, res) => {
    try {
      const { reason } =
        req.body;

      const purchaseOrder =
        await PurchaseOrder.findById(
          req.params.id
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      // Only pending orders can be rejected

      if (
        purchaseOrder.status !==
        "PENDING_APPROVAL"
      ) {
        return res.status(400).json({
          message:
            `Cannot reject order with status ${purchaseOrder.status}`,
        });
      }

      purchaseOrder.status =
        "REJECTED";

      purchaseOrder.rejectionReason =
        reason?.trim() ||
        "Order rejected by admin";

      await purchaseOrder.save();

      const updatedPO =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            purchaseOrder._id
          )
        );

      res.status(200).json({
        message:
          "Purchase Order rejected successfully",

        purchaseOrder: updatedPO,
      });
    } catch (error) {
      console.error(
        "Reject PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to reject Purchase Order",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 8. SEND APPROVED PO TO VENDOR
// =====================================================

router.put(
  "/:id/send",
  async (req, res) => {
    try {
      const purchaseOrder =
        await PurchaseOrder.findById(
          req.params.id
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      if (
        purchaseOrder.status !==
        "APPROVED"
      ) {
        return res.status(400).json({
          message:
            "Only approved orders can be sent to vendor",
        });
      }

      purchaseOrder.status =
        "SENT";

      await purchaseOrder.save();

      const updatedPO =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            purchaseOrder._id
          )
        );

      res.status(200).json({
        message:
          "Purchase Order sent to vendor",

        purchaseOrder: updatedPO,
      });
    } catch (error) {
      console.error(
        "Send PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to send Purchase Order",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 9. MARK PO AS DELIVERED
// =====================================================

router.put(
  "/:id/deliver",
  async (req, res) => {
    try {
      const purchaseOrder =
        await PurchaseOrder.findById(
          req.params.id
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      if (
        purchaseOrder.status !==
        "SENT"
      ) {
        return res.status(400).json({
          message:
            "Only sent orders can be marked as delivered",
        });
      }

      purchaseOrder.status =
        "DELIVERED";

      await purchaseOrder.save();

      const updatedPO =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            purchaseOrder._id
          )
        );

      res.status(200).json({
        message:
          "Purchase Order marked as delivered",

        purchaseOrder: updatedPO,
      });
    } catch (error) {
      console.error(
        "Deliver PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update delivery status",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 10. CLOSE PURCHASE ORDER
// =====================================================

router.put(
  "/:id/close",
  async (req, res) => {
    try {
      const purchaseOrder =
        await PurchaseOrder.findById(
          req.params.id
        );

      if (!purchaseOrder) {
        return res.status(404).json({
          message:
            "Purchase Order not found",
        });
      }

      if (
        purchaseOrder.status !==
        "DELIVERED"
      ) {
        return res.status(400).json({
          message:
            "Only delivered orders can be closed",
        });
      }

      purchaseOrder.status =
        "CLOSED";

      await purchaseOrder.save();

      const updatedPO =
        await populatePurchaseOrder(
          PurchaseOrder.findById(
            purchaseOrder._id
          )
        );

      res.status(200).json({
        message:
          "Purchase Order closed successfully",

        purchaseOrder: updatedPO,
      });
    } catch (error) {
      console.error(
        "Close PO Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to close Purchase Order",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 11. UPLOAD ITEM PHOTO
// =====================================================

router.post(
  "/item/:itemId/photo",
  upload.single("itemPhoto"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please upload an image",
        });
      }

      const item =
        await POLineItem.findById(
          req.params.itemId
        );

      if (!item) {
        return res.status(404).json({
          message:
            "PO item not found",
        });
      }

      item.itemPhoto =
        `/uploads/${req.file.filename}`;

      await item.save();

      res.status(200).json({
        message:
          "Item photo uploaded successfully",

        item,
      });
    } catch (error) {
      console.error(
        "Item Photo Upload Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to upload item photo",

        error: error.message,
      });
    }
  }
);

// =====================================================
// 12. MULTER ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof multer.MulterError
    ) {
      return res.status(400).json({
        message:
          "Image upload error: " +
          error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        message:
          error.message,
      });
    }

    next();
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;