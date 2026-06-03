import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User";
import Product from "./models/Product";
import Order from "./models/Order";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aasam-medchem";

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Clear collections
    console.log("Clearing collections...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});

    // Hash passwords
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const sellerPasswordHash = await bcrypt.hash("seller123", 10);

    // Create users
    console.log("Seeding users...");
    const adminUser = await User.create({
      email: "admin@aasamedchem.com",
      name: "Admin User",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    });

    const sellerUser = await User.create({
      email: "seller@aasamedchem.com",
      name: "Seller User",
      passwordHash: sellerPasswordHash,
      role: "SELLER",
    });

    console.log(`Seeded users: Admin (${adminUser.email}), Seller (${sellerUser.email})`);

    // Create products
    console.log("Seeding products...");
    const products = [
      {
        sku: "PROD-NAC-001",
        name: "Sodium Chloride (NaCl)",
        description: "Analytical grade sodium chloride powder, 99.9% purity.",
        category: "Reagents",
        baseUnit: "g",
        basePrice: mongoose.Types.Decimal128.fromString("0.15000000"),
        stockQuantity: mongoose.Types.Decimal128.fromString("100000.00000000"), // 100 kg in grams
      },
      {
        sku: "PROD-ASA-002",
        name: "Aspirin (Acetylsalicylic Acid)",
        description: "Pharmaceutical active ingredient powder.",
        category: "APIs",
        baseUnit: "kg",
        basePrice: mongoose.Types.Decimal128.fromString("1200.00000000"),
        stockQuantity: mongoose.Types.Decimal128.fromString("25.50000000"), // 25.5 kg
      },
      {
        sku: "PROD-ETH-003",
        name: "Ethanol (99% Absolute)",
        description: "Absolute ethanol, laboratory grade liquid solvent.",
        category: "Solvents",
        baseUnit: "L",
        basePrice: mongoose.Types.Decimal128.fromString("450.00000000"),
        stockQuantity: mongoose.Types.Decimal128.fromString("50.00000000"), // 50 L
      },
      {
        sku: "PROD-MET-004",
        name: "Methanol",
        description: "High-purity methanol liquid for chromatography.",
        category: "Solvents",
        baseUnit: "mL",
        basePrice: mongoose.Types.Decimal128.fromString("0.80000000"),
        stockQuantity: mongoose.Types.Decimal128.fromString("25000.00000000"), // 25 L in mL
      },
      {
        sku: "PROD-VIA-005",
        name: "Lab Test Vials (10ml)",
        description: "Borosilicate glass vials, pack of items.",
        category: "Consumables",
        baseUnit: "items",
        basePrice: mongoose.Types.Decimal128.fromString("12.00000000"),
        stockQuantity: mongoose.Types.Decimal128.fromString("1500.00000000"), // 1500 items
      },
    ];

    for (const p of products) {
      await Product.create(p);
    }
    console.log("Seeded default products successfully.");

    console.log("Database seeding completed.");
  } catch (error) {
    console.error("Database seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
