import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, categories, products } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

dotenv.config();

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🌱 Checking and seeding database...");

  // Check if admin user already exists
  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@ecomfy.com")).limit(1);

  if (existingAdmin.length === 0) {
    // Create admin user
    const adminId = randomUUID();
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await db.insert(users).values({
      id: adminId,
      username: "admin",
      email: "admin@ecomfy.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin user created");
  } else {
    console.log("ℹ️ Admin user already exists, skipping...");
  }

  // Check if categories already exist
  const existingCategories = await db.select().from(categories);

  if (existingCategories.length === 0) {
    // Create categories
    const categoriesData = [
      {
        id: randomUUID(),
        name: "Electronics",
        description: "Tech gadgets and devices",
        icon: "fas fa-laptop",
      },
      {
        id: randomUUID(),
        name: "Fashion",
        description: "Clothing and accessories",
        icon: "fas fa-tshirt",
      },
      {
        id: randomUUID(),
        name: "Home & Garden",
        description: "Home improvement and decor",
        icon: "fas fa-home",
      },
      {
        id: randomUUID(),
        name: "Sports",
        description: "Sports and fitness equipment",
        icon: "fas fa-dumbbell",
      },
    ];

    await db.insert(categories).values(categoriesData);
    console.log("✅ Categories created");
  } else {
    console.log("ℹ️ Categories already exist, skipping...");
  }

  // Check if products already exist
  const existingProducts = await db.select().from(products);

  if (existingProducts.length === 0) {
    // Get categories for product creation
    const categoryList = await db.select().from(categories);

    if (categoryList.length > 0) {
      // Create products
      const productsData = [
        {
          id: randomUUID(),
          name: "MacBook Pro 16\"",
          description: "Powerful laptop for professionals",
          price: "2499.00",
          image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 45,
          rating: "4.8",
          reviewCount: 124,
        },
        {
          id: randomUUID(),
          name: "Premium Headphones",
          description: "Noise-cancelling wireless audio",
          price: "299.00",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 78,
          rating: "4.6",
          reviewCount: 89,
        },
        {
          id: randomUUID(),
          name: "Smart Watch",
          description: "Fitness tracking and notifications",
          price: "399.00",
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 32,
          rating: "4.5",
          reviewCount: 156,
        },
        {
          id: randomUUID(),
          name: "Digital Camera",
          description: "Professional photography equipment",
          price: "899.00",
          image: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 15,
          rating: "4.9",
          reviewCount: 67,
        },
        {
          id: randomUUID(),
          name: "iPhone 14 Pro",
          description: "Latest smartphone with advanced camera system",
          price: "999.00",
          image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 23,
          rating: "4.8",
          reviewCount: 203,
        },
        {
          id: randomUUID(),
          name: "RGB Gaming Keyboard",
          description: "Mechanical switches with customizable RGB lighting",
          price: "149.00",
          image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 56,
          rating: "4.2",
          reviewCount: 91,
        },
        {
          id: randomUUID(),
          name: "Designer Sunglasses",
          description: "Premium UV protection with stylish frame",
          price: "199.00",
          image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[1].id,
          stock: 34,
          rating: "5.0",
          reviewCount: 12,
        },
        {
          id: randomUUID(),
          name: "Wireless Speaker",
          description: "Portable Bluetooth speaker with rich bass",
          price: "79.00",
          image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 67,
          rating: "4.3",
          reviewCount: 145,
        },
        {
          id: randomUUID(),
          name: "Fitness Tracker",
          description: "24/7 health monitoring with GPS",
          price: "129.00",
          image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[3].id,
          stock: 89,
          rating: "4.7",
          reviewCount: 234,
        },
        {
          id: randomUUID(),
          name: "Camera Drone",
          description: "4K aerial photography with stabilization",
          price: "599.00",
          image: "https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
          categoryId: categoryList[0].id,
          stock: 12,
          rating: "4.1",
          reviewCount: 45,
        },
      ];

      await db.insert(products).values(productsData);
      console.log("✅ Products created");
    } else {
      console.log("⚠️ No categories found, skipping product creation");
    }
  } else {
    console.log("ℹ️ Products already exist, skipping...");
  }

  console.log("🎉 Database seeding check completed!");
  console.log("\n📋 Admin Account (if created):");
  console.log("Username: admin");
  console.log("Email: admin@ecomfy.com");
  console.log("Password: admin123");

  await client.end();
}

seed().catch(console.error);
