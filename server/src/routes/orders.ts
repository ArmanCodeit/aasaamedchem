import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import Product from "../models/Product";
import { authenticateToken, requireRole, AuthenticatedRequest } from "../middleware/auth";
import { calculateBaseQuantity, calculateOrderUnitPrice, areUnitsCompatible } from "../lib/conversions";

const router = express.Router();

// Helper to format Order document for client JSON serialization
export function formatOrder(o: any) {
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    sellerId: o.seller ? (o.seller._id ? o.seller._id.toString() : o.seller.toString()) : "",
    sellerName: o.seller && o.seller.name ? o.seller.name : "Unknown Seller",
    sellerEmail: o.seller && o.seller.email ? o.seller.email : "",
    status: o.status,
    totalAmount: o.totalAmount ? o.totalAmount.toString() : "0.00000000",
    createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString(),
    items: o.items.map((i: any) => ({
      id: i._id ? i._id.toString() : "",
      productId: i.product ? i.product.toString() : "",
      productSku: i.productSku,
      productName: i.productName,
      productBaseUnit: i.productBaseUnit,
      orderedQuantity: i.orderedQuantity ? i.orderedQuantity.toString() : "0.00000000",
      orderedUnit: i.orderedUnit,
      pricePerUnit: i.pricePerUnit ? i.pricePerUnit.toString() : "0.00000000",
      totalPrice: i.totalPrice ? i.totalPrice.toString() : "0.00000000",
      baseQuantity: i.baseQuantity ? i.baseQuantity.toString() : "0.00000000",
    })),
  };
}

// GET /api/orders - List all orders (filtered by seller if role is SELLER)
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    let query = {};
    if (req.user?.role !== "ADMIN") {
      query = { seller: req.user?.id };
    }

    const dbOrders = await Order.find(query)
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    const formatted = dbOrders.map((o) => formatOrder(o));
    res.json({ orders: formatted });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Submit a new quotation/order
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
       res.status(400).json({ error: "Order must contain at least one item." });
       return;
    }

    const validatedItems: any[] = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const { productId, orderedQuantity, orderedUnit } = item;

      if (!productId || orderedQuantity === undefined || !orderedUnit) {
         res.status(400).json({ error: "Invalid item data. Missing fields." });
         return;
      }

      const quantityNum = Number(orderedQuantity);
      if (isNaN(quantityNum) || quantityNum <= 0) {
         res.status(400).json({ error: "Ordered quantity must be greater than zero." });
         return;
      }

      // Fetch canonical product details from DB
      const product = await Product.findById(productId);
      if (!product) {
         res.status(404).json({ error: `Product with ID ${productId} not found.` });
         return;
      }

      // Check unit compatibility
      if (!areUnitsCompatible(orderedUnit, product.baseUnit)) {
         res.status(400).json({
          error: `Unit ${orderedUnit} is incompatible with product ${product.name} base unit (${product.baseUnit}).`,
        });
         return;
      }

      // Calculate conversions
      const basePriceVal = Number(product.basePrice.toString());
      const baseQty = calculateBaseQuantity(quantityNum, orderedUnit, product.baseUnit);
      const unitPrice = calculateOrderUnitPrice(basePriceVal, product.baseUnit, orderedUnit);
      const subtotal = quantityNum * unitPrice;

      calculatedTotal += subtotal;

      validatedItems.push({
        product: product._id,
        productSku: product.sku,
        productName: product.name,
        productBaseUnit: product.baseUnit,
        orderedQuantity: mongoose.Types.Decimal128.fromString(quantityNum.toFixed(8)),
        orderedUnit: orderedUnit,
        pricePerUnit: mongoose.Types.Decimal128.fromString(unitPrice.toFixed(8)),
        totalPrice: mongoose.Types.Decimal128.fromString(subtotal.toFixed(8)),
        baseQuantity: mongoose.Types.Decimal128.fromString(baseQty.toFixed(8)),
      });
    }

    const orderNumber = `QT-${Date.now().toString().slice(-8)}`;

    const newOrder = await Order.create({
      orderNumber,
      seller: req.user?.id,
      totalAmount: mongoose.Types.Decimal128.fromString(calculatedTotal.toFixed(8)),
      items: validatedItems,
    });

    // Populate seller for response
    const populated = await Order.findById(newOrder._id).populate("seller", "name email");

    res.status(201).json({ success: true, order: formatOrder(populated) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id - Approve or Reject an order (ADMIN only)
router.put("/:id", authenticateToken, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
       res.status(400).json({ error: "Invalid status. Must be APPROVED or REJECTED." });
       return;
    }

    const order = await Order.findById(id).populate("seller", "name email");
    if (!order) {
       res.status(404).json({ error: "Order not found." });
       return;
    }

    // Do nothing if status matches
    if (order.status === status) {
       res.json({ success: true, order: formatOrder(order) });
       return;
    }

    // Allocate stock if approved
    if (status === "APPROVED") {
      // Step 1: Verify stock levels first to avoid partial updates
      const productUpdates: { productDoc: any; newStock: string }[] = [];

      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
           res.status(404).json({ error: `Product ${item.productName} not found during stock deduction.` });
           return;
        }

        const currentStock = Number(product.stockQuantity.toString());
        const reqQty = Number(item.baseQuantity.toString());
        const newStockVal = currentStock - reqQty;

        if (newStockVal < 0) {
           res.status(409).json({
            error: `Insufficient stock for product ${product.name}. Required: ${reqQty.toFixed(4)} ${product.baseUnit}, Available: ${currentStock.toFixed(4)} ${product.baseUnit}`,
          });
           return;
        }

        productUpdates.push({
          productDoc: product,
          newStock: newStockVal.toFixed(8),
        });
      }

      // Step 2: Deduct stock from all products
      for (const update of productUpdates) {
        update.productDoc.stockQuantity = mongoose.Types.Decimal128.fromString(update.newStock);
        await update.productDoc.save();
      }
    }

    order.status = status;
    await order.save();

    res.json({ success: true, order: formatOrder(order) });
  } catch (error) {
    next(error);
  }
});

export default router;
