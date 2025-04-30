import { 
  products, type Product, type InsertProduct,
  categories, type Category, type InsertCategory,
  carts, type Cart, type InsertCart,
  cartItems, type CartItem, type InsertCartItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  admins, type Admin, type InsertAdmin,
  inventory, type Inventory, type InsertInventory
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categorySlug: string): Promise<Product[]>;
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
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private contactMessages: Map<number, ContactMessage>;
  
  private productId: number = 1;
  private categoryId: number = 1;
  private cartId: number = 1;
  private cartItemId: number = 1;
  private contactMessageId: number = 1;

  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.contactMessages = new Map();
    
    // Initialize with seed data
    this.initializeData();
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
}

export const storage = new MemStorage();
