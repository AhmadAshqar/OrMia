import { pgTable, text, serial, integer, boolean, array, real, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define Product Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description"),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  mainImage: text("main_image").notNull(),
  images: text("images").array(),
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
  userId: text("user_id"),
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

// Define Insert Schemas
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

// Define Types
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
