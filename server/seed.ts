import { db } from "./db";
import { products, categories, admins, inventory, type InsertProduct, type InsertCategory, type InsertAdmin, type InsertInventory } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");
  
  // Check if data already exists
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) {
    console.log("Data already exists in the database. Skipping seed.");
    return;
  }

  try {
    // Add categories
    const seedCategories: InsertCategory[] = [
      { 
        name: "טבעות אירוסין", 
        slug: "engagement-rings", 
        description: "טבעות אירוסין מויסנייט יוקרתיות לרגע המיוחד", 
        image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
      },
      { 
        name: "טבעות", 
        slug: "rings", 
        description: "טבעות מויסנייט יפהפיות לכל אירוע", 
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
      },
      { 
        name: "שרשראות", 
        slug: "necklaces", 
        description: "שרשראות מויסנייט אלגנטיות", 
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80" 
      },
      { 
        name: "עגילים", 
        slug: "earrings", 
        description: "עגילים מרהיבים משובצים מויסנייט", 
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
      },
      { 
        name: "צמידים", 
        slug: "bracelets", 
        description: "צמידים יוקרתיים משובצים מויסנייט", 
        image: "https://images.unsplash.com/photo-1631982690223-8aa6f588343d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80" 
      },
    ];
    
    console.log("Adding categories...");
    await db.insert(categories).values(seedCategories);
    
    // Get the inserted categories to reference their IDs
    const insertedCategories = await db.select().from(categories);
    const categoryMap = new Map(insertedCategories.map(cat => [cat.slug, cat.id]));
    
    // Add products
    const seedProducts: InsertProduct[] = [
      {
        name: "טבעת מויסנייט קלאסית",
        description: "טבעת מויסנייט קלאסית ויפה, משובצת באבן 1 קראט איכותית בשיבוץ עדין",
        longDescription: "טבעת מויסנייט מרהיבה בעיצוב קלאסי נצחי. האבן המרכזית במשקל 1 קראט מהבהקת באור מדהים ושוברת את האור לקשת של צבעים. העיצוב הנקי וההעבודה המדוקדקת הופכים את הטבעת הזו למיוחדת במינה. טבעת זו מושלמת כטבעת אירוסין, מתנה מיוחדת או כפינוק אישי לעצמך.",
        price: 2199,
        salePrice: null,
        mainImage: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
        images: "https://images.unsplash.com/photo-1595377864610-35a0e1968912,https://images.unsplash.com/photo-1616692043665-73e45f614718",
        categoryId: categoryMap.get("rings") || 0,
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
        images: "https://images.unsplash.com/photo-1611107683227-e9060eccd846,https://images.unsplash.com/photo-1612159797322-b42cd8f54f96",
        categoryId: categoryMap.get("necklaces") || 0,
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
        salePrice: null,
        mainImage: "https://images.unsplash.com/photo-1603033156166-2ae22eb2b7e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1364&q=80",
        images: "https://images.unsplash.com/photo-1588891557811-a70bbd3d0f0a,https://images.unsplash.com/photo-1575863438850-fb1c06fb96d4",
        categoryId: categoryMap.get("earrings") || 0,
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
        images: "https://images.unsplash.com/photo-1602283215677-a7df79dda9cd,https://images.unsplash.com/photo-1573505820103-bdca39cc6ddc",
        categoryId: categoryMap.get("bracelets") || 0,
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
        salePrice: null,
        mainImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
        images: "https://images.unsplash.com/photo-1566977744263-79e677f4e7cf,https://images.unsplash.com/photo-1605092043680-213690441ebb",
        categoryId: categoryMap.get("engagement-rings") || 0,
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
        salePrice: null,
        mainImage: "https://images.unsplash.com/photo-1590548784595-de8ea3e8e27a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1772&q=80",
        images: "https://images.unsplash.com/photo-1571148433239-15d1079cd7d8,https://images.unsplash.com/photo-1620656798795-2995fa4be9da",
        categoryId: categoryMap.get("necklaces") || 0,
        sku: "NECK-MS-002",
        inStock: true,
        isNew: false,
        isFeatured: false,
        rating: 4.7,
        reviewCount: 29
      }
    ];

    console.log("Adding products...");
    await db.insert(products).values(seedProducts);
    
    // Get inserted products for inventory reference
    const insertedProducts = await db.select().from(products);
    
    // Add admin user
    const seedAdmins: InsertAdmin[] = [
      {
        username: "admin",
        password: "admin123",
        email: "admin@moissanite.co.il",
        firstName: "Site",
        lastName: "Admin",
        role: "admin",
        lastLogin: null
      }
    ];
    
    console.log("Adding admin users...");
    await db.insert(admins).values(seedAdmins);
    
    // Add inventory for products
    const seedInventory: InsertInventory[] = insertedProducts.map(product => ({
      productId: product.id,
      quantity: product.inStock ? 10 : 0,
      location: "מחסן ראשי",
      lastUpdated: new Date(),
      minimumStockLevel: 5,
      onOrder: 0,
      expectedDelivery: null,
      updatedBy: null
    }));
    
    console.log("Adding inventory records...");
    await db.insert(inventory).values(seedInventory);
    
    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Execute the seed function
seed();