const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();


// =====================================================
// HELPER - VALIDATE VENDOR ID
// =====================================================

const isValidVendorId = (vendorId) => {
  return mongoose.Types.ObjectId.isValid(vendorId);
};


// =====================================================
// 1. CREATE PRODUCT
// VENDOR
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      productName,
      category,
      description,
      sku,
      quantity,
      unitPrice,
      vendor,
      photo,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (
      !productName ||
      !category ||
      quantity === undefined ||
      unitPrice === undefined ||
      !vendor
    ) {
      return res.status(400).json({
        message:
          "Please provide product name, category, quantity, unit price and vendor",
      });
    }

    // -------------------------------------------------
    // VALIDATE VENDOR ID
    // -------------------------------------------------

    if (!isValidVendorId(vendor)) {
      return res.status(400).json({
        message: "Invalid vendor ID",
      });
    }

    // -------------------------------------------------
    // CHECK DUPLICATE SKU
    // -------------------------------------------------

    if (sku) {
      const existingProduct =
        await Product.findOne({ sku });

      if (existingProduct) {
        return res.status(400).json({
          message:
            "A product with this SKU already exists",
        });
      }
    }

    // -------------------------------------------------
    // CREATE PRODUCT
    // -------------------------------------------------

    const product = await Product.create({
      productName: productName.trim(),
      category: category.trim(),
      description: description || "",
      sku: sku || undefined,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      vendor,
      photo: photo || "",
    });

    // -------------------------------------------------
    // POPULATE VENDOR
    // -------------------------------------------------

    const populatedProduct =
      await Product.findById(product._id).populate(
        "vendor",
        "companyName contactPerson email phone"
      );

    res.status(201).json({
      message:
        "Product registered successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    // Duplicate SKU
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A product with this SKU already exists",
      });
    }

    res.status(500).json({
      message:
        "Failed to create product",
      error: error.message,
    });
  }
});


// =====================================================
// 2. GET ALL PRODUCTS
// ADMIN
// =====================================================

router.get("/", async (req, res) => {
  try {
    const products =
      await Product.find()
        .populate(
          "vendor",
          "companyName contactPerson email phone"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json(products);
  } catch (error) {
    console.error(
      "Fetch Products Error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch products",
      error: error.message,
    });
  }
});


// =====================================================
// 3. GET PRODUCTS OF SPECIFIC VENDOR
// VENDOR
// =====================================================

router.get(
  "/vendor/:vendorId",
  async (req, res) => {
    try {
      const { vendorId } = req.params;

      // -------------------------------------------------
      // VALIDATE VENDOR ID
      // -------------------------------------------------

      if (!isValidVendorId(vendorId)) {
        return res.status(400).json({
          message:
            "Invalid vendor ID",
        });
      }

      // -------------------------------------------------
      // FIND ONLY THIS VENDOR'S PRODUCTS
      // -------------------------------------------------

      const products =
        await Product.find({
          vendor: vendorId,
        })
          .populate(
            "vendor",
            "companyName contactPerson email phone"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json(products);
    } catch (error) {
      console.error(
        "Fetch Vendor Products Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch vendor products",
        error: error.message,
      });
    }
  }
);


// =====================================================
// 4. GET SINGLE PRODUCT
// =====================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.id
        ).populate(
          "vendor",
          "companyName contactPerson email phone"
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(
        "Fetch Single Product Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch product",
        error: error.message,
      });
    }
  }
);


// =====================================================
// 5. UPDATE PRODUCT
// VENDOR / ADMIN
// =====================================================

router.put(
  "/:id",
  async (req, res) => {
    try {
      const {
        productName,
        category,
        description,
        sku,
        quantity,
        unitPrice,
        vendor,
        photo,
        status,
      } = req.body;

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      // -------------------------------------------------
      // UPDATE FIELDS
      // -------------------------------------------------

      if (productName !== undefined) {
        product.productName =
          productName.trim();
      }

      if (category !== undefined) {
        product.category =
          category.trim();
      }

      if (description !== undefined) {
        product.description =
          description;
      }

      if (sku !== undefined) {
        product.sku =
          sku || undefined;
      }

      if (quantity !== undefined) {
        product.quantity =
          Number(quantity);
      }

      if (unitPrice !== undefined) {
        product.unitPrice =
          Number(unitPrice);
      }

      // -------------------------------------------------
      // VENDOR
      // -------------------------------------------------

      if (vendor !== undefined) {
        if (!isValidVendorId(vendor)) {
          return res.status(400).json({
            message:
              "Invalid vendor ID",
          });
        }

        product.vendor = vendor;
      }

      if (photo !== undefined) {
        product.photo = photo;
      }

      if (status !== undefined) {
        const allowedStatuses = [
          "ACTIVE",
          "INACTIVE",
          "OUT_OF_STOCK",
        ];

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid product status",
          });
        }

        product.status = status;
      }

      await product.save();

      const updatedProduct =
        await Product.findById(
          product._id
        ).populate(
          "vendor",
          "companyName contactPerson email phone"
        );

      res.status(200).json({
        message:
          "Product updated successfully",
        product:
          updatedProduct,
      });
    } catch (error) {
      console.error(
        "Update Product Error:",
        error
      );

      if (error.code === 11000) {
        return res.status(400).json({
          message:
            "A product with this SKU already exists",
        });
      }

      res.status(500).json({
        message:
          "Failed to update product",
        error: error.message,
      });
    }
  }
);


// =====================================================
// 6. UPDATE PRODUCT STOCK
// VENDOR
// =====================================================

router.put(
  "/:id/stock",
  async (req, res) => {
    try {
      const { quantity } = req.body;

      if (quantity === undefined) {
        return res.status(400).json({
          message:
            "Quantity is required",
        });
      }

      const numericQuantity =
        Number(quantity);

      if (
        Number.isNaN(numericQuantity) ||
        numericQuantity < 0
      ) {
        return res.status(400).json({
          message:
            "Quantity must be a valid non-negative number",
        });
      }

      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      product.quantity =
        numericQuantity;

      // Automatically update status
      if (numericQuantity === 0) {
        product.status =
          "OUT_OF_STOCK";
      } else if (
        product.status ===
        "OUT_OF_STOCK"
      ) {
        product.status =
          "ACTIVE";
      }

      await product.save();

      res.status(200).json({
        message:
          "Product stock updated successfully",
        product,
      });
    } catch (error) {
      console.error(
        "Update Stock Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update product stock",
        error: error.message,
      });
    }
  }
);


// =====================================================
// 7. DELETE PRODUCT
// VENDOR / ADMIN
// =====================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const product =
        await Product.findById(
          req.params.id
        );

      if (!product) {
        return res.status(404).json({
          message:
            "Product not found",
        });
      }

      await Product.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        message:
          "Product deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete product",
        error: error.message,
      });
    }
  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;