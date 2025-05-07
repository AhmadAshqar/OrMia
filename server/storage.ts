import { 
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  users, type User, type InsertUser,
  admins, type Admin, type InsertAdmin,
  inventory, type Inventory, type InsertInventory,
  orders, type Order, type InsertOrder,
  shipping, type Shipping, type InsertShipping,
  favorites, type Favorite, type InsertFavorite,
  passwordResetTokens, type PasswordResetToken, type InsertPasswordResetToken,
  promoCodes, type PromoCode, type InsertPromoCode,
  messages, type Message, type InsertMessage,
  type OrderSummary
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, sql, isNotNull, inArray } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categorySlug: string): Promise<Product[]>;
  getNewProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Cart methods
  getCart(id: number): Promise<Cart | undefined>;
  getCartBySessionId(sessionId: string): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  
  // Cart Item methods
  getCartItems(cartId: number): Promise<CartItem[]>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  
  // Contact form methods
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  validateUserLogin(username: string, password: string): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<boolean>;
  
  // Admin methods
  getAdmins(): Promise<Admin[]>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAdmin(id: number): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined>;
  validateAdminLogin(username: string, password: string): Promise<Admin | undefined>;
  updateAdminLastLogin(id: number): Promise<boolean>;
  
  // Inventory methods
  getInventory(): Promise<Inventory[]>;
  getInventoryByProductId(productId: number): Promise<Inventory | undefined>;
  createInventory(item: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateProductStock(productId: number, quantity: number): Promise<boolean>;
  updateProductStockAfterOrder(productId: number, quantityOrdered: number): Promise<boolean>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderWithShippingDetails(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrderShipmentStatus(id: number, shipmentStatus: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Shipping methods
  getShippings(): Promise<Shipping[]>;
  getShipping(id: number): Promise<Shipping | undefined>;
  getShippingByTrackingNumber(trackingNumber: string): Promise<Shipping | undefined>;
  getShippingByOrderNumber(orderNumber: string): Promise<Shipping | undefined>;
  getShippingByOrderId(orderId: number): Promise<Shipping | undefined>;
  createShipping(shipping: InsertShipping): Promise<Shipping>;
  updateShipping(id: number, shipping: Partial<InsertShipping>): Promise<Shipping | undefined>;
  updateShippingStatus(id: number, status: string, locationInfo?: {
    location: string;
    notes?: string;
  }): Promise<Shipping | undefined>;
  deleteShipping(id: number): Promise<boolean>;
  
  // Favorites methods
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavorite(id: number): Promise<Favorite | undefined>;
  getFavoriteByUserAndProduct(userId: number, productId: number): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: number): Promise<boolean>;
  deleteUserProductFavorite(userId: number, productId: number): Promise<boolean>;
  
  // Password reset methods
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetTokenByToken(token: string): Promise<PasswordResetToken | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  markPasswordResetTokenAsUsed(id: number): Promise<boolean>;
  
  // Promo code methods
  getPromoCodes(): Promise<PromoCode[]>;
  getActivePromoCodes(): Promise<PromoCode[]>;
  getPromoCode(id: number): Promise<PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCode(id: number, promoCode: Partial<InsertPromoCode>): Promise<PromoCode | undefined>;
  incrementPromoCodeUsage(id: number): Promise<boolean>;
  togglePromoCodeActive(id: number, isActive: boolean): Promise<boolean>;
  deletePromoCode(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  getUserMessages(userId: number): Promise<Message[]>;
  getOrderMessages(orderId: number): Promise<Message[]>;
  getUnreadUserMessages(userId: number): Promise<Message[]>;
  getUnreadAdminMessages(): Promise<Message[]>;
  getMessage(id: number): Promise<Message | undefined>;
  getOrdersWithMessages(): Promise<OrderSummary[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  markOrderMessagesAsRead(orderId: number): Promise<boolean>;
  markOrderMessagesAsReadByUser(orderId: number, userId: number): Promise<boolean>;
  replyToMessage(parentId: number, message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private contactMessages: Map<number, ContactMessage>;
  private admins: Map<number, Admin>;
  private inventoryItems: Map<number, Inventory>;
  private orders: Map<number, Order>;
  private shippings: Map<number, Shipping>;
  private messages: Map<number, Message>;
  private favorites: Map<number, Favorite>;
  private passwordResetTokens: Map<number, PasswordResetToken>;
  private promoCodes: Map<number, PromoCode>;
  
  private productId: number = 1;
  private categoryId: number = 1;
  private cartId: number = 1;
  private cartItemId: number = 1;
  private contactMessageId: number = 1;
  private adminId: number = 1;
  private inventoryId: number = 1;
  private orderId: number = 1;
  private shippingId: number = 1;
  private messageId: number = 1;
  private favoriteId: number = 1;
  private passwordResetTokenId: number = 1;
  private promoCodeId: number = 1;
  
  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.contactMessages = new Map();
    this.admins = new Map();
    this.inventoryItems = new Map();
    this.orders = new Map();
    this.shippings = new Map();
    this.messages = new Map();
    this.favorites = new Map();
    this.passwordResetTokens = new Map();
    this.promoCodes = new Map();
    
    // Initialize with seed data
    this.initializeData();
    
    // Add a default admin
    this.createAdmin({
      username: "admin",
      password: "admin123",
      email: "admin@moissanite.co.il",
      firstName: "Site",
      lastName: "Admin",
      role: "admin"
    });
    
    // Initialize inventory for products
    this.products.forEach(product => {
      this.createInventory({
        productId: product.id,
        quantity: product.inStock ? 10 : 0,
        minimumStockLevel: 5,
        onOrder: 0
      });
    });
  }

  private initializeData() {
    // Add categories
    const categories: InsertCategory[] = [
      { name: "טבעות אירוסין", slug: "engagement-rings", description: "טבעות אירוסין מויסנייט יוקרתיות לרגע המיוחד", image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" },
      { name: "טבעות", slug: "rings", description: "טבעות מויסנייט יפהפיות לכל אירוע", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" },
      { name: "שרשראות", slug: "necklaces", description: "שרשראות מויסנייט אלגנטיות", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80" },
      { name: "עגילים", slug: "earrings", description: "עגילים מרהיבים משובצים מויסנייט", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" },
      { name: "צמידים", slug: "bracelets", description: "צמידים יוקרתיים משובצים מויסנייט", image: "https://images.unsplash.com/photo-1631982690223-8aa6f588343d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80" },
    ];
    
    categories.forEach(category => this.createCategory(category));
    
    // Add products
    const products: InsertProduct[] = [
      {
        name: "טבעת מויסנייט קלאסית",
        description: "טבעת מויסנייט קלאסית ויפה, משובצת באבן 1 קראט איכותית בשיבוץ עדין",
        longDescription: "טבעת מויסנייט מרהיבה בעיצוב קלאסי נצחי. האבן המרכזית במשקל 1 קראט מהבהקת באור מדהים ושוברת את האור לקשת של צבעים. העיצוב הנקי וההעבודה המדוקדקת הופכים את הטבעת הזו למיוחדת במינה. טבעת זו מושלמת כטבעת אירוסין, מתנה מיוחדת או כפינוק אישי לעצמך.",
        price: 2199,
        mainImage: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
        images: ["https://images.unsplash.com/photo-1595377864610-35a0e1968912", "https://images.unsplash.com/photo-1616692043665-73e45f614718"],
        categoryId: 2,
        sku: "RING-MS-001",
        inStock: true,
        isNew: true,
        isFeatured: true,
        rating: 4.5,
        reviewCount: 24
      },
      {
        name: "שרשרת מויסנייט טניס",
        description: "שרשרת טניס משובצת באבני מויסנייט קטנות לאורך כל השרשרת",
        longDescription: "שרשרת טניס יוקרתית משובצת באבני מויסנייט קטנות בעלות נצנוץ מרהיב. שרשרת זו בעלת סגירה בטוחה ונוחה לנשיאה יומיומית או לאירועים מיוחדים. שרשרת הטניס היא פריט קלאסי שמתאים לכל סגנון ולכל גיל.",
        price: 4299,
        salePrice: 3499,
        mainImage: "https://images.unsplash.com/photo-1601821765780-754fa98637c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        images: ["https://images.unsplash.com/photo-1611107683227-e9060eccd846", "https://images.unsplash.com/photo-1612159797322-b42cd8f54f96"],
        categoryId: 3,
        sku: "NECK-MS-001",
        inStock: true,
        isNew: false,
        isFeatured: true,
        rating: 5.0,
        reviewCount: 42
      },
      {
        name: "עגילי מויסנייט נתלים",
        description: "עגילים נתלים משובצים באבני מויסנייט עדינות",
        longDescription: "עגילים נתלים אלגנטיים משובצים באבני מויסנייט בעיצוב עדין ונשי. העגילים קלים למרות מראם המרשים ונוחים לנשיאה לאורך כל היום. הם מוסיפים נגיעה של יוקרה ואלגנטיות לכל הופעה.",
        price: 1899,
        mainImage: "https://images.unsplash.com/photo-1603033156166-2ae22eb2b7e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1364&q=80",
        images: ["https://images.unsplash.com/photo-1588891557811-a70bbd3d0f0a", "https://images.unsplash.com/photo-1575863438850-fb1c06fb96d4"],
        categoryId: 4,
        sku: "EAR-MS-001",
        inStock: true,
        isNew: false,
        isFeatured: true,
        rating: 4.5,
        reviewCount: 18
      },
      {
        name: "צמיד טניס מויסנייט",
        description: "צמיד טניס יוקרתי משובץ באבני מויסנייט נוצצות",
        longDescription: "צמיד טניס משובץ באבני מויסנייט באיכות גבוהה במיוחד. הצמיד בעל מנגנון סגירה בטוח ונוח, המאפשר נשיאה יומיומית בביטחון מלא. הנצנוץ של אבני המויסנייט הוא מרהיב ודומה מאוד ליהלום, אך במחיר נגיש יותר.",
        price: 3499,
        salePrice: 2799,
        mainImage: "https://images.unsplash.com/photo-1631982690223-8aa6f588343d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80",
        images: ["https://images.unsplash.com/photo-1602283215677-a7df79dda9cd", "https://images.unsplash.com/photo-1573505820103-bdca39cc6ddc"],
        categoryId: 5,
        sku: "BRAC-MS-001",
        inStock: true,
        isNew: false,
        isFeatured: true,
        rating: 5.0,
        reviewCount: 36
      },
      {
        name: "טבעת אירוסין מויסנייט סוליטר",
        description: "טבעת אירוסין קלאסית עם אבן מויסנייט סוליטר עגולה 1.5 קראט",
        longDescription: "טבעת אירוסין בעיצוב קלאסי ונצחי עם אבן מויסנייט מרכזית במשקל 1.5 קראט וחישוקים עדינים. הטבעת מושלמת להצעת נישואין רומנטית, עם נצנוץ דומה ליהלום אך במחיר נגיש יותר. כל טבעת מגיעה בקופסת מתנה יוקרתית.",
        price: 3299,
        mainImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
        images: ["https://images.unsplash.com/photo-1566977744263-79e677f4e7cf", "https://images.unsplash.com/photo-1605092043680-213690441ebb"],
        categoryId: 1,
        sku: "ENGR-MS-001",
        inStock: true,
        isNew: true,
        isFeatured: true,
        rating: 4.9,
        reviewCount: 57
      },
      {
        name: "שרשרת תליון מויסנייט",
        description: "שרשרת זהב עם תליון מויסנייט בעיצוב טיפה",
        longDescription: "שרשרת מרהיבה עם תליון בצורת טיפה המשובץ באבן מויסנייט זוהרת. התליון העדין משתלב היטב עם כל מראה ומוסיף נגיעה של יוקרה. שרשרת זו היא מתנה מושלמת לאישה האהובה בחייך.",
        price: 1599,
        mainImage: "https://images.unsplash.com/photo-1590548784595-de8ea3e8e27a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1772&q=80",
        images: ["https://images.unsplash.com/photo-1571148433239-15d1079cd7d8", "https://images.unsplash.com/photo-1620656798795-2995fa4be9da"],
        categoryId: 3,
        sku: "NECK-MS-002",
        inStock: true,
        isNew: false,
        isFeatured: false,
        rating: 4.7,
        reviewCount: 29
      }
    ];
    
    products.forEach(product => this.createProduct(product));
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    const allProducts = Array.from(this.products.values());
    return Promise.all(allProducts.map(async (product) => {
      const category = await this.getCategory(product.categoryId);
      return {
        ...product,
        categoryName: category?.name,
        categorySlug: category?.slug
      };
    }));
  }
  
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return [];
    
    const products = Array.from(this.products.values())
      .filter(product => product.categoryId === category.id);
      
    return Promise.all(products.map(async (product) => {
      return {
        ...product,
        categoryName: category.name,
        categorySlug: category.slug
      };
    }));
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    const featuredProducts = Array.from(this.products.values())
      .filter(product => product.isFeatured);
      
    return Promise.all(featuredProducts.map(async (product) => {
      const category = await this.getCategory(product.categoryId);
      return {
        ...product,
        categoryName: category?.name,
        categorySlug: category?.slug
      };
    }));
  }
  
  async getNewProducts(): Promise<Product[]> {
    const newProducts = Array.from(this.products.values())
      .filter(product => product.isNew);
      
    return Promise.all(newProducts.map(async (product) => {
      const category = await this.getCategory(product.categoryId);
      return {
        ...product,
        categoryName: category?.name,
        categorySlug: category?.slug
      };
    }));
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const category = await this.getCategory(product.categoryId);
    return {
      ...product,
      categoryName: category?.name,
      categorySlug: category?.slug
    };
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const timestamp = new Date();
    const newProduct: Product = { ...product, id, createdAt: timestamp };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct: Product = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values())
      .find(category => category.slug === slug);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory: Category = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }
  
  // Cart methods
  async getCart(id: number): Promise<Cart | undefined> {
    return this.carts.get(id);
  }
  
  async getCartBySessionId(sessionId: string): Promise<Cart | undefined> {
    return Array.from(this.carts.values())
      .find(cart => cart.sessionId === sessionId);
  }
  
  async createCart(cart: InsertCart): Promise<Cart> {
    const id = this.cartId++;
    const timestamp = new Date();
    const newCart: Cart = { ...cart, id, createdAt: timestamp };
    this.carts.set(id, newCart);
    return newCart;
  }
  
  // Cart Item methods
  async getCartItems(cartId: number): Promise<CartItem[]> {
    const items = Array.from(this.cartItems.values())
      .filter(item => item.cartId === cartId);
    
    return Promise.all(items.map(async (item) => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        product
      };
    }));
  }
  
  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const id = this.cartItemId++;
    const newCartItem: CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (!cartItem) return undefined;
    
    const updatedCartItem: CartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }
  
  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  // Contact form methods
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageId++;
    const timestamp = new Date();
    const newMessage: ContactMessage = { ...message, id, createdAt: timestamp };
    this.contactMessages.set(id, newMessage);
    return newMessage;
  }
  
  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Admin methods
  async getAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values())
      .find(admin => admin.username === username);
  }
  
  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.adminId++;
    const timestamp = new Date();
    const newAdmin: Admin = { ...admin, id, createdAt: timestamp, lastLogin: null };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }
  
  async updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const existingAdmin = this.admins.get(id);
    if (!existingAdmin) return undefined;
    
    const updatedAdmin: Admin = { ...existingAdmin, ...admin };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }
  
  async validateAdminLogin(username: string, password: string): Promise<Admin | undefined> {
    const admin = await this.getAdminByUsername(username);
    if (!admin || admin.password !== password) {
      return undefined;
    }
    return admin;
  }
  
  async updateAdminLastLogin(id: number): Promise<boolean> {
    const admin = this.admins.get(id);
    if (!admin) return false;
    
    admin.lastLogin = new Date();
    this.admins.set(id, admin);
    return true;
  }
  
  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    const items = Array.from(this.inventoryItems.values());
    
    return Promise.all(items.map(async item => {
      const product = await this.getProduct(item.productId);
      return {
        ...item,
        productName: product?.name,
        productSku: product?.sku
      };
    }));
  }
  
  async getInventoryByProductId(productId: number): Promise<Inventory | undefined> {
    const item = Array.from(this.inventoryItems.values())
      .find(item => item.productId === productId);
      
    if (!item) return undefined;
    
    const product = await this.getProduct(productId);
    return {
      ...item,
      productName: product?.name,
      productSku: product?.sku
    };
  }
  
  async createInventory(item: InsertInventory): Promise<Inventory> {
    const id = this.inventoryId++;
    const timestamp = new Date();
    const newItem: Inventory = { 
      ...item, 
      id, 
      lastUpdated: timestamp,
      expectedDelivery: item.expectedDelivery || null,
      location: item.location || "main warehouse",
      minimumStockLevel: item.minimumStockLevel || 5,
      onOrder: item.onOrder || 0,
      updatedBy: item.updatedBy || null
    };
    
    this.inventoryItems.set(id, newItem);
    return newItem;
  }
  
  async updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;
    
    const timestamp = new Date();
    const updatedItem: Inventory = { 
      ...existingItem, 
      ...item, 
      lastUpdated: timestamp 
    };
    
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async updateProductStock(productId: number, quantity: number): Promise<boolean> {
    const inventoryItem = await this.getInventoryByProductId(productId);
    
    if (inventoryItem) {
      // Update existing inventory
      await this.updateInventory(inventoryItem.id, { quantity });
    } else {
      // Create new inventory item
      await this.createInventory({ productId, quantity });
    }
    
    // Update product inStock status
    const product = await this.getProduct(productId);
    if (!product) return false;
    
    const updatedProduct = { ...product, inStock: quantity > 0 };
    this.products.set(productId, updatedProduct);
    
    return true;
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values())
      .find(order => order.orderNumber === orderNumber);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const timestamp = new Date();
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const newOrder: Order = { 
      ...order, 
      id, 
      orderNumber,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder: Order = { 
      ...existingOrder, 
      ...order,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder: Order = { 
      ...existingOrder, 
      status,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }
  
  // Shipping methods
  async getShippings(): Promise<Shipping[]> {
    return Array.from(this.shippings.values());
  }
  
  async getShipping(id: number): Promise<Shipping | undefined> {
    return this.shippings.get(id);
  }
  
  async getShippingByTrackingNumber(trackingNumber: string): Promise<Shipping | undefined> {
    return Array.from(this.shippings.values())
      .find(shipping => shipping.trackingNumber === trackingNumber);
  }
  
  async getShippingByOrderNumber(orderNumber: string): Promise<Shipping | undefined> {
    return Array.from(this.shippings.values())
      .find(shipping => shipping.orderNumber === orderNumber);
  }
  
  async getShippingByOrderId(orderId: number): Promise<Shipping | undefined> {
    // First get the order to find its order number
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    
    // Then find shipping by order number
    return Array.from(this.shippings.values())
      .find(shipping => shipping.orderNumber === order.orderNumber);
  }
  
  async createShipping(shipping: InsertShipping): Promise<Shipping> {
    const id = this.shippingId++;
    const timestamp = new Date();
    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    const newShipping: Shipping = { 
      ...shipping, 
      id, 
      trackingNumber,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: shipping.history || [{
        status: shipping.status || "pending",
        location: "מרכז מיון",
        timestamp: timestamp.toISOString(),
        notes: "הזמנה נקלטה במערכת"
      }]
    };
    
    this.shippings.set(id, newShipping);
    return newShipping;
  }
  
  async updateShipping(id: number, shipping: Partial<InsertShipping>): Promise<Shipping | undefined> {
    const existingShipping = this.shippings.get(id);
    if (!existingShipping) return undefined;
    
    const updatedShipping: Shipping = { 
      ...existingShipping, 
      ...shipping,
      updatedAt: new Date()
    };
    
    this.shippings.set(id, updatedShipping);
    return updatedShipping;
  }
  
  async updateShippingStatus(id: number, status: string, locationInfo?: {
    location: string;
    notes?: string;
  }): Promise<Shipping | undefined> {
    const existingShipping = this.shippings.get(id);
    if (!existingShipping) return undefined;
    
    const timestamp = new Date();
    const history = [...(existingShipping.history || []), {
      status,
      location: locationInfo?.location || "מרכז מיון",
      timestamp: timestamp.toISOString(),
      notes: locationInfo?.notes
    }];
    
    const updatedShipping: Shipping = { 
      ...existingShipping, 
      status,
      history,
      updatedAt: timestamp
    };
    
    this.shippings.set(id, updatedShipping);
    return updatedShipping;
  }
  
  async deleteShipping(id: number): Promise<boolean> {
    return this.shippings.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // Product methods
  async getProducts(): Promise<Product[]> {
    const result = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
    
    return result.map(row => ({
      ...row.products,
      categoryName: row.categories?.name,
      categorySlug: row.categories?.slug
    }));
  }
  
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return [];
    
    const result = await db.select().from(products)
      .where(eq(products.categoryId, category.id));
      
    return result.map(product => ({
      ...product,
      categoryName: category.name,
      categorySlug: category.slug
    }));
  }
  
  async getNewProducts(): Promise<Product[]> {
    const result = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isNew, true));
      
    return result.map(row => ({
      ...row.products,
      categoryName: row.categories?.name,
      categorySlug: row.categories?.slug
    }));
  }
  
  async getFeaturedProducts(): Promise<Product[]> {
    const result = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isFeatured, true));
      
    return result.map(row => ({
      ...row.products,
      categoryName: row.categories?.name,
      categorySlug: row.categories?.slug
    }));
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    const [result] = await db.select().from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));
      
    if (!result) return undefined;
    
    return {
      ...result.products,
      categoryName: result.categories?.name,
      categorySlug: result.categories?.slug
    };
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product).returning();
    return result;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [result] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
      
    return result;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      // First delete records from related tables that reference this product
      // Delete favorites that reference this product
      await db.delete(favorites)
        .where(eq(favorites.productId, id));
        
      // Delete cart items that reference this product
      await db.delete(cartItems)
        .where(eq(cartItems.productId, id));
        
      // Delete inventory records for this product
      await db.delete(inventory)
        .where(eq(inventory.productId, id));
        
      // Finally delete the product itself
      const [result] = await db.delete(products)
        .where(eq(products.id, id))
        .returning();
        
      return !!result;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      throw error;
    }
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [result] = await db.select().from(categories)
      .where(eq(categories.id, id));
      
    return result;
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [result] = await db.select().from(categories)
      .where(eq(categories.slug, slug));
      
    return result;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }
  
  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
      
    return result;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    const [result] = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();
      
    return !!result;
  }
  
  // Cart methods
  async getCart(id: number): Promise<Cart | undefined> {
    const [result] = await db.select().from(carts)
      .where(eq(carts.id, id));
      
    return result;
  }
  
  async getCartBySessionId(sessionId: string): Promise<Cart | undefined> {
    const [result] = await db.select().from(carts)
      .where(eq(carts.sessionId, sessionId));
      
    return result;
  }
  
  async createCart(cart: InsertCart): Promise<Cart> {
    const [result] = await db.insert(carts).values(cart).returning();
    return result;
  }
  
  // Cart Item methods
  async getCartItems(cartId: number): Promise<CartItem[]> {
    const result = await db.select().from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId));
      
    return result.map(row => ({
      ...row.cart_items,
      product: row.products
    }));
  }
  
  async createCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const [result] = await db.insert(cartItems).values(cartItem).returning();
    return result;
  }
  
  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [result] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
      
    return result;
  }
  
  async deleteCartItem(id: number): Promise<boolean> {
    const [result] = await db.delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();
      
    return !!result;
  }
  
  // Contact form methods
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [result] = await db.insert(contactMessages).values(message).returning();
    return result;
  }
  
  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }
  
  // User methods
  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db.select().from(users)
      .where(eq(users.username, username));
      
    return result;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db.select().from(users)
      .where(eq(users.email, email));
      
    return result;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users)
      .where(eq(users.id, id));
      
    return result;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [result] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
      
    return result;
  }
  
  async validateUserLogin(username: string, password: string): Promise<User | undefined> {
    // This method is no longer used with passport - authentication happens in auth.ts
    // Keeping for backward compatibility
    const [user] = await db.select().from(users)
      .where(eq(users.username, username));
      
    if (!user) {
      return undefined;
    }
    
    // Note: actual password comparison is done in auth.ts with the comparePasswords function
    return user;
  }
  
  async updateUserLastLogin(id: number): Promise<boolean> {
    const [result] = await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id))
      .returning();
      
    return !!result;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const results = await db.delete(users)
        .where(eq(users.id, id))
        .returning();
        
      return results.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
  
  // Admin methods
  async getAdmins(): Promise<Admin[]> {
    return db.select().from(admins);
  }
  
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [result] = await db.select().from(admins)
      .where(eq(admins.username, username));
      
    return result;
  }
  
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [result] = await db.select().from(admins)
      .where(eq(admins.id, id));
      
    return result;
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [result] = await db.insert(admins).values(admin).returning();
    return result;
  }
  
  async updateAdmin(id: number, admin: Partial<InsertAdmin>): Promise<Admin | undefined> {
    const [result] = await db.update(admins)
      .set(admin)
      .where(eq(admins.id, id))
      .returning();
      
    return result;
  }
  
  async validateAdminLogin(username: string, password: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins)
      .where(eq(admins.username, username));
      
    if (!admin || admin.password !== password) {
      return undefined;
    }
    
    return admin;
  }
  
  async updateAdminLastLogin(id: number): Promise<boolean> {
    const [result] = await db.update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id))
      .returning();
      
    return !!result;
  }
  
  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    const result = await db.select().from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id));
      
    return result.map(row => ({
      ...row.inventory,
      productName: row.products?.name,
      productSku: row.products?.sku
    }));
  }
  
  async getInventoryByProductId(productId: number): Promise<Inventory | undefined> {
    const [result] = await db.select().from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.productId, productId));
      
    if (!result) return undefined;
    
    return {
      ...result.inventory,
      productName: result.products?.name,
      productSku: result.products?.sku
    };
  }
  
  async createInventory(item: InsertInventory): Promise<Inventory> {
    const [result] = await db.insert(inventory).values(item).returning();
    return result;
  }
  
  async updateInventory(id: number, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [result] = await db.update(inventory)
      .set({...item, lastUpdated: new Date()})
      .where(eq(inventory.id, id))
      .returning();
      
    return result;
  }
  
  async updateProductStock(productId: number, quantity: number): Promise<boolean> {
    const inventoryItem = await this.getInventoryByProductId(productId);
    
    if (inventoryItem) {
      // Update existing inventory
      await this.updateInventory(inventoryItem.id, { quantity });
    } else {
      // Create new inventory item
      await this.createInventory({ 
        productId, 
        quantity 
      });
    }
    
    // Update product inStock status
    const [result] = await db.update(products)
      .set({ inStock: quantity > 0 })
      .where(eq(products.id, productId))
      .returning();
      
    return !!result;
  }
  
  async updateProductStockAfterOrder(productId: number, quantityOrdered: number): Promise<boolean> {
    const inventoryItem = await this.getInventoryByProductId(productId);
    
    if (!inventoryItem) {
      console.warn(`No inventory item found for product ID ${productId}`);
      return false;
    }
    
    // Calculate new quantity after order
    const newQuantity = Math.max(0, inventoryItem.quantity - quantityOrdered);
    
    // Update inventory
    await this.updateInventory(inventoryItem.id, { quantity: newQuantity });
    
    // Update product inStock status
    const [result] = await db.update(products)
      .set({ inStock: newQuantity > 0 })
      .where(eq(products.id, productId))
      .returning();
      
    return !!result;
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders)
      .orderBy(desc(orders.createdAt));
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    const userOrders = await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    // For each order, fetch its shipping information
    const ordersWithShipping = await Promise.all(
      userOrders.map(async (order) => {
        const shippingInfo = await db.select().from(shipping)
          .where(eq(shipping.orderId, order.id));
        
        return {
          ...order,
          shipping: shippingInfo
        };
      })
    );
    
    return ordersWithShipping;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    const [result] = await db.select().from(orders)
      .where(eq(orders.id, id));
      
    return result;
  }
  
  async getOrderWithShippingDetails(id: number): Promise<Order | undefined> {
    const [orderResult] = await db.select().from(orders)
      .where(eq(orders.id, id));
    
    if (!orderResult) return undefined;
    
    const shippingRecords = await db.select().from(shipping)
      .where(eq(shipping.orderId, id));
    
    return {
      ...orderResult,
      shipping: shippingRecords
    };
  }
  
  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [result] = await db.select().from(orders)
      .where(eq(orders.orderNumber, orderNumber));
      
    return result;
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values({
      ...order,
      updatedAt: new Date()
    }).returning();
    
    return result;
  }
  
  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [result] = await db.update(orders)
      .set({
        ...order,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    return result;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [result] = await db.update(orders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
      
    return result;
  }
  
  async updateOrderShipmentStatus(id: number, shipmentStatus: string): Promise<Order | undefined> {
    // First get the current order to check if it exists
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    // Update the order's shipment status
    const [result] = await db.update(orders)
      .set({
        shipmentStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    // If there's shipping information associated with this order, update it too
    const shippingInfo = await db.select().from(shipping)
      .where(eq(shipping.orderId, id));
    
    if (shippingInfo.length > 0) {
      await this.updateShippingStatus(shippingInfo[0].id, shipmentStatus, {
        location: "מרכז מיון",
        notes: `סטטוס משלוח עודכן ל${shipmentStatus}`
      });
    }
    
    return result;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    const [result] = await db.delete(orders)
      .where(eq(orders.id, id))
      .returning();
      
    return !!result;
  }
  
  // Shipping methods
  async getShippings(): Promise<Shipping[]> {
    return db.select().from(shipping)
      .orderBy(desc(shipping.createdAt));
  }
  
  async getShipping(id: number): Promise<Shipping | undefined> {
    const [result] = await db.select().from(shipping)
      .where(eq(shipping.id, id));
      
    return result;
  }
  
  async getShippingByTrackingNumber(trackingNumber: string): Promise<Shipping | undefined> {
    const [result] = await db.select().from(shipping)
      .where(eq(shipping.trackingNumber, trackingNumber));
      
    return result;
  }
  
  async getShippingByOrderNumber(orderNumber: string): Promise<Shipping | undefined> {
    const [result] = await db.select().from(shipping)
      .where(eq(shipping.orderNumber, orderNumber));
      
    return result;
  }
  
  async getShippingByOrderId(orderId: number): Promise<Shipping | undefined> {
    // First get the order to find its order number
    const order = await this.getOrder(orderId);
    if (!order) return undefined;
    
    // Then find shipping by order number
    return this.getShippingByOrderNumber(order.orderNumber);
  }
  
  async createShipping(newShipping: InsertShipping): Promise<Shipping> {
    const timestamp = new Date();
    
    const [result] = await db.insert(shipping).values({
      ...newShipping,
      updatedAt: timestamp,
      history: newShipping.history || [{
        status: newShipping.status || "pending",
        location: "מרכז מיון",
        timestamp: timestamp.toISOString(),
        notes: "הזמנה נקלטה במערכת"
      }]
    }).returning();
    
    return result;
  }
  
  async updateShipping(id: number, shippingUpdate: Partial<InsertShipping>): Promise<Shipping | undefined> {
    const [result] = await db.update(shipping)
      .set({
        ...shippingUpdate,
        updatedAt: new Date()
      })
      .where(eq(shipping.id, id))
      .returning();
      
    return result;
  }
  
  async updateShippingStatus(id: number, status: string, locationInfo?: {
    location: string;
    notes?: string;
  }): Promise<Shipping | undefined> {
    // First get the current shipping record to get the history
    const currentShipping = await this.getShipping(id);
    if (!currentShipping) return undefined;
    
    const timestamp = new Date();
    
    // Add new history entry
    const history = [
      ...(currentShipping.history || []),
      {
        status,
        location: locationInfo?.location || "מרכז מיון",
        timestamp: timestamp.toISOString(),
        notes: locationInfo?.notes
      }
    ];
    
    // Update the shipping record
    const [result] = await db.update(shipping)
      .set({
        status,
        history,
        updatedAt: timestamp
      })
      .where(eq(shipping.id, id))
      .returning();
      
    return result;
  }
  
  async deleteShipping(id: number): Promise<boolean> {
    const [result] = await db.delete(shipping)
      .where(eq(shipping.id, id))
      .returning();
      
    return !!result;
  }
  
  // Favorites methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    const results = await db.select({
      favorite: favorites,
      product: products
    })
    .from(favorites)
    .leftJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.userId, userId));
    
    return results.map(({ favorite, product }) => ({
      ...favorite,
      product
    }));
  }
  
  async getFavorite(id: number): Promise<Favorite | undefined> {
    const [result] = await db.select({
      favorite: favorites,
      product: products
    })
    .from(favorites)
    .leftJoin(products, eq(favorites.productId, products.id))
    .where(eq(favorites.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.favorite,
      product: result.product
    };
  }
  
  async getFavoriteByUserAndProduct(userId: number, productId: number): Promise<Favorite | undefined> {
    const [result] = await db.select({
      favorite: favorites,
      product: products
    })
    .from(favorites)
    .leftJoin(products, eq(favorites.productId, products.id))
    .where(and(
      eq(favorites.userId, userId),
      eq(favorites.productId, productId)
    ));
    
    if (!result) return undefined;
    
    return {
      ...result.favorite,
      product: result.product
    };
  }
  
  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const timestamp = new Date();
    
    const [result] = await db.insert(favorites)
      .values({
        ...favorite,
        createdAt: timestamp
      })
      .returning();
    
    const product = await this.getProduct(result.productId);
    
    return {
      ...result,
      product
    };
  }
  
  async deleteFavorite(id: number): Promise<boolean> {
    const [result] = await db.delete(favorites)
      .where(eq(favorites.id, id))
      .returning();
      
    return !!result;
  }
  
  async deleteUserProductFavorite(userId: number, productId: number): Promise<boolean> {
    const [result] = await db.delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.productId, productId)
      ))
      .returning();
      
    return !!result;
  }
  
  // Password reset methods
  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [result] = await db.insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt
      })
      .returning();
    
    return result;
  }
  
  async getPasswordResetTokenByToken(token: string): Promise<PasswordResetToken | undefined> {
    const [result] = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    
    return result;
  }
  
  async markPasswordResetTokenAsUsed(id: number): Promise<boolean> {
    const [result] = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id))
      .returning();
    
    return !!result;
  }

  // Promo code methods
  async getPromoCodes(): Promise<PromoCode[]> {
    return db.select()
      .from(promoCodes)
      .orderBy(desc(promoCodes.createdAt));
  }

  async getActivePromoCodes(): Promise<PromoCode[]> {
    const now = new Date();
    return db.select()
      .from(promoCodes)
      .where(
        and(
          eq(promoCodes.isActive, true),
          or(
            eq(promoCodes.startDate, null),
            sql`${promoCodes.startDate} <= ${now}`
          ),
          or(
            eq(promoCodes.endDate, null),
            sql`${promoCodes.endDate} >= ${now}`
          ),
          or(
            eq(promoCodes.maxUses, null),
            sql`${promoCodes.usedCount} < ${promoCodes.maxUses}`
          )
        )
      )
      .orderBy(asc(promoCodes.code));
  }

  async getPromoCode(id: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select()
      .from(promoCodes)
      .where(eq(promoCodes.id, id));
    
    if (!promoCode) return undefined;
    
    // Check if there's a related admin
    let adminInfo = null;
    if (promoCode.createdBy) {
      const [admin] = await db.select({
        id: admins.id,
        username: admins.username
      })
      .from(admins)
      .where(eq(admins.id, promoCode.createdBy));
      
      if (admin) {
        adminInfo = admin;
      }
    }
    
    return {
      ...promoCode,
      createdByAdmin: adminInfo
    };
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    try {
      // Get the promo code with case-insensitive search
      const promoCodes = await this.getPromoCodes();
      
      // Try to find a promo code matching the code (case insensitive)
      const promoCode = promoCodes.find(
        p => p.code.toLowerCase() === code.toLowerCase()
      );
      
      console.log("Searching for promo code:", code);
      console.log("Found promo code:", promoCode || "none");
      
      return promoCode;
    } catch (error) {
      console.error("Error in getPromoCodeByCode:", error);
      return undefined;
    }
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const [newPromoCode] = await db.insert(promoCodes)
      .values({
        ...promoCode,
        usedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newPromoCode;
  }

  async updatePromoCode(id: number, promoCode: Partial<InsertPromoCode>): Promise<PromoCode | undefined> {
    const [updatedPromoCode] = await db.update(promoCodes)
      .set({
        ...promoCode,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, id))
      .returning();
    
    return updatedPromoCode;
  }

  async incrementPromoCodeUsage(id: number): Promise<boolean> {
    const [result] = await db.update(promoCodes)
      .set({ 
        usedCount: sql`${promoCodes.usedCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, id))
      .returning();
    
    return !!result;
  }

  async togglePromoCodeActive(id: number, isActive: boolean): Promise<boolean> {
    const [result] = await db.update(promoCodes)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.id, id))
      .returning();
    
    return !!result;
  }

  async deletePromoCode(id: number): Promise<boolean> {
    const [result] = await db.delete(promoCodes)
      .where(eq(promoCodes.id, id))
      .returning();
    
    return !!result;
  }

  // Message methods
  async getMessages(userId?: number): Promise<Message[]> {
    // Create query
    let query = db.select().from(messages);
    
    // Filter by userId if provided
    if (userId) {
      query = query.where(eq(messages.userId, userId));
    }
    
    // Execute query with ordering
    const allMessages = await query.orderBy(desc(messages.createdAt));
    
    return allMessages;
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    // Get messages where:
    // 1. Messages created by this user, OR
    // 2. Admin messages directed specifically to this user
    const userMessages = await db.select().from(messages)
      .where(
        or(
          eq(messages.userId, userId),
          and(
            eq(messages.isFromAdmin, true),
            eq(messages.userId, userId)
          )
        )
      )
      .orderBy(desc(messages.createdAt));
    
    return userMessages;
  }

  async getOrderMessages(orderId: number): Promise<Message[]> {
    const orderMessages = await db.select().from(messages)
      .where(eq(messages.orderId, orderId))
      .orderBy(asc(messages.createdAt)); // Changed from desc to asc for oldest-first ordering
    
    return orderMessages;
  }
  
  // Alias for better semantics in admin routes
  async getMessagesByOrderId(orderId: number): Promise<Message[]> {
    return this.getOrderMessages(orderId);
  }
  
  // Get all orders that have messages for the admin view
  async getOrdersWithMessages(): Promise<OrderSummary[]> {
    // First, get all unique orderIds from messages table
    const messagesByOrder = await db.selectDistinct({ 
      orderId: messages.orderId 
    })
    .from(messages)
    .where(isNotNull(messages.orderId));
    
    // Create a map to store unique orders with message info
    const orderMap = new Map<number, OrderSummary>();
    
    // For each orderId, fetch additional order details and message counts
    for (const item of messagesByOrder) {
      if (!item.orderId) continue;
      
      // Get the order details
      const order = await this.getOrder(item.orderId);
      if (!order) continue;
      
      // Get unread message count (messages from users, not from admin)
      const unreadMessages = await db.select({ id: messages.id })
        .from(messages)
        .where(
          and(
            eq(messages.orderId, item.orderId),
            eq(messages.isRead, false),
            eq(messages.isFromAdmin, false)
          )
        );
      
      // Get the latest message date for this order
      const latestMessages = await db.select()
        .from(messages)
        .where(eq(messages.orderId, item.orderId))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const latestDate = latestMessages.length > 0 
        ? latestMessages[0].createdAt 
        : order.createdAt;
      
      // Add to our map
      orderMap.set(item.orderId, {
        orderId: item.orderId,
        orderNumber: order.orderNumber,
        date: latestDate,
        hasMessages: true,
        unreadCount: unreadMessages.length
      });
    }
    
    // Convert map to array and sort by orderId (ascending)
    return Array.from(orderMap.values()).sort((a, b) => a.orderId - b.orderId);
  }

  async getUnreadUserMessages(userId: number): Promise<Message[]> {
    // First, get all orders for this user
    const userOrders = await db.select().from(orders)
      .where(eq(orders.userId, userId));
    
    if (userOrders.length === 0) {
      return []; // No orders, so no messages
    }
    
    // Get order IDs
    const orderIds = userOrders.map(order => order.id);
    
    // Add some debugging logs
    console.log(`Searching for unread messages for user ${userId} with orders: ${orderIds.join(', ')}`);
    
    // Use the Drizzle ORM query for better type handling
    const unreadMessages = await db.select().from(messages)
      .where(
        and(
          sql`${messages.orderId} IN (${orderIds.join(', ')})`,
          eq(messages.isRead, false),
          eq(messages.isFromAdmin, true)
        )
      )
      .orderBy(desc(messages.createdAt));
    
    console.log(`Found ${unreadMessages.length} unread messages for user ${userId}`);
    return unreadMessages;
  }

  async getUnreadAdminMessages(userId?: number): Promise<Message[]> {
    // Create base conditions
    let conditions = and(
      eq(messages.isRead, false),
      eq(messages.isFromAdmin, false)
    );
    
    // If userId is provided, filter by specific user
    if (userId) {
      conditions = and(
        conditions,
        eq(messages.userId, userId)
      );
    }
    
    const unreadMessages = await db.select().from(messages)
      .where(conditions)
      .orderBy(desc(messages.createdAt));
    
    return unreadMessages;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages)
      .where(eq(messages.id, id));
      
    if (!message) return undefined;
    
    // Find replies
    const replies = await db.select().from(messages)
      .where(eq(messages.parentId, id))
      .orderBy(asc(messages.createdAt));
    
    // Get user and order if exists
    const user = message.userId ? await this.getUser(message.userId) : undefined;
    const order = message.orderId ? await this.getOrder(message.orderId) : undefined;
    const parent = message.parentId ? await this.getMessage(message.parentId) : undefined;
    
    return {
      ...message,
      replies: replies.length > 0 ? replies : undefined,
      user,
      order,
      parent
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  async markOrderMessagesAsRead(orderId: number): Promise<boolean> {
    // Mark all non-admin messages for this order as read
    // (messages from users to admin need to be marked as read by the admin)
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.orderId, orderId),
          eq(messages.isFromAdmin, false)
        )
      )
      .returning();
    
    return result.length >= 0; // Consider success even if no messages were updated
  }
  
  async markOrderMessagesAsReadByUser(orderId: number, userId: number): Promise<boolean> {
    // Mark all admin messages for this order as read by the user (user reading admin messages)
    // Use raw SQL for more direct control
    const result = await db.execute(sql`
      UPDATE messages
      SET is_read = true
      WHERE order_id = ${orderId}
      AND is_from_admin = true
      AND is_read = false
      RETURNING *
    `);
    
    return result.length >= 0; // Consider success even if no messages were updated
  }

  async replyToMessage(parentId: number, message: InsertMessage): Promise<Message> {
    const parentMessage = await this.getMessage(parentId);
    if (!parentMessage) {
      throw new Error("Parent message not found");
    }
    
    // Create the reply with the parentId
    const [newMessage] = await db.insert(messages)
      .values({
        ...message,
        parentId
      })
      .returning();
    
    return newMessage;
  }
}

// Use DatabaseStorage for persistence
export const storage = new DatabaseStorage();
