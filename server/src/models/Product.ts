import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  sku: string;
  name: string;
  description: string | null;
  category: string;
  baseUnit: string;
  basePrice: mongoose.Types.Decimal128;
  stockQuantity: mongoose.Types.Decimal128;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    category: { type: String, required: true, trim: true },
    baseUnit: { type: String, required: true, enum: ["g", "kg", "mL", "L", "items"] },
    // Storing values as Decimal128 for high decimal precision
    basePrice: { type: Schema.Types.Decimal128, required: true },
    stockQuantity: { type: Schema.Types.Decimal128, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
