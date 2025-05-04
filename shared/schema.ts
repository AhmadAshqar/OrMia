import { pgTable, text, serial, integer, boolean, real, timestamp, primaryKey, varchar, unique, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define Users Schema (defined first to avoid circular references)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("ישראל"),
  role: text("role").default("customer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Define Admin Users Schema
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// Define Product Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  mainImage: text("main_image").notNull(),
  images: text("images").default('[]'),
  categoryId: integer("category_id").notNull(),
  sku: text("sku").notNull().unique(),
  inStock: boolean("in_stock").default(true).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  rating: real("rating").default(5).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define Category Schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
});

// Define Cart Schema
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define Cart Item Schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Define Contact Form Schema
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define Inventory Schema
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  location: text("location").default("main warehouse"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  minimumStockLevel: integer("minimum_stock_level").default(5),
  onOrder: integer("on_order").default(0),
  expectedDelivery: timestamp("expected_delivery"),
  updatedBy: integer("updated_by").references(() => admins.id),
});

// Define Orders Schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").default("pending").notNull(),
  total: integer("total").notNull(),
  items: json("items").$type<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[]>(),
  shippingAddress: json("shipping_address").$type<{
    address: string;
    city: string;
    zipCode: string;
  }>(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define Shipping Schema
export const shipping = pgTable("shipping", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  trackingNumber: text("tracking_number").notNull().unique(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  shippingMethod: text("shipping_method").default("standard").notNull(),
  status: text("status").default("pending").notNull(),
  address: json("address").$type<{
    address: string;
    city: string;
    zipCode: string;
    country: string;
  }>(),
  history: json("history").$type<{
    status: string;
    location: string;
    timestamp: string;
    notes?: string;
  }[]>(),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define User Favorites Schema
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userProductIndex: unique().on(table.userId, table.productId),
  }
});

// Define Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true,
  createdAt: true,
  lastLogin: true 
});

export const insertAdminSchema = createInsertSchema(admins).omit({ 
  id: true,
  createdAt: true,
  lastLogin: true 
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true,
  createdAt: true 
});

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true 
});

export const insertCartSchema = createInsertSchema(carts).omit({ 
  id: true,
  createdAt: true 
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({ 
  id: true 
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ 
  id: true,
  createdAt: true 
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ 
  id: true,
  lastUpdated: true 
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertShippingSchema = createInsertSchema(shipping).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});

// Define Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect & {
  categoryName?: string;
  categorySlug?: string;
};

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertCart = z.infer<typeof insertCartSchema>;
export type Cart = typeof carts.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect & {
  product?: Product;
};

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type InsertInventory = z.infer<typeof insertInventorySchema>; 
export type Inventory = typeof inventory.$inferSelect & {
  productName?: string;
  productSku?: string;
};

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertShipping = z.infer<typeof insertShippingSchema>;
export type Shipping = typeof shipping.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect & {
  product?: Product;
};

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  orders: many(orders),
  carts: many(carts),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  favorites: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));
