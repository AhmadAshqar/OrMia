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
  apartment: text("apartment"),
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
  status: text("status").default("pending").notNull(), // pending, processing, completed, cancelled, refunded
  paymentStatus: text("payment_status").default("pending").notNull(), // pending, paid, failed, refunded
  shipmentStatus: text("shipment_status").default("pending").notNull(), // pending, processing, shipped, delivered, returned
  total: integer("total").notNull(),
  subtotal: integer("subtotal").notNull(),
  tax: integer("tax").default(0).notNull(),
  shippingCost: integer("shipping_cost").default(0).notNull(),
  discount: integer("discount").default(0),
  couponCode: text("coupon_code"),
  items: json("items").$type<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[]>(),
  shippingAddress: json("shipping_address").$type<{
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  }>(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  notes: text("notes"),
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
  carrierName: text("carrier_name").default("Israel Post").notNull(),
  shippingMethod: text("shipping_method").default("standard").notNull(), // standard, express, same-day
  status: text("status").default("pending").notNull(), // pending, processing, in-transit, out-for-delivery, delivered, failed, returned
  currentLocation: text("current_location"),
  address: json("address").$type<{
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  }>(),
  history: json("history").$type<{
    status: string;
    location: string;
    timestamp: string;
    notes?: string;
  }[]>(),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  signature: boolean("signature").default(false).notNull(),
  insurance: boolean("insurance").default(false).notNull(),
  shippingCost: integer("shipping_cost").default(0).notNull(),
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

// Define Password Reset Tokens Schema
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

// Define Promo Codes Schema
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountAmount: integer("discount_amount").notNull(),
  minOrderAmount: integer("min_order_amount").default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").references(() => admins.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  usedCount: true,
  createdAt: true,
  updatedAt: true
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
export type Order = typeof orders.$inferSelect & {
  shipping?: Shipping[];
};

export type InsertShipping = z.infer<typeof insertShippingSchema>;
export type Shipping = typeof shipping.$inferSelect & {
  order?: Order;
};

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect & {
  product?: Product;
};

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect & {
  createdByAdmin?: Admin;
};

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

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

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  shipping: many(shipping),
}));

export const shippingRelations = relations(shipping, ({ one }) => ({
  order: one(orders, {
    fields: [shipping.orderId],
    references: [orders.id],
  }),
}));

export const promoCodesRelations = relations(promoCodes, ({ one }) => ({
  admin: one(admins, {
    fields: [promoCodes.createdBy],
    references: [admins.id],
  }),
}));

// Define Messages Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderId: integer("order_id").references(() => orders.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  isFromAdmin: boolean("is_from_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  parentId: integer("parent_id").references(() => messages.id),
});

// Define Message Insert Schema
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Define Message Type
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect & {
  replies?: Message[];
  user?: User;
  order?: Order;
  parent?: Message;
};

// Define Message Relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
  }),
  replies: many(messages, { relationName: "replies" }),
}));


