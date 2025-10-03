import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  loginSchema,
  registerSchema,
  insertProductSchema,
  insertCategorySchema,
  type User
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  dest: path.join(process.cwd(), "uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
});

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: User;
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
}

export function registerUploadRoutes(app: Express) {
  ensureUploadsDir();

  // Upload product image endpoint
  app.post(
    "/api/upload",
    authenticateToken,
    upload.single("image"),
    (req: AuthRequest, res: Response) => {
      console.log('Upload request received');
      console.log('File:', req.file);
      console.log('User:', req.user);

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Return the file path or URL to the client
      const filePath = `/uploads/${req.file.filename}`;
      console.log('File uploaded successfully:', filePath);
      res.json({ filePath });
    }
  );
}

// Middleware to check admin role
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
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
        role: data.role || "user",
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
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
      const isValidPassword = await bcrypt.compare(data.password, user.password);
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ 
      user: { 
        id: req.user!.id, 
        username: req.user!.username, 
        email: req.user!.email, 
        role: req.user!.role 
      } 
    });
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, minPrice, maxPrice } = req.query;
      
      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId as string;
      if (search) filters.search = search as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
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

  app.post("/api/products", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const data = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
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

  // Order routes
  app.get("/api/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.role === 'admin' ? undefined : req.user!.id;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { items, totalPrice } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }

      const order = await storage.createOrder({
        userId: req.user!.id,
        totalPrice: totalPrice.toString(),
        status: "pending",
        customerEmail: req.user!.email,
      });

      // Create order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
        });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
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



  const httpServer = createServer(app);
  return httpServer;
}
