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
  insertFavoriteSchema
} from "@shared/schema";
import { setupAuth, ensureAuthenticated, ensureAdmin, hashPassword } from "./auth";
import { generatePasswordResetToken, sendPasswordResetEmail } from "./email";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);
  
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
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "הזמנה לא נמצאה" });
      }
      
      res.json(order);
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
      
      const shipping = await storage.updateShippingStatus(id, status, locationInfo);
      if (!shipping) {
        return res.status(404).json({ message: "משלוח לא נמצא" });
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
      const allowedFields = ["firstName", "lastName", "email", "phone", "profileImage"];
      
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
      const allowedFields = ["firstName", "lastName", "email", "phone", "profileImage"];
      
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

  // Add a server-side redirect for password reset
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

  return httpServer;
}
