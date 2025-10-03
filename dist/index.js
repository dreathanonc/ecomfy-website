// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, gte, lte, ilike } from "drizzle-orm";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("fas fa-box"),
  createdAt: timestamp("created_at").defaultNow()
});
var products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  stock: integer("stock").notNull().default(0),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0.0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  // "pending", "processing", "shipped", "delivered", "cancelled"
  customerEmail: text("customer_email"),
  createdAt: timestamp("created_at").defaultNow()
});
var orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// server/storage.ts
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
var DbStorage = class {
  db;
  constructor() {
    const sql2 = postgres(process.env.DATABASE_URL);
    this.db = drizzle(sql2);
  }
  // User methods
  async getUser(id) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    if (result.length === 0) return void 0;
    const user = result[0];
    return {
      ...user,
      createdAt: user.createdAt ?? null
    };
  }
  async getUserByEmail(email) {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await this.db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role || "user"
    }).returning();
    return result[0];
  }
  // Category methods
  async getCategories() {
    const result = await this.db.select().from(categories);
    return result.map((category) => ({
      ...category,
      description: category.description === void 0 ? null : category.description,
      icon: category.icon === void 0 ? null : category.icon,
      createdAt: category.createdAt ?? null
    }));
  }
  async getCategory(id) {
    const result = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }
  async createCategory(category) {
    const result = await this.db.insert(categories).values({
      ...category,
      description: category.description ?? null,
      icon: category.icon ?? null
    }).returning();
    return result[0];
  }
  async updateCategory(id, category) {
    const result = await this.db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result[0];
  }
  async deleteCategory(id) {
    const result = await this.db.delete(categories).where(eq(categories.id, id));
    return true;
  }
  // Product methods
  async getProducts(filters) {
    const conditions = [eq(products.isActive, true)];
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.search) {
      conditions.push(or(
        ilike(products.name, `%${filters.search}%`),
        ilike(products.description, `%${filters.search}%`)
      ));
    }
    if (filters?.minPrice !== void 0) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }
    if (filters?.maxPrice !== void 0) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }
    const result = await this.db.select().from(products).where(and(...conditions));
    return result;
  }
  async getProduct(id) {
    const result = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }
  async createProduct(product) {
    const result = await this.db.insert(products).values({
      ...product,
      description: product.description ?? null,
      categoryId: product.categoryId ?? null,
      stock: product.stock ?? 0,
      rating: "0.0",
      reviewCount: 0,
      isActive: true
    }).returning();
    return result[0];
  }
  async updateProduct(id, product) {
    const result = await this.db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }
  async deleteProduct(id) {
    const result = await this.db.delete(products).where(eq(products.id, id));
    return true;
  }
  // Order methods
  async getOrders(userId) {
    const baseQuery = this.db.select().from(orders);
    if (userId) {
      const result = await baseQuery.where(eq(orders.userId, userId)).orderBy(orders.createdAt);
      return result;
    } else {
      const result = await baseQuery.orderBy(orders.createdAt);
      return result;
    }
  }
  async getOrder(id) {
    const result = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }
  async createOrder(order) {
    const result = await this.db.insert(orders).values({
      ...order,
      status: order.status ?? "pending",
      customerEmail: order.customerEmail ?? null
    }).returning();
    return result[0];
  }
  async updateOrderStatus(id, status) {
    const result = await this.db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }
  // Order item methods
  async getOrderItems(orderId) {
    const result = await this.db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return result;
  }
  async createOrderItem(orderItem) {
    const result = await this.db.insert(orderItems).values(orderItem).returning();
    return result[0];
  }
};
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Please set it in your .env file.");
}
var storage = new DbStorage();

// server/routes.ts
import bcrypt2 from "bcryptjs";
import jwt from "jsonwebtoken";
import { z as z2 } from "zod";
import multer from "multer";
import path2 from "path";
import fs from "fs";
var upload = multer({
  dest: path2.join(process.cwd(), "uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }
  // 5MB max file size
});
var JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
var authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
function ensureUploadsDir() {
  const uploadsDir = path2.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
}
function registerUploadRoutes(app2) {
  ensureUploadsDir();
  app2.post(
    "/api/upload",
    authenticateToken,
    upload.single("image"),
    (req, res) => {
      console.log("Upload request received");
      console.log("File:", req.file);
      console.log("User:", req.user);
      if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      console.log("File uploaded successfully:", filePath);
      res.json({ filePath });
    }
  );
}
var requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
async function registerRoutes(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role || "user"
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for email:", req.body.email);
      const data = loginSchema.parse(req.body);
      console.log("Parsed login data:", { email: data.email });
      const user = await storage.getUserByEmail(data.email);
      console.log("User found:", user ? "yes" : "no");
      if (!user) {
        console.log("User not found for email:", data.email);
        return res.status(400).json({ message: "Invalid credentials" });
      }
      console.log("Comparing passwords...");
      const isValidPassword = await bcrypt2.compare(data.password, user.password);
      console.log("Password valid:", isValidPassword);
      if (!isValidPassword) {
        console.log("Invalid password for user:", data.email);
        return res.status(400).json({ message: "Invalid credentials" });
      }
      console.log("Signing JWT...");
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      console.log("JWT signed successfully");
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  });
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getCategories();
      res.json(categories2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, minPrice, maxPrice } = req.query;
      const filters = {};
      if (categoryId) filters.categoryId = categoryId;
      if (search) filters.search = search;
      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      const products2 = await storage.getProducts(filters);
      res.json(products2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      console.log(`Attempting to delete product with ID: ${req.params.id}`);
      const success = await storage.deleteProduct(req.params.id);
      console.log(`Delete result: ${success}`);
      if (!success) {
        console.log(`Product not found: ${req.params.id}`);
        return res.status(404).json({ message: "Product not found" });
      }
      console.log(`Product deleted successfully: ${req.params.id}`);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error(`Error deleting product: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.role === "admin" ? void 0 : req.user.id;
      const orders2 = await storage.getOrders(userId);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { items, totalPrice } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }
      const order = await storage.createOrder({
        userId: req.user.id,
        totalPrice: totalPrice.toString(),
        status: "pending",
        customerEmail: req.user.email
      });
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString()
        });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.put("/api/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import { fileURLToPath } from "url";
var __dirname = path3.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path3.resolve(__dirname, "client", "src"),
      "@shared": path3.resolve(__dirname, "shared"),
      "@assets": path3.resolve(__dirname, "attached_assets")
    }
  },
  root: path3.resolve(__dirname, "client"),
  build: {
    outDir: path3.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2 = path4.dirname(fileURLToPath2(import.meta.url));
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path5 from "path";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static(path5.join(process.cwd(), "uploads")));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  registerUploadRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
