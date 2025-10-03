import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, gte, lte, ilike } from "drizzle-orm";
import { users, categories, products, orders, orderItems } from "../shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Product methods
  getProducts(filters?: { categoryId?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Order methods
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Order item methods
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
}

export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sql = postgres(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result.length === 0) return undefined;
    const user = result[0];
    return {
      ...user,
      createdAt: user.createdAt ?? null,
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await this.db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role || "user",
    }).returning();
    return result[0];
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    const result = await this.db.select().from(categories);
    return result.map((category) => ({
      ...category,
      description: category.description === undefined ? null : category.description,
      icon: category.icon === undefined ? null : category.icon,
      createdAt: category.createdAt ?? null,
    })) as unknown as Category[];
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0] as unknown as Category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await this.db.insert(categories).values({
      ...category,
      description: category.description ?? null,
      icon: category.icon ?? null,
    }).returning();
    return result[0] as Category;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await this.db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result[0] as unknown as Category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    return true; // postgres-js doesn't provide rowCount, assume success if no error
  }

  // Product methods
  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number
  }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.description, `%${filters.search}%`)
      ) as any);
    }

    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }

    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }

    const result = await this.db.select().from(products).where(and(...conditions));
    return result as unknown as Product[];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0] as unknown as Product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await this.db.insert(products).values({
      ...product,
      description: product.description ?? null,
      categoryId: product.categoryId ?? null,
      stock: product.stock ?? 0,
      rating: "0.0",
      reviewCount: 0,
      isActive: true,
    }).returning();
    return result[0] as Product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0] as unknown as Product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.db.delete(products).where(eq(products.id, id));
    return true; // postgres-js doesn't provide rowCount, assume success if no error
  }

  // Order methods
  async getOrders(userId?: string): Promise<Order[]> {
    const baseQuery = this.db.select().from(orders);
    if (userId) {
      const result = await baseQuery.where(eq(orders.userId, userId)).orderBy(orders.createdAt);
      return result as unknown as Order[];
    } else {
      const result = await baseQuery.orderBy(orders.createdAt);
      return result as unknown as Order[];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0] as unknown as Order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const result = await this.db.insert(orders).values({
      ...order,
      status: order.status ?? "pending",
      customerEmail: order.customerEmail ?? null,
    }).returning();
    return result[0] as Order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await this.db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0] as unknown as Order;
  }

  // Order item methods
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const result = await this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return result as unknown as OrderItem[];
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await this.db.insert(orderItems).values(orderItem).returning();
    return result[0];
  }
}

// Always use database storage
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Please set it in your .env file.");
}
export const storage = new DbStorage();
