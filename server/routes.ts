import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertContactMessageSchema, 
  insertCartSchema, 
  insertCartItemSchema,
  insertUserSchema,
  insertInventorySchema,
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertShippingSchema,
  insertFavoriteSchema,
  insertPromoCodeSchema
} from "@shared/schema";
import { setupAuth, ensureAuthenticated, ensureAdmin, hashPassword } from "./auth";
import { generatePasswordResetToken, sendPasswordResetEmail } from "./email";
import { z } from "zod";
import { WebSocketServer, WebSocket } from 'ws';

import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);
  
  // User Orders API
  app.get("/api/user/orders", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (err) {
      console.error("Error fetching user orders:", err);
      res.status(500).json({ message: "שגיאה בטעינת ההזמנות" });
    }
  });
  
  app.get("/api/user/orders/:id", ensureAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "מזהה הזמנה לא תקין" });
      }
      
      const order = await storage.getOrderWithShippingDetails(orderId);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      // Make sure the user owns this order
      if (order.userId !== req.user!.id) {
        return res.status(403).json({ message: "אין לך הרשאה לצפות בהזמנה זו" });
      }
      
      res.json(order);
    } catch (err) {
      console.error("Error fetching order details:", err);
      res.status(500).json({ message: "שגיאה בטעינת פרטי ההזמנה" });
    }
  });
  
  // Admin routes for user management
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "שגיאה בטעינת משתמשים" });
    }
  });
  
  app.post("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "שם משתמש כבר קיים במערכת" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "נתוני משתמש לא תקינים", errors: err.errors });
      }
      console.error("Error creating user:", err);
      res.status(500).json({ message: "שגיאה ביצירת משתמש" });
    }
  });
  
  app.get("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משתמש לא תקין" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "שגיאה בטעינת משתמש" });
    }
  });
  
  app.patch("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משתמש לא תקין" });
      }
      
      // Check if the user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      // Update the user
      const user = await storage.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "שגיאה בעדכון משתמש" });
    }
  });
  
  // Password reset endpoint
  app.patch("/api/admin/users/:id/reset-password", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משתמש לא תקין" });
      }
      
      const { password } = req.body;
      if (!password || typeof password !== 'string' || password.trim() === '') {
        return res.status(400).json({ message: "סיסמה חדשה נדרשת" });
      }
      
      // Check if the user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Update the user's password
      const user = await storage.updateUser(id, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json({ success: true, message: "סיסמה עודכנה בהצלחה" });
    } catch (err) {
      console.error("Error resetting password:", err);
      res.status(500).json({ message: "שגיאה באיפוס סיסמה" });
    }
  });
  
  app.delete("/api/admin/users/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משתמש לא תקין" });
      }
      
      // Add extra validation to prevent deleting the last admin user
      const users = await storage.getUsers();
      const admins = users.filter(user => user.role === "admin");
      
      const userToDelete = users.find(user => user.id === id);
      if (!userToDelete) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      // Don't allow deleting the last admin
      if (userToDelete.role === "admin" && admins.length <= 1) {
        return res.status(400).json({ 
          message: "לא ניתן למחוק את מנהל המערכת האחרון" 
        });
      }
      
      // Delete the user
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "שגיאה במחיקת משתמש" });
    }
  });
  
  // Admin routes for inventory management
  app.get("/api/admin/inventory", ensureAdmin, async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      res.status(500).json({ message: "שגיאה בטעינת המלאי" });
    }
  });
  
  app.get("/api/admin/inventory/:productId", ensureAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      const inventoryItem = await storage.getInventoryByProductId(productId);
      if (!inventoryItem) {
        return res.status(404).json({ message: "פריט מלאי לא נמצא" });
      }
      
      res.json(inventoryItem);
    } catch (err) {
      console.error("Error fetching inventory item:", err);
      res.status(500).json({ message: "שגיאה בטעינת פריט המלאי" });
    }
  });
  
  app.post("/api/admin/inventory", ensureAdmin, async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      const inventory = await storage.createInventory(inventoryData);
      res.status(201).json(inventory);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "נתוני מלאי לא תקינים", errors: err.errors });
      }
      console.error("Error creating inventory item:", err);
      res.status(500).json({ message: "שגיאה ביצירת פריט מלאי" });
    }
  });
  
  app.patch("/api/admin/inventory/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה מלאי לא תקין" });
      }
      
      const inventory = await storage.updateInventory(id, req.body);
      if (!inventory) {
        return res.status(404).json({ message: "פריט מלאי לא נמצא" });
      }
      
      // Update product stock status
      await storage.updateProductStock(inventory.productId, inventory.quantity);
      
      res.json(inventory);
    } catch (err) {
      console.error("Error updating inventory:", err);
      res.status(500).json({ message: "שגיאה בעדכון פריט מלאי" });
    }
  });
  
  app.patch("/api/admin/inventory/product/:productId/stock", ensureAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: "כמות לא תקינה" });
      }
      
      const success = await storage.updateProductStock(productId, quantity);
      if (!success) {
        return res.status(404).json({ message: "מוצר לא נמצא" });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error updating stock:", err);
      res.status(500).json({ message: "שגיאה בעדכון המלאי" });
    }
  });
  
  // Admin routes for products management
  app.post("/api/products", ensureAdmin, async (req, res) => {
    try {
      console.log("Creating product with data:", req.body);
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.log("Validation error:", err.errors);
        return res.status(400).json({ message: "נתוני מוצר לא תקינים", errors: err.errors });
      }
      console.error("Error creating product:", err);
      res.status(500).json({ message: "שגיאה ביצירת מוצר" });
    }
  });
  
  app.patch("/api/products/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      const product = await storage.updateProduct(id, req.body);
      if (!product) {
        return res.status(404).json({ message: "מוצר לא נמצא" });
      }
      
      res.json(product);
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ message: "שגיאה בעדכון מוצר" });
    }
  });
  
  app.delete("/api/products/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "מוצר לא נמצא" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting product:", err);
      res.status(500).json({ message: "שגיאה במחיקת מוצר" });
    }
  });
  
  // Admin routes for categories management
  app.post("/api/categories", ensureAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "נתוני קטגוריה לא תקינים", errors: err.errors });
      }
      console.error("Error creating category:", err);
      res.status(500).json({ message: "שגיאה ביצירת קטגוריה" });
    }
  });
  
  app.patch("/api/categories/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה קטגוריה לא תקין" });
      }
      
      const category = await storage.updateCategory(id, req.body);
      if (!category) {
        return res.status(404).json({ message: "קטגוריה לא נמצאה" });
      }
      
      res.json(category);
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ message: "שגיאה בעדכון קטגוריה" });
    }
  });
  
  app.delete("/api/categories/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה קטגוריה לא תקין" });
      }
      
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "קטגוריה לא נמצאה" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting category:", err);
      res.status(500).json({ message: "שגיאה במחיקת קטגוריה" });
    }
  });
  
  // All public routes below
  // prefix all routes with /api

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (err) {
      console.error("Error fetching featured products:", err);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });
  
  app.get("/api/products/new", async (req, res) => {
    try {
      const products = await storage.getNewProducts();
      res.json(products);
    } catch (err) {
      console.error("Error fetching new products:", err);
      res.status(500).json({ message: "Failed to fetch new products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (err) {
      console.error("Error fetching product:", err);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const category = await storage.getCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (err) {
      console.error("Error fetching category:", err);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  
  app.get("/api/categories/:slug/products", async (req, res) => {
    try {
      const { slug } = req.params;
      const products = await storage.getProductsByCategory(slug);
      res.json(products);
    } catch (err) {
      console.error("Error fetching products by category:", err);
      res.status(500).json({ message: "Failed to fetch category products" });
    }
  });
  
  // Cart routes
  app.post("/api/cart", async (req, res) => {
    try {
      const cartData = insertCartSchema.parse(req.body);
      const cart = await storage.createCart(cartData);
      res.status(201).json(cart);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart data", errors: err.errors });
      }
      console.error("Error creating cart:", err);
      res.status(500).json({ message: "Failed to create cart" });
    }
  });
  
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      let cart = await storage.getCartBySessionId(sessionId);
      
      if (!cart) {
        // Create a new cart for this session
        cart = await storage.createCart({ sessionId });
      }
      
      const items = await storage.getCartItems(cart.id);
      
      res.json({
        cart,
        items
      });
    } catch (err) {
      console.error("Error fetching cart:", err);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });
  
  app.post("/api/cart/:cartId/items", async (req, res) => {
    try {
      const cartId = parseInt(req.params.cartId);
      if (isNaN(cartId)) {
        return res.status(400).json({ message: "Invalid cart ID" });
      }
      
      const cart = await storage.getCart(cartId);
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
      
      const itemData = insertCartItemSchema.parse({
        ...req.body,
        cartId
      });
      
      // Check if product exists
      const product = await storage.getProduct(itemData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if item already exists in cart
      const existingItems = await storage.getCartItems(cartId);
      const existingItem = existingItems.find(item => item.productId === itemData.productId);
      
      if (existingItem) {
        // Update quantity instead of creating new item
        const updatedItem = await storage.updateCartItem(
          existingItem.id, 
          existingItem.quantity + (itemData.quantity || 1)
        );
        return res.json(updatedItem);
      }
      
      const newItem = await storage.createCartItem(itemData);
      res.status(201).json(newItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: err.errors });
      }
      console.error("Error adding item to cart:", err);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });
  
  app.patch("/api/cart/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const updatedItem = await storage.updateCartItem(itemId, quantity);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(updatedItem);
    } catch (err) {
      console.error("Error updating cart item:", err);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });
  
  app.delete("/api/cart/items/:itemId", async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }
      
      const success = await storage.deleteCartItem(itemId);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error removing cart item:", err);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });
  
  // Contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.status(201).json({
        success: true,
        message: "Your message has been sent successfully",
        id: message.id
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact form data", errors: err.errors });
      }
      console.error("Error submitting contact form:", err);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });
  
  // Orders management routes
  app.get("/api/admin/orders", ensureAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      res.status(500).json({ message: "שגיאה בטעינת ההזמנות" });
    }
  });
  
  // Get orders by day for the past month (for admin dashboard chart)
  app.get("/api/admin/orders/stats/by-day", ensureAdmin, async (req, res) => {
    try {
      const ordersByDay = await storage.getOrdersByDay();
      res.json(ordersByDay);
    } catch (err) {
      console.error("Error fetching orders by day stats:", err);
      res.status(500).json({ message: "שגיאה בטעינת סטטיסטיקות הזמנות" });
    }
  });
  
  app.get("/api/admin/orders/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה הזמנה לא תקין" });
      }
      
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      res.json(order);
    } catch (err) {
      console.error("Error fetching order:", err);
      res.status(500).json({ message: "שגיאה בטעינת ההזמנה" });
    }
  });
  
  app.get("/api/admin/orders/number/:orderNumber", ensureAdmin, async (req, res) => {
    try {
      const { orderNumber } = req.params;
      
      const order = await storage.getOrderByNumber(orderNumber);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      res.json(order);
    } catch (err) {
      console.error("Error fetching order by number:", err);
      res.status(500).json({ message: "שגיאה בטעינת ההזמנה" });
    }
  });
  
  app.post("/api/admin/orders", ensureAdmin, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "נתוני הזמנה לא תקינים", errors: err.errors });
      }
      console.error("Error creating order:", err);
      res.status(500).json({ message: "שגיאה ביצירת הזמנה" });
    }
  });
  
  app.patch("/api/admin/orders/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה הזמנה לא תקין" });
      }
      
      const order = await storage.updateOrder(id, req.body);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      res.json(order);
    } catch (err) {
      console.error("Error updating order:", err);
      res.status(500).json({ message: "שגיאה בעדכון ההזמנה" });
    }
  });
  
  app.patch("/api/admin/orders/:id/status", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה הזמנה לא תקין" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "סטטוס הזמנה נדרש" });
      }
      
      // Update the order status
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      // Also update the shipment status to match
      await storage.updateOrderShipmentStatus(id, status);
      
      // Find the associated shipping record by order number
      const shippingRecords = await storage.getShippings();
      const shipping = shippingRecords.find(s => s.orderNumber === order.orderNumber);
      
      // If shipping record exists, update its status too
      if (shipping) {
        await storage.updateShippingStatus(shipping.id, status, {
          location: "מחסן OrMia Jewelry",
          notes: `סטטוס הזמנה עודכן ל-${status}`
        });
      }
      
      // Get the updated order to include all changes
      const updatedOrder = await storage.getOrder(id);
      
      res.json(updatedOrder);
    } catch (err) {
      console.error("Error updating order status:", err);
      res.status(500).json({ message: "שגיאה בעדכון סטטוס ההזמנה" });
    }
  });
  
  app.delete("/api/admin/orders/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה הזמנה לא תקין" });
      }
      
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting order:", err);
      res.status(500).json({ message: "שגיאה במחיקת ההזמנה" });
    }
  });
  
  // Shipping management routes
  app.get("/api/admin/shipping", ensureAdmin, async (req, res) => {
    try {
      const shippings = await storage.getShippings();
      res.json(shippings);
    } catch (err) {
      console.error("Error fetching shipping records:", err);
      res.status(500).json({ message: "שגיאה בטעינת רשומות המשלוחים" });
    }
  });
  
  app.get("/api/admin/shipping/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משלוח לא תקין" });
      }
      
      const shipping = await storage.getShipping(id);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      res.json(shipping);
    } catch (err) {
      console.error("Error fetching shipping record:", err);
      res.status(500).json({ message: "שגיאה בטעינת רשומת המשלוח" });
    }
  });
  
  app.get("/api/admin/shipping/tracking/:trackingNumber", ensureAdmin, async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const shipping = await storage.getShippingByTrackingNumber(trackingNumber);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      res.json(shipping);
    } catch (err) {
      console.error("Error fetching shipping by tracking number:", err);
      res.status(500).json({ message: "שגיאה בטעינת המשלוח" });
    }
  });
  
  app.get("/api/admin/shipping/order/:orderNumber", ensureAdmin, async (req, res) => {
    try {
      const { orderNumber } = req.params;
      
      const shipping = await storage.getShippingByOrderNumber(orderNumber);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      res.json(shipping);
    } catch (err) {
      console.error("Error fetching shipping by order number:", err);
      res.status(500).json({ message: "שגיאה בטעינת המשלוח" });
    }
  });
  
  app.post("/api/admin/shipping", ensureAdmin, async (req, res) => {
    try {
      const shippingData = insertShippingSchema.parse(req.body);
      const shipping = await storage.createShipping(shippingData);
      res.status(201).json(shipping);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "נתוני משלוח לא תקינים", errors: err.errors });
      }
      console.error("Error creating shipping record:", err);
      res.status(500).json({ message: "שגיאה ביצירת רשומת משלוח" });
    }
  });
  
  app.patch("/api/admin/shipping/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משלוח לא תקין" });
      }
      
      const shipping = await storage.updateShipping(id, req.body);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      res.json(shipping);
    } catch (err) {
      console.error("Error updating shipping record:", err);
      res.status(500).json({ message: "שגיאה בעדכון רשומת המשלוח" });
    }
  });
  
  app.patch("/api/admin/shipping/:id/status", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משלוח לא תקין" });
      }
      
      const { status, location, notes } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "סטטוס משלוח נדרש" });
      }
      
      if (!location || typeof location !== 'string') {
        return res.status(400).json({ message: "מיקום משלוח נדרש" });
      }
      
      const locationInfo = {
        location,
        notes: notes || undefined
      };
      
      // Get the shipping record first to get order info
      const existingShipping = await storage.getShipping(id);
      if (!existingShipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      // Update shipping status
      const shipping = await storage.updateShippingStatus(id, status, locationInfo);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      // Find the corresponding order by order number (stored in shipping record)
      if (shipping.orderNumber) {
        const order = await storage.getOrderByNumber(shipping.orderNumber);
        if (order) {
          // Update the order's shipment status to match the shipping status
          await storage.updateOrderShipmentStatus(order.id, status);
          
          // If shipment status is "delivered", also update order status to "completed"
          if (status === "delivered") {
            await storage.updateOrderStatus(order.id, "completed");
          }
          // If shipment status is "cancelled", also update order status to "cancelled"
          else if (status === "cancelled") {
            await storage.updateOrderStatus(order.id, "cancelled");
          }
        }
      }
      
      res.json(shipping);
    } catch (err) {
      console.error("Error updating shipping status:", err);
      res.status(500).json({ message: "שגיאה בעדכון סטטוס המשלוח" });
    }
  });
  
  app.delete("/api/admin/shipping/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "מזהה משלוח לא תקין" });
      }
      
      const success = await storage.deleteShipping(id);
      if (!success) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting shipping record:", err);
      res.status(500).json({ message: "שגיאה במחיקת רשומת המשלוח" });
    }
  });
  
  // Public API to track shipment
  app.get("/api/tracking/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      
      const shipping = await storage.getShippingByTrackingNumber(trackingNumber);
      if (!shipping) {
        return res.status(404).json({ message: "מספר מעקב לא נמצא" });
      }
      
      // Return a limited view for public API
      res.json({
        trackingNumber: shipping.trackingNumber,
        status: shipping.status,
        estimatedDelivery: shipping.estimatedDelivery,
        history: shipping.history
      });
    } catch (err) {
      console.error("Error tracking shipment:", err);
      res.status(500).json({ message: "שגיאה בטעינת פרטי המשלוח" });
    }
  });

  // User profile routes
  app.get("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      // req.user is already available from passport
      res.json(req.user);
    } catch (err) {
      console.error("Error fetching profile:", err);
      res.status(500).json({ message: "שגיאה בטעינת פרופיל המשתמש" });
    }
  });

  // User profile routes
  app.patch("/api/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const allowedFields = ["firstName", "lastName", "email", "phone", "profileImage",
                           "address", "apartment", "city", "postalCode", "country"];
      
      // Filter out non-allowed fields
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );
      
      // Validate email if present
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        return res.status(400).json({ message: "כתובת אימייל לא תקינה" });
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "שגיאה בעדכון פרופיל המשתמש" });
    }
  });
  
  // Alias for frontend compatibility
  app.patch("/api/user/profile", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const allowedFields = ["firstName", "lastName", "email", "phone", "profileImage", 
                           "address", "apartment", "city", "postalCode", "country"];
      
      // Filter out non-allowed fields
      const updateData = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
      );
      
      // Validate email if present
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        return res.status(400).json({ message: "כתובת אימייל לא תקינה" });
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      console.error("Error updating profile:", err);
      res.status(500).json({ message: "שגיאה בעדכון פרופיל המשתמש" });
    }
  });

  app.patch("/api/profile/password", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "סיסמה נוכחית וסיסמה חדשה נדרשות" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים" });
      }
      
      // Verify current password
      const isValid = await storage.validateUserLogin(req.user.username, currentPassword);
      if (!isValid) {
        return res.status(400).json({ message: "סיסמה נוכחית שגויה" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      const user = await storage.updateUser(userId, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json({ success: true, message: "סיסמה עודכנה בהצלחה" });
    } catch (err) {
      console.error("Error updating password:", err);
      res.status(500).json({ message: "שגיאה בעדכון סיסמה" });
    }
  });
  
  // Alias for frontend compatibility
  app.patch("/api/user/password", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "סיסמה נוכחית וסיסמה חדשה נדרשות" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים" });
      }
      
      // Verify current password
      const isValid = await storage.validateUserLogin(req.user.username, currentPassword);
      if (!isValid) {
        return res.status(400).json({ message: "סיסמה נוכחית שגויה" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the user's password
      const user = await storage.updateUser(userId, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: "משתמש לא נמצא" });
      }
      
      res.json({ success: true, message: "סיסמה עודכנה בהצלחה" });
    } catch (err) {
      console.error("Error updating password:", err);
      res.status(500).json({ message: "שגיאה בעדכון סיסמה" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      res.status(500).json({ message: "שגיאה בטעינת מוצרים מועדפים" });
    }
  });

  app.post("/api/favorites", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.body;
      
      console.log("Adding favorite - Request body:", req.body);
      console.log("Product ID type:", typeof productId);
      
      if (!productId) {
        console.log("Product ID missing");
        return res.status(400).json({ message: "מזהה מוצר נדרש" });
      }
      
      // Convert to number if it's a string
      const productIdNum = typeof productId === 'string' ? parseInt(productId) : productId;
      
      if (isNaN(productIdNum)) {
        console.log("Product ID is not a valid number");
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      // Check if product exists
      const product = await storage.getProduct(productIdNum);
      console.log("Product exists:", !!product);
      
      if (!product) {
        return res.status(404).json({ message: "מוצר לא נמצא" });
      }
      
      // Check if already in favorites
      const existing = await storage.getFavoriteByUserAndProduct(userId, productIdNum);
      console.log("Already in favorites:", !!existing);
      
      if (existing) {
        return res.status(409).json({ message: "המוצר כבר במועדפים" });
      }
      
      const favoriteData = insertFavoriteSchema.parse({
        userId,
        productId: productIdNum
      });
      
      console.log("Creating favorite with data:", favoriteData);
      const favorite = await storage.createFavorite(favoriteData);
      console.log("Favorite created:", favorite);
      
      res.status(201).json(favorite);
    } catch (err) {
      console.error("Error adding favorite:", err);
      res.status(500).json({ message: "שגיאה בהוספת מוצר למועדפים" });
    }
  });

  app.delete("/api/favorites/:productId", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "מזהה מוצר לא תקין" });
      }
      
      const success = await storage.deleteUserProductFavorite(userId, productId);
      if (!success) {
        return res.status(404).json({ message: "מוצר לא נמצא במועדפים" });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error("Error removing favorite:", err);
      res.status(500).json({ message: "שגיאה בהסרת מוצר מהמועדפים" });
    }
  });
  
  // Checkout API endpoint - works for both guest and authenticated users
  app.post("/api/checkout", async (req, res) => {
    try {
      // Get user ID if authenticated, or null for guest checkout
      const userId = req.isAuthenticated() ? req.user?.id : null;
      
      const { 
        items, 
        email,
        shippingAddress, 
        billingAddress,
        paymentMethod,
        shippingMethod,
        subtotal,
        total,
        shippingCost,
        tax,
        discount,
        promoCode,
        createAccount,
        password
      } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "אין פריטים בסל הקניות" });
      }
      
      if (!shippingAddress) {
        return res.status(400).json({ message: "כתובת למשלוח נדרשת" });
      }
      
      if (!email) {
        return res.status(400).json({ message: "נדרשת כתובת אימייל" });
      }
      
      // Create a user account if requested by guest
      let orderUserId = userId;
      if (!userId && createAccount && password) {
        try {
          // Check if user with this email already exists
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            return res.status(400).json({ message: "משתמש עם כתובת האימייל הזו כבר קיים" });
          }
          
          // Create the new user
          const hashedPassword = await hashPassword(password);
          const newUser = await storage.createUser({
            email,
            username: email, // Use email as username
            password: hashedPassword,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            role: "customer"
          });
          
          orderUserId = newUser.id;
        } catch (err) {
          console.error("Error creating user account during checkout:", err);
          // Continue with checkout as guest if account creation fails
        }
      }
      
      // Generate a unique order number as a simple numeric value
      const orderNumber = `${Math.floor(Date.now() / 1000)}`;
      
      // Debug the values being passed
      console.log("Checkout values before conversion:", {
        total,
        subtotal,
        shippingCost,
        tax,
        discount,
        itemPrices: items.map(item => ({
          id: item.product.id,
          price: item.product.salePrice || item.product.price,
          salePrice: item.product.salePrice,
          regularPrice: item.product.price
        }))
      });
      
      // Create the order with the enhanced data
      // Convert all money values to integers (cents) for database storage
      const orderData = {
        userId: orderUserId,
        orderNumber,
        status: "new",
        paymentStatus: paymentMethod === 'credit-card' || paymentMethod === 'cash' ? "paid" : "pending",
        shipmentStatus: "new",
        total: Math.round(parseFloat(total) * 100), // Convert to cents, ensure it's a number
        subtotal: Math.round(parseFloat(subtotal) * 100), // Convert to cents, ensure it's a number
        shippingCost: Math.round(parseFloat(shippingCost || 0) * 100), // Convert to cents, ensure it's a number
        tax: Math.round(parseFloat(tax || 0) * 100), // Convert to cents, ensure it's a number
        discount: Math.round(parseFloat(discount || 0) * 100), // Convert to cents, ensure it's a number
        promoCode: promoCode || null,
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: Math.round((item.product.salePrice || item.product.price) * 100), // Convert to cents
          imageUrl: item.product.mainImage
        })),
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        customerEmail: email,
        customerPhone: shippingAddress.phone,
        paymentMethod,
        notes: `שיטת משלוח: ${shippingMethod === 'express' ? 'משלוח מהיר' : 'משלוח רגיל'}`
      };
      
      const order = await storage.createOrder(orderData);
      
      // Create shipping record with simplified tracking number
      const trackingNumber = `${Math.floor(Math.random() * 1000000000)}`;
      
      // Calculate estimated delivery based on shipping method
      // Calculate delivery date as 30 days from order date
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 30); // Always 30 days
      
      const shippingData = {
        orderId: order.id,
        trackingNumber,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: email,
        customerPhone: shippingAddress.phone,
        status: "new",
        address: shippingAddress,
        shippingMethod,
        carrier: "דואר שליחים",
        estimatedDelivery,
        insurance: true,
        history: [{
          status: "new",
          location: "מרכז שילוח",
          timestamp: new Date().toISOString(),
          notes: "ההזמנה התקבלה ומחכה לעיבוד"
        }],
        shippingCost: Math.round(parseFloat(shippingCost || 0) * 100) // Convert to cents, ensure it's a number
      };
      
      const shippingRecord = await storage.createShipping(shippingData);
      
      // Update inventory and product stock levels
      for (const item of items) {
        await storage.updateProductStockAfterOrder(item.product.id, item.quantity);
      }
      
      res.status(201).json({ 
        success: true, 
        order: { 
          ...order, 
          shipping: shippingRecord 
        } 
      });
    } catch (err) {
      console.error("Error processing checkout:", err);
      res.status(500).json({ message: "שגיאה בביצוע ההזמנה" });
    }
  });
  
  // Removed old promo code validation endpoint to avoid route conflicts
  // This has been replaced by the enhanced implementation below that uses the database
  
  // Password reset routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "כתובת אימייל נדרשת" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security reasons, don't reveal that the email doesn't exist
        return res.status(200).json({ message: "אם קיים חשבון עם כתובת האימייל הזו, נשלח אליך קישור לאיפוס סיסמה" });
      }

      // Generate password reset token
      const { token, expires } = generatePasswordResetToken();

      // Save token to database
      await storage.createPasswordResetToken(user.id, token, expires);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, token);

      // In development environment, we'll simulate success even if SendGrid fails
      if (!emailSent && process.env.NODE_ENV === 'development') {
        console.log('Development mode: Password reset flow would continue with token:', token);
        return res.status(200).json({ 
          message: "אם קיים חשבון עם כתובת האימייל הזו, נשלח אליך קישור לאיפוס סיסמה",
          // Only in development, send the token in the response for testing
          ...(process.env.NODE_ENV === 'development' ? { token } : {})
        });
      }
      
      if (!emailSent) {
        console.error('Failed to send email via SendGrid');
        return res.status(500).json({ error: "שליחת המייל נכשלה, אנא נסה שוב מאוחר יותר" });
      }

      res.status(200).json({ message: "אם קיים חשבון עם כתובת האימייל הזו, נשלח אליך קישור לאיפוס סיסמה" });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "אירעה שגיאה, אנא נסה שוב מאוחר יותר" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ error: "הטוקן והסיסמה החדשה נדרשים" });
      }

      // Find the token in the database
      const resetToken = await storage.getPasswordResetTokenByToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "הטוקן אינו חוקי או פג תוקף" });
      }

      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "הטוקן פג תוקף, אנא בקש איפוס סיסמה חדש" });
      }

      // Check if token has already been used
      if (resetToken.usedAt) {
        return res.status(400).json({ error: "הטוקן כבר נוצל, אנא בקש איפוס סיסמה חדש" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update the user's password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      res.status(200).json({ message: "הסיסמה עודכנה בהצלחה, כעת תוכל להתחבר עם הסיסמה החדשה" });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "אירעה שגיאה, אנא נסה שוב מאוחר יותר" });
    }
  });

  const httpServer = createServer(app);

  // Debug route for testing favorites manually
  app.get("/api/debug/add-favorite", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.query.productId as string);

      console.log("Debug route - Adding favorite manually");
      console.log("User ID:", userId);
      console.log("Product ID:", productId);

      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      console.log("Product exists:", !!product);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if already in favorites
      const existing = await storage.getFavoriteByUserAndProduct(userId, productId);
      console.log("Already in favorites:", !!existing);
      
      if (existing) {
        return res.status(409).json({ message: "Product already in favorites" });
      }
      
      const favoriteData = insertFavoriteSchema.parse({
        userId,
        productId
      });
      
      console.log("Creating favorite with data:", favoriteData);
      const favorite = await storage.createFavorite(favoriteData);
      console.log("Favorite created:", favorite);
      
      return res.status(201).json(favorite);
    } catch (err) {
      console.error("Debug route error:", err);
      return res.status(500).json({ message: "Error adding favorite", error: String(err) });
    }
  });

  // Admin Promo Code Routes
  app.get("/api/admin/promo-codes", ensureAdmin, async (req, res) => {
    try {
      const promoCodes = await storage.getPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "אירעה שגיאה בטעינת קודי הקופון" });
    }
  });

  app.post("/api/admin/promo-codes", ensureAdmin, async (req, res) => {
    try {
      const promoCodeData = insertPromoCodeSchema.parse({
        ...req.body,
        createdBy: 1, // Using known admin ID 1 instead of req.user.id
      });
      
      // Check if code already exists
      const existingCode = await storage.getPromoCodeByCode(promoCodeData.code);
      if (existingCode) {
        return res.status(409).json({ error: "קוד קופון זה כבר קיים במערכת" });
      }

      const promoCode = await storage.createPromoCode(promoCodeData);
      res.status(201).json(promoCode);
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "נתוני קוד הקופון אינם תקינים", details: error.errors });
      }
      res.status(500).json({ error: "אירעה שגיאה ביצירת קוד הקופון" });
    }
  });

  app.get("/api/admin/promo-codes/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "מזהה קוד קופון לא תקין" });
      }
      
      const promoCode = await storage.getPromoCode(id);
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      res.json(promoCode);
    } catch (error) {
      console.error("Error fetching promo code:", error);
      res.status(500).json({ error: "אירעה שגיאה בטעינת פרטי קוד הקופון" });
    }
  });

  app.patch("/api/admin/promo-codes/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "מזהה קוד קופון לא תקין" });
      }
      
      const promoCode = await storage.getPromoCode(id);
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      const updatedData = req.body;
      
      // If code is being changed, check if the new code already exists
      if (updatedData.code && updatedData.code !== promoCode.code) {
        const existingCode = await storage.getPromoCodeByCode(updatedData.code);
        if (existingCode && existingCode.id !== id) {
          return res.status(409).json({ error: "קוד קופון זה כבר קיים במערכת" });
        }
      }
      
      const updatedPromoCode = await storage.updatePromoCode(id, updatedData);
      res.json(updatedPromoCode);
    } catch (error) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ error: "אירעה שגיאה בעדכון קוד הקופון" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "מזהה קוד קופון לא תקין" });
      }
      
      const promoCode = await storage.getPromoCode(id);
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      await storage.deletePromoCode(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ error: "אירעה שגיאה במחיקת קוד הקופון" });
    }
  });

  app.patch("/api/admin/promo-codes/:id/toggle", ensureAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "מזהה קוד קופון לא תקין" });
      }
      
      const promoCode = await storage.getPromoCode(id);
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      const isActive = req.body.isActive;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: "סטטוס הפעילות חייב להיות מסוג בוליאני" });
      }
      
      await storage.togglePromoCodeActive(id, isActive);
      res.status(200).json({ id, isActive });
    } catch (error) {
      console.error("Error toggling promo code:", error);
      res.status(500).json({ error: "אירעה שגיאה בשינוי סטטוס קוד הקופון" });
    }
  });

  // Customer-facing promo code validation route
  app.post("/api/validate-promo", async (req, res) => {
    try {
      console.log("Validate promo request body:", req.body);
      
      const { code, orderTotal, cartTotal } = req.body;
      
      // Use orderTotal or cartTotal (to support both formats)
      const total = orderTotal || cartTotal || 0;
      
      if (!code) {
        console.log("No code provided in request");
        return res.status(400).json({ valid: false, message: "נדרש קוד קופון" });
      }
      
      console.log(`Validating promo code: ${code}, total amount: ${total}`);
      
      if (typeof total !== 'number' || total < 0) {
        console.log(`Invalid total amount: ${total}, type: ${typeof total}`);
        return res.status(400).json({ valid: false, message: "סכום ההזמנה אינו תקין" });
      }
      
      // Manual check for promo codes due to case issues
      const allPromoCodes = await storage.getPromoCodes();
      console.log("All promo codes:", allPromoCodes.map(p => p.code));
      
      // Find matching promo code with case-insensitive comparison
      const promoCode = allPromoCodes.find(p => 
        p.code.toLowerCase() === code.toLowerCase()
      );
      
      console.log("Found matching promo code:", promoCode || "none");
      
      if (!promoCode) {
        console.log(`Promo code not found: ${code}`);
        return res.status(200).json({ valid: false, message: "קוד קופון לא תקין" });
      }
      
      if (!promoCode.isActive) {
        console.log(`Promo code is inactive: ${code}`);
        return res.status(200).json({ valid: false, message: "קוד הקופון אינו פעיל יותר" });
      }
      
      // Check expiration
      const now = new Date();
      if (promoCode.startDate && new Date(promoCode.startDate) > now) {
        console.log(`Promo code not yet valid: ${code}`);
        return res.status(200).json({ valid: false, message: "קוד קופון עדיין לא תקף" });
      }
      
      if (promoCode.endDate && new Date(promoCode.endDate) < now) {
        console.log(`Promo code expired: ${code}`);
        return res.status(200).json({ valid: false, message: "קוד הקופון פג תוקף" });
      }
      
      // Check if usage limit reached
      if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
        console.log(`Promo code max uses reached: ${code}`);
        return res.status(200).json({ valid: false, message: "קוד הקופון מוצה במלואו" });
      }
      
      // Check minimum order amount
      if (promoCode.minOrderAmount && total < promoCode.minOrderAmount) {
        console.log(`Order total below minimum: ${total} < ${promoCode.minOrderAmount}`);
        return res.status(200).json({ 
          valid: false, 
          message: `קוד הקופון תקף להזמנות מעל ${promoCode.minOrderAmount} ₪`,
          minOrderAmount: promoCode.minOrderAmount 
        });
      }
      
      // Calculate discount based on the original total amount
      // This ensures the discount is applied to the raw subtotal, not after other discounts
      let discountAmount = 0;
      if (promoCode.discountType === 'percentage') {
        // For percentage discounts, apply the percentage to the original total
        discountAmount = Math.round(parseFloat(total) * (promoCode.discountAmount / 100));
        console.log(`Applied percentage discount: ${promoCode.discountAmount}%, amount: ${discountAmount}`);
      } else { // fixed amount
        // For fixed amount discounts, use the fixed value directly
        discountAmount = promoCode.discountAmount;
        console.log(`Applied fixed discount: ${discountAmount}`);
      }
      
      const response = {
        valid: true,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountAmount: discountAmount,
        description: promoCode.description || ""
      };
      
      console.log("Sending successful promo validation response:", response);
      
      res.status(200).json(response);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(200).json({ valid: false, message: "אירעה שגיאה באימות קוד הקופון" });
    }
  });

  app.post("/api/apply-promo-code", async (req, res) => {
    try {
      const { code, orderTotal } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "נדרש קוד קופון" });
      }
      
      const promoCode = await storage.getPromoCodeByCode(code);
      
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא תקין" });
      }
      
      // Increment usage count
      await storage.incrementPromoCodeUsage(promoCode.id);
      
      res.json({ message: "קוד הקופון הופעל בהצלחה" });
    } catch (error) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ error: "אירעה שגיאה בהפעלת קוד הקופון" });
    }
  });

  app.get("/api/reset-redirect", (req, res) => {
    const token = req.query.token;
    if (!token) {
      return res.status(400).send("Missing reset token");
    }
    
    // Send a special HTML page that includes JavaScript to handle the redirect
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
            <div style="text-align: center;">
              <h2>מפנה לדף איפוס הסיסמה...</h2>
              <p>אנא המתן.</p>
              <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #8B7355; border-radius: 50%; margin: 20px auto; animation: spin 1s linear infinite;"></div>
            </div>
          </div>
          
          <style>
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            body {
              direction: rtl;
              margin: 0;
              padding: 0;
              background-color: #f8f8f8;
            }
          </style>
          
          <script>
            // Redirect to the reset password page with the token
            window.location.href = "/reset-password?token=${token}";
          </script>
        </body>
      </html>
    `);
  });
  
  // Promo code APIs
  app.get("/api/admin/promo-codes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const promoCodes = await storage.getPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "שגיאה בטעינת קודי הקופון" });
    }
  });

  app.post("/api/admin/promo-codes", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const promoCodeData = {
        ...req.body,
        createdBy: req.user.id,
        usedCount: 0,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null
      };
      
      // Check if code already exists
      const existingCode = await storage.getPromoCodeByCode(promoCodeData.code);
      if (existingCode) {
        return res.status(400).json({ error: "קוד קופון זה כבר קיים במערכת" });
      }
      
      const newPromoCode = await storage.createPromoCode(promoCodeData);
      res.status(201).json(newPromoCode);
    } catch (error) {
      console.error("Error creating promo code:", error);
      res.status(500).json({ error: "שגיאה ביצירת קוד קופון" });
    }
  });

  app.get("/api/admin/promo-codes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const { id } = req.params;
      const promoCode = await storage.getPromoCode(parseInt(id, 10));
      
      if (!promoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      res.json(promoCode);
    } catch (error) {
      console.error("Error fetching promo code:", error);
      res.status(500).json({ error: "שגיאה בטעינת קוד הקופון" });
    }
  });

  app.patch("/api/admin/promo-codes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const { id } = req.params;
      const promoId = parseInt(id, 10);
      
      // Check if promo code exists
      const existingPromoCode = await storage.getPromoCode(promoId);
      if (!existingPromoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      // Check if code is being changed and if it already exists
      if (req.body.code && req.body.code !== existingPromoCode.code) {
        const codeExists = await storage.getPromoCodeByCode(req.body.code);
        if (codeExists) {
          return res.status(400).json({ error: "קוד קופון זה כבר קיים במערכת" });
        }
      }
      
      const updateData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : existingPromoCode.startDate,
        endDate: req.body.endDate ? new Date(req.body.endDate) : existingPromoCode.endDate
      };
      
      const updatedPromoCode = await storage.updatePromoCode(promoId, updateData);
      res.json(updatedPromoCode);
    } catch (error) {
      console.error("Error updating promo code:", error);
      res.status(500).json({ error: "שגיאה בעדכון קוד הקופון" });
    }
  });

  app.patch("/api/admin/promo-codes/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const promoId = parseInt(id, 10);
      
      // Check if promo code exists
      const existingPromoCode = await storage.getPromoCode(promoId);
      if (!existingPromoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      await storage.togglePromoCodeActive(promoId, isActive);
      
      res.json({ success: true, isActive });
    } catch (error) {
      console.error("Error toggling promo code status:", error);
      res.status(500).json({ error: "שגיאה בשינוי סטטוס קוד הקופון" });
    }
  });

  app.delete("/api/admin/promo-codes/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ error: "גישה נדחתה" });
    }
    
    try {
      const { id } = req.params;
      const promoId = parseInt(id, 10);
      
      // Check if promo code exists
      const existingPromoCode = await storage.getPromoCode(promoId);
      if (!existingPromoCode) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      await storage.deletePromoCode(promoId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting promo code:", error);
      res.status(500).json({ error: "שגיאה במחיקת קוד הקופון" });
    }
  });

  // No duplicate routes needed - removed duplicate

  app.post("/api/apply-promo/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const promoId = parseInt(id, 10);
      
      // Increment usage count
      const success = await storage.incrementPromoCodeUsage(promoId);
      
      if (!success) {
        return res.status(404).json({ error: "קוד קופון לא נמצא" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ error: "שגיאה בהחלת קוד הקופון" });
    }
  });

  // Messaging system API routes
  
  // Get all messages for the current user
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const messages = await storage.getUserMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעות" });
    }
  });

  // Get unread messages count for the current user
  app.get("/api/messages/unread/count", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const messages = await storage.getUnreadUserMessages(req.user.id);
      
      // Log the count for debugging
      console.log(`Unread message count for user ${req.user.id}: ${messages.length}`);
      
      // Force a count of 1 for testing if needed - REMOVE IN PRODUCTION
      // const count = 1;
      
      res.json({ count: messages.length });
    } catch (error) {
      console.error("Error fetching unread messages count:", error);
      res.status(500).json({ error: "שגיאה בטעינת מספר הודעות שלא נקראו" });
    }
  });
  
  // New endpoint: Mark all messages for a specific order as read for a user
  app.post("/api/messages/mark-read-by-order/:orderId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }
      
      // Check if user has permission to mark messages for this order as read
      if (order.userId !== req.user?.id && !req.user?.role?.includes('admin')) {
        return res.status(403).json({ error: "אין הרשאה לסמן הודעות עבור הזמנה זו כנקראו" });
      }
      
      // Use the updated markOrderMessagesAsRead method with isAdmin parameter
      const isAdmin = req.user?.role?.includes('admin') || false;
      const success = await storage.markOrderMessagesAsRead(orderId, isAdmin);
      
      if (success) {
        console.log(`User ${req.user?.id} (isAdmin=${isAdmin}) marked messages as read for order ${orderId}`);
        
        // Broadcast to invalidate caches
        broadcastToOrder(orderId, {
          type: 'messages_read',
          orderId
        });
        
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "שגיאה בסימון הודעות כנקראו" });
      }
    } catch (error) {
      console.error("Error marking order messages as read:", error);
      res.status(500).json({ error: "שגיאה בסימון הודעות כנקראו" });
    }
  });

  // Get a specific message by ID
  app.get("/api/messages/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ error: "הודעה לא נמצאה" });
      }
      
      // Check if the message belongs to the current user
      if (message.userId !== req.user.id && !req.user.role?.includes('admin')) {
        return res.status(403).json({ error: "אין הרשאה לצפות בהודעה זו" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעה" });
    }
  });

  // Create a new message
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const { subject, content, orderId } = req.body;
      
      if (!subject || !content) {
        return res.status(400).json({ error: "נושא ותוכן נדרשים" });
      }
      
      const message = await storage.createMessage({
        userId: req.user.id,
        subject,
        content,
        orderId: orderId ? parseInt(orderId) : null,
        isFromAdmin: req.user.role?.includes('admin') || false,
        isRead: false
      });
      
      // Broadcast the new message to all clients subscribed to this order
      if (orderId) {
        const orderIdNum = parseInt(orderId);
        broadcastToOrder(orderIdNum, {
          type: 'new_message',
          message
        });
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "שגיאה ביצירת הודעה" });
    }
  });

  // Reply to a message
  app.post("/api/messages/:id/reply", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const messageId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "תוכן נדרש" });
      }
      
      const originalMessage = await storage.getMessage(messageId);
      if (!originalMessage) {
        return res.status(404).json({ error: "הודעה לא נמצאה" });
      }
      
      // Check if user has permission to reply
      const isAdmin = req.user.role?.includes('admin');
      if (!isAdmin && originalMessage.userId !== req.user.id) {
        return res.status(403).json({ error: "אין הרשאה להשיב להודעה זו" });
      }
      
      const reply = await storage.replyToMessage(messageId, {
        userId: req.user.id,
        subject: `תגובה: ${originalMessage.subject}`,
        content,
        orderId: originalMessage.orderId,
        isFromAdmin: isAdmin,
        isRead: false
      });
      
      // Broadcast the new message to all clients subscribed to this order
      if (originalMessage.orderId) {
        broadcastToOrder(originalMessage.orderId, {
          type: 'new_message',
          message: reply
        });
      }
      
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error replying to message:", error);
      res.status(500).json({ error: "שגיאה בשליחת תגובה" });
    }
  });

  // Mark a message as read
  app.patch("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ error: "הודעה לא נמצאה" });
      }
      
      // Check if user can mark this message as read
      const isAdmin = req.user.role?.includes('admin');
      if (!isAdmin && message.userId !== req.user.id) {
        return res.status(403).json({ error: "אין הרשאה לסמן הודעה זו כנקראה" });
      }
      
      const success = await storage.markMessageAsRead(messageId);
      
      if (success) {
        // Broadcast read status to all clients subscribed to this order
        if (message.orderId) {
          broadcastToOrder(message.orderId, {
            type: 'message_read',
            messageId
          });
        }
        
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "שגיאה בסימון הודעה כנקראה" });
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "שגיאה בסימון הודעה כנקראה" });
    }
  });

  // Admin routes for messages
  
  // Get all messages for admin viewing with optional user filtering
  app.get("/api/admin/messages", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.role?.includes('admin')) {
      return res.status(403).json({ error: "אין הרשאה" });
    }

    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעות" });
    }
  });
  
  // Get all unread messages (admin only)
  app.get("/api/admin/messages/unread", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.role?.includes('admin')) {
      return res.status(403).json({ error: "אין הרשאה" });
    }

    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const messages = await storage.getUnreadAdminMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching unread admin messages:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעות שלא נקראו" });
    }
  });
  
  // This endpoint was duplicated - removed in favor of the implementation below with ensureAdmin middleware
  
  // Mark all messages as read for a specific order (admin only)
  app.post("/api/admin/messages/markread/:orderId", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.role?.includes('admin')) {
      return res.status(403).json({ error: "אין הרשאה" });
    }

    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "מזהה הזמנה לא תקין" });
      }
      
      // Mark all user messages (non-admin) for this order as read
      const success = await storage.markOrderMessagesAsRead(orderId);
      
      if (success) {
        // Broadcast message read status to all clients
        broadcastToOrder(orderId, {
          type: 'messages_read',
          orderId
        });
        
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "שגיאה בסימון הודעות כנקראות" });
      }
    } catch (error) {
      console.error("Error marking order messages as read:", error);
      res.status(500).json({ error: "שגיאה בסימון הודעות כנקראות" });
    }
  });
  // Get all messages related to an order
  app.get("/api/orders/:orderId/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }
      
      // Check if user has permission to view order messages
      const isAdmin = req.user.role?.includes('admin');
      if (!isAdmin && order.userId !== req.user.id) {
        return res.status(403).json({ error: "אין הרשאה לצפות בהודעות הזמנה זו" });
      }
      
      const messages = await storage.getOrderMessages(orderId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching order messages:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעות הזמנה" });
    }
  });
  
  // Mark all messages for an order as read (for normal users)
  app.post("/api/orders/:orderId/messages/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "לא מחובר" });
    }

    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }
      
      // Check if user has permission to mark messages for this order as read
      if (order.userId !== req.user.id) {
        return res.status(403).json({ error: "אין הרשאה לסמן הודעות עבור הזמנה זו כנקראו" });
      }
      
      // Get unread admin messages for this order
      const unreadMessages = await storage.getOrderMessages(orderId);
      const unreadAdminMessages = unreadMessages.filter(
        msg => msg.isFromAdmin && !msg.isRead
      );
      
      // Mark each unread admin message as read
      for (const message of unreadAdminMessages) {
        await storage.markMessageAsRead(message.id);
      }
      
      console.log(`User ${req.user.id} marked ${unreadAdminMessages.length} messages as read for order ${orderId}`);
      
      // Invalidate unread count cache
      broadcastToOrder(orderId, {
        type: 'messages_read',
        orderId
      });
      
      res.json({ success: true, count: unreadAdminMessages.length });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "שגיאה בסימון הודעות כנקראו" });
    }
  });
  
  // ADMIN: Get all messages related to an order - specifically for admin interface
  app.get("/api/admin/orders/:orderId/messages", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }
      
      const messages = await storage.getOrderMessages(orderId);
      console.log(`Admin fetched ${messages.length} messages for order ${orderId}`);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching order messages for admin:", error);
      res.status(500).json({ error: "שגיאה בטעינת הודעות הזמנה" });
    }
  });
  
  // Mark all messages for an order as read (admin)
  app.post("/api/admin/orders/:orderId/messages/mark-read", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Mark all messages for this order as read - pass true for isAdmin
      await storage.markOrderMessagesAsRead(orderId, true);
      
      console.log(`Admin marked messages as read for order ${orderId}`);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "שגיאה בסימון הודעות כנקראו" });
    }
  });
  
  // Create a new message for an order as admin
  app.post("/api/admin/orders/:orderId/messages", ensureAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { content, imageUrl, isRead } = req.body;
      
      if (!content && !imageUrl) {
        return res.status(400).json({ error: "נדרש תוכן או תמונה להודעה" });
      }
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "הזמנה לא נמצאה" });
      }
      
      const message = await storage.createMessage({
        userId: req.user.id,
        subject: `הודעה להזמנה ${order.orderNumber}`,
        content,
        orderId,
        imageUrl: imageUrl || null,
        isFromAdmin: true,
        isRead: isRead || false
      });
      
      // Broadcast the new message to all clients
      broadcastToOrder(orderId, {
        type: 'new_message',
        orderId,
        message
      });
      
      console.log(`Admin created new message for order ${orderId}`);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message as admin:", error);
      res.status(500).json({ error: "שגיאה ביצירת הודעה" });
    }
  });

  // ADMIN: Get all orders that have messages
  app.get("/api/admin/orders-with-messages", ensureAdmin, async (req, res) => {
    try {
      // Get all orders with messages
      const ordersWithMessages = await storage.getOrdersWithMessages();
      console.log(`Admin fetched ${ordersWithMessages.length} orders with messages`);
      res.json(ordersWithMessages);
    } catch (error) {
      console.error("Error fetching orders with messages for admin:", error);
      res.status(500).json({ error: "שגיאה בטעינת הזמנות עם הודעות" });
    }
  });

  // Set up WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients with their auth info
  const clients = new Map();
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Generate a unique client ID
    const clientId = randomUUID();
    
    // Store client connection in the map
    clients.set(clientId, {
      ws,
      userId: null,
      isAdmin: false,
      orderId: null
    });
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Handle authentication
        if (data.type === 'auth') {
          const { userId, token, isAdmin, isFromAdmin } = data;
          
          // TODO: Add proper token validation
          // For now, we'll trust the client and just store the info
          
          // Update client info
          clients.set(clientId, {
            ...clients.get(clientId),
            userId,
            isAdmin: isAdmin === true,
            isFromAdmin: isFromAdmin === true || isAdmin === true // Accept either property
          });
          
          // Send success response
          ws.send(JSON.stringify({
            type: 'auth_response',
            success: true
          }));
        }
        
        // Handle chat room subscription
        else if (data.type === 'subscribe') {
          const { orderId } = data;
          
          if (!orderId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Order ID is required'
            }));
            return;
          }
          
          // Store order ID in client info
          clients.set(clientId, {
            ...clients.get(clientId),
            orderId
          });
          
          // Send past messages
          const messages = await storage.getOrderMessages(orderId);
          
          ws.send(JSON.stringify({
            type: 'history',
            orderId,
            messages
          }));
        }
        
        // Handle new message
        else if (data.type === 'message') {
          const client = clients.get(clientId);
          
          if (!client || !client.userId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'You must be authenticated to send messages'
            }));
            return;
          }
          
          const { content, orderId, parentId } = data;
          
          if (!content || !orderId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Message content and order ID are required'
            }));
            return;
          }
          
          // Create the message
          const message = await storage.createMessage({
            userId: client.userId,
            orderId,
            subject: 'הודעה בנוגע להזמנה',
            content,
            isFromAdmin: client.isFromAdmin || client.isAdmin, // Use either property
            parentId
          });
          
          // Broadcast to all connected clients for this order
          broadcastToOrder(orderId, {
            type: 'new_message',
            message
          });
        }
        
        // Handle read status update
        else if (data.type === 'mark_read') {
          const { messageId } = data;
          
          if (!messageId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Message ID is required'
            }));
            return;
          }
          
          // Update message read status
          await storage.markMessageAsRead(messageId);
          
          // Get the updated message for its orderId
          const message = await storage.getMessage(messageId);
          
          if (message && message.orderId) {
            // Broadcast read status to all connected clients for this order
            broadcastToOrder(message.orderId, {
              type: 'message_read',
              messageId
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      // Remove client from the map
      clients.delete(clientId);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to OrMia chat server'
    }));
  });
  
  // Function to broadcast a message to all clients subscribed to an order
  function broadcastToOrder(orderId: number | string, message: any) {
    clients.forEach((client, id) => {
      if (client.orderId === orderId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }
  
  return httpServer;
}
