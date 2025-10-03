import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, categories, products, orders, orderItems } from "../shared/schema";
import { eq, ne } from "drizzle-orm";

async function clearDummyData() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("🧹 Clearing dummy data from database...");

  try {
    // Clear all products (dummy data)
    await db.delete(products);
    console.log("✅ All products cleared");

    // Clear all categories (dummy data)
    await db.delete(categories);
    console.log("✅ All categories cleared");

    // Clear all orders and order items (dummy data)
    await db.delete(orderItems);
    await db.delete(orders);
    console.log("✅ All orders and order items cleared");

    // Keep only the admin user, remove any other dummy users
    await db.delete(users).where(ne(users.email, "admin@ecomfy.com"));
    console.log("✅ Dummy users cleared (kept admin user)");

    console.log("🎉 Database cleared of dummy data!");
    console.log("\n📋 Admin Account:");
    console.log("Username: admin");
    console.log("Email: admin@ecomfy.com");
    console.log("Password: admin123");

  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await client.end();
  }
}

clearDummyData().catch(console.error);
