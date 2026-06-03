import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productSku: string;
  productName: string;
  productBaseUnit: string;
  orderedQuantity: mongoose.Types.Decimal128;
  orderedUnit: string;
  pricePerUnit: mongoose.Types.Decimal128;
  totalPrice: mongoose.Types.Decimal128;
  baseQuantity: mongoose.Types.Decimal128;
}

export interface IOrder extends Document {
  orderNumber: string;
  seller: mongoose.Types.ObjectId;
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalAmount: mongoose.Types.Decimal128;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productSku: { type: String, required: true },
  productName: { type: String, required: true },
  productBaseUnit: { type: String, required: true },
  orderedQuantity: { type: Schema.Types.Decimal128, required: true },
  orderedUnit: { type: String, required: true },
  pricePerUnit: { type: Schema.Types.Decimal128, required: true },
  totalPrice: { type: Schema.Types.Decimal128, required: true },
  baseQuantity: { type: Schema.Types.Decimal128, required: true },
});

const OrderSchema: Schema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
    items: [OrderItemSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
