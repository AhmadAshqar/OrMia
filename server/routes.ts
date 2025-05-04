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
  insertCategorySchema
} from "@shared/schema";
import { setupAuth, ensureAuthenticated, ensureAdmin, hashPassword } from "./auth";
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

  const httpServer = createServer(app);

  return httpServer;
}
