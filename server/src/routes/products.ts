import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = express.Router();

// Helper to format Decimal128 values for client serialization
export function formatProduct(p: any) {
  return {
    id: p._id.toString(),
    sku: p.sku,
    name: p.name,
    description: p.description,
    category: p.category,
    baseUnit: p.baseUnit,
    basePrice: p.basePrice ? p.basePrice.toString() : "0.00000000",
    stockQuantity: p.stockQuantity ? p.stockQuantity.toString() : "0.00000000",
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
  };
}

// GET /api/products - List all products
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const dbProducts = await Product.find({}).sort({ name: 1 });
    const formatted = dbProducts.map((p) => formatProduct(p));
    res.json({ products: formatted });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Create a product (ADMIN only)
router.post("/", authenticateToken, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { sku, name, description, category, baseUnit, basePrice, stockQuantity } = req.body;

    if (!sku || !name || !category || !baseUnit || basePrice === undefined || stockQuantity === undefined) {
       res.status(400).json({ error: "Missing required fields." });
       return;
    }

    const validUnits = ["g", "kg", "mL", "L", "items"];
    if (!validUnits.includes(baseUnit)) {
       res.status(400).json({ error: "Invalid base unit." });
       return;
    }

    if (isNaN(Number(basePrice)) || Number(basePrice) < 0) {
       res.status(400).json({ error: "Base price must be a positive number." });
       return;
    }

    if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
       res.status(400).json({ error: "Stock quantity must be a positive number." });
       return;
    }

    // SKU unique check
    const skuUpper = sku.trim().toUpperCase();
    const existing = await Product.findOne({ sku: skuUpper });
    if (existing) {
       res.status(409).json({ error: `Product with SKU ${skuUpper} already exists.` });
       return;
    }

    const product = await Product.create({
      sku: skuUpper,
      name: name.trim(),
      description: description ? description.trim() : null,
      category: category.trim(),
      baseUnit,
      basePrice: mongoose.Types.Decimal128.fromString(Number(basePrice).toFixed(8)),
      stockQuantity: mongoose.Types.Decimal128.fromString(Number(stockQuantity).toFixed(8)),
    });

    res.status(201).json({ success: true, product: formatProduct(product) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Update a product (ADMIN only)
router.put("/:id", authenticateToken, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check product exists
    const product = await Product.findById(id);
    if (!product) {
       res.status(404).json({ error: "Product not found." });
       return;
    }

    // Field updates and validations
    if (data.baseUnit !== undefined) {
      const validUnits = ["g", "kg", "mL", "L", "items"];
      if (!validUnits.includes(data.baseUnit)) {
         res.status(400).json({ error: "Invalid base unit." });
         return;
      }
      product.baseUnit = data.baseUnit;
    }

    if (data.basePrice !== undefined) {
      if (isNaN(Number(data.basePrice)) || Number(data.basePrice) < 0) {
         res.status(400).json({ error: "Base price must be a positive number." });
         return;
      }
      product.basePrice = mongoose.Types.Decimal128.fromString(Number(data.basePrice).toFixed(8));
    }

    if (data.stockQuantity !== undefined) {
      if (isNaN(Number(data.stockQuantity)) || Number(data.stockQuantity) < 0) {
         res.status(400).json({ error: "Stock quantity must be a positive number." });
         return;
      }
      product.stockQuantity = mongoose.Types.Decimal128.fromString(Number(data.stockQuantity).toFixed(8));
    }

    if (data.sku !== undefined) {
      const skuUpper = data.sku.trim().toUpperCase();
      if (!skuUpper) {
         res.status(400).json({ error: "SKU cannot be empty." });
         return;
      }
      // Check SKU unique
      if (skuUpper !== product.sku) {
        const existing = await Product.findOne({ sku: skuUpper });
        if (existing) {
           res.status(409).json({ error: `Product with SKU ${skuUpper} already exists.` });
           return;
        }
      }
      product.sku = skuUpper;
    }

    if (data.name !== undefined) {
      product.name = data.name.trim();
      if (!product.name) {
         res.status(400).json({ error: "Name cannot be empty." });
         return;
      }
    }

    if (data.description !== undefined) {
      product.description = data.description ? data.description.trim() : null;
    }

    if (data.category !== undefined) {
      product.category = data.category.trim();
      if (!product.category) {
         res.status(400).json({ error: "Category cannot be empty." });
         return;
      }
    }

    await product.save();
    res.json({ success: true, product: formatProduct(product) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Delete a product (ADMIN only)
router.delete("/:id", authenticateToken, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
       res.status(404).json({ error: "Product not found." });
       return;
    }

    res.json({ success: true, product: formatProduct(product) });
  } catch (error) {
    next(error);
  }
});

export default router;
