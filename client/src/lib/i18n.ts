import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Hebrew translations
const resources = {
  he: {
    translation: {
      // Header
      'home': 'דף הבית',
      'collections': 'קולקציות',
      'rings': 'טבעות',
      'necklaces': 'שרשראות',
      'earrings': 'עגילים',
      'bracelets': 'צמידים',
      'about': 'אודות',
      'contact': 'צור קשר',
      'faq': 'שאלות נפוצות',
      'cart': 'סל קניות',
      'search': 'חיפוש',
      'login': 'התחברות',
      'register': 'הרשמה',
      'help': 'עזרה',
      
      // Homepage
      'hero_title_1': 'יופי נצחי.',
      'hero_title_2': 'מחיר ללא תחרות.',
      'hero_description': 'תכשיטי מויסנייט יוקרתיים בהתאמה אישית שמשאירים רושם לנצח.',
      'discover_collection': 'גלה את הקולקציה',
      'read_more': 'קרא עוד',
      'free_shipping': 'משלוח חינם בהזמנות מעל ₪1,000',
      
      // Features
      'feature_quality_title': 'איכות ללא פשרות',
      'feature_quality_desc': 'כל תכשיט עובר תהליך ביקורת איכות קפדני לפני שהוא נשלח ללקוח.',
      'feature_shipping_title': 'משלוח מהיר לישראל',
      'feature_shipping_desc': 'משלוח מהיר ומאובטח ישירות לדלת שלך בכל רחבי ישראל.',
      'feature_warranty_title': 'אחריות לכל החיים',
      'feature_warranty_desc': 'אנו עומדים מאחורי המוצרים שלנו עם אחריות מקיפה לכל החיים.',
      
      // Collections
      'our_collections': 'הקולקציות שלנו',
      'collections_description': 'גלו את קולקציות התכשיטים היוקרתיות שלנו, המשלבות מויסנייט באיכות גבוהה עם עיצובים מודרניים וקלאסיים.',
      'view_collection': 'לצפייה בקולקציה',
      'all_collections': 'לכל הקולקציות',
      'engagement_rings': 'טבעות אירוסין',
      'engagement_rings_desc': 'עיצובים ייחודיים לרגע המיוחד.',
      'diamond_necklaces': 'שרשראות יהלום',
      'diamond_necklaces_desc': 'אלגנטיות ונוצצות לכל אירוע.',
      'luxury_earrings': 'עגילי יוקרה',
      'luxury_earrings_desc': 'נוצצים ומרהיבים בכל סגנון.',
      
      // Featured Products
      'featured_products': 'מוצרים מובילים',
      'featured_products_desc': 'התכשיטים היוקרתיים והמבוקשים ביותר שלנו, בעיצוב ייחודי ואיכות גבוהה.',
      'new': 'חדש',
      'sale': 'מבצע',
      'add_to_cart': 'הוסף לסל',
      
      // About
      'about_title': 'יופי שמעבר ליהלום',
      'about_desc_1': 'מויסנייט הוא אבן חן מרהיבה שנתגלתה לראשונה בשנת 1893 על ידי המדען הצרפתי הנרי מויסן. בעלת נצנוץ ובהירות יוצאי דופן, המויסנייט משלבת יופי ועמידות, ולעתים קרובות נחשבת לאלטרנטיבה אתית ויפהפייה ליהלומים.',
      'about_desc_2': 'אצלנו בלוקס מויסנייט, אנו בוחרים רק את אבני המויסנייט באיכות הגבוהה ביותר, המשלבות נצנוץ יוצא דופן עם דירוג צבע וניקיון מעולים. כל תכשיט מעוצב ומיוצר בקפידה כדי להבטיח איכות ועמידות לאורך זמן.',
      'about_feature_1': 'נצנוץ מרהיב וזוהר',
      'about_feature_2': 'עמידות גבוהה מאוד',
      'about_feature_3': 'אלטרנטיבה אתית ליהלומים',
      'about_feature_4': 'ערך מעולה למחיר',
      'discover_more': 'גלה עוד',
      
      // Testimonials
      'testimonials': 'לקוחות מספרים',
      'testimonials_desc': 'מה הלקוחות שלנו אומרים על התכשיטים והשירות שלנו.',
      
      // Instagram
      'follow_instagram': 'עקבו אחרינו באינסטגרם',
      'instagram_desc': 'שתפו את התכשיטים שלכם עם התיוג #לוקסמויסנייט',
      
      // Newsletter
      'newsletter': 'הצטרפו לרשימת התפוצה שלנו',
      'newsletter_desc': 'הירשמו לקבלת עדכונים על מבצעים, קולקציות חדשות ומידע בלעדי.',
      'email_placeholder': 'כתובת האימייל שלך',
      'subscribe': 'הרשמה',
      
      // Footer
      'footer_desc': 'אנו מתמחים באספקת תכשיטי מויסנייט יוקרתיים באיכות גבוהה במחירים תחרותיים, עם משלוח מהיר לכל רחבי ישראל.',
      'categories': 'קטגוריות',
      'engagement_rings_footer': 'טבעות אירוסין',
      'wedding_rings': 'טבעות נישואין',
      'necklaces_footer': 'שרשראות',
      'bracelets_footer': 'צמידים',
      'earrings_footer': 'עגילים',
      'special_collections': 'קולקציות מיוחדות',
      'information': 'מידע',
      'about_footer': 'אודות',
      'shipping_returns': 'משלוח ומדיניות החזרה',
      'disclosure': 'גילוי נאות לצרכן',
      'faq_footer': 'שאלות נפוצות',
      'terms': 'תנאי שימוש',
      'privacy': 'מדיניות פרטיות',
      'contact_footer': 'צור קשר',
      'contact_info': 'צור קשר',
      'address': 'רחוב אלנבי 40, תל אביב',
      'phone': '03-1234567',
      'email': 'info@luxmoissanite.co.il',
      'hours': 'א\'-ה\': 9:00-19:00 ו\': 9:00-14:00',
      'copyright': '© 2023 לוקס מויסנייט. כל הזכויות שמורות.',
      
      // Cart
      'your_cart': 'סל הקניות שלך',
      'empty_cart': 'סל הקניות שלך ריק',
      'start_shopping': 'התחל לקנות',
      'product': 'מוצר',
      'price': 'מחיר',
      'quantity': 'כמות',
      'total': 'סה"כ',
      'subtotal': 'סכום ביניים',
      'shipping': 'משלוח',
      'free': 'חינם',
      'calculated_checkout': 'יחושב בקופה',
      'tax': 'מע"מ',
      'order_total': 'סה"כ להזמנה',
      'continue_shopping': 'המשך קנייה',
      'proceed_checkout': 'המשך לתשלום',
      'remove': 'הסר',
      
      // Checkout
      'checkout': 'קופה',
      'billing_details': 'פרטי חיוב',
      'shipping_details': 'פרטי משלוח',
      'payment': 'תשלום',
      'first_name': 'שם פרטי',
      'last_name': 'שם משפחה',
      'email_address': 'דוא"ל',
      'phone_number': 'טלפון',
      'address_line': 'כתובת',
      'city_name': 'עיר',
      'postal_code': 'מיקוד',
      'country': 'מדינה',
      'same_as_billing': 'פרטי משלוח זהים לפרטי החיוב',
      'payment_method': 'אמצעי תשלום',
      'credit_card': 'כרטיס אשראי',
      'paypal': 'PayPal',
      'bit': 'Bit',
      'place_order': 'בצע הזמנה',
      'order_summary': 'סיכום הזמנה',
      
      // Product detail
      'add_to_wishlist': 'הוסף למועדפים',
      'share': 'שתף',
      'description': 'תיאור',
      'shipping_info': 'מידע על משלוח',
      'returns': 'החזרות',
      'reviews': 'ביקורות',
      'in_stock': 'במלאי',
      'out_of_stock': 'אזל מהמלאי',
      'sku': 'מק"ט',
      'category': 'קטגוריה',
      'related_products': 'מוצרים דומים',
      
      // Contact
      'contact_us': 'צור קשר',
      'contact_desc': 'יש לך שאלות או בקשות מיוחדות? מלא את הטופס ונחזור אליך בהקדם.',
      'message': 'הודעה',
      'send_message': 'שלח הודעה',
      
      // FAQ
      'faqs': 'שאלות נפוצות',
      'faq_desc': 'שאלות ותשובות נפוצות לגבי מוצרינו, משלוחים, אחריות ומדיניות החזרה.',
      
      // Filter
      'filter': 'סינון',
      'sort_by': 'מיין לפי',
      'price_range': 'טווח מחירים',
      'product_category': 'קטגוריה',
      'color': 'צבע',
      'style': 'סגנון',
      'apply_filters': 'החל סינון',
      'reset_filters': 'אפס סינון',
      'price_low_high': 'מחיר: מהנמוך לגבוה',
      'price_high_low': 'מחיר: מהגבוה לנמוך',
      'newest': 'חדש ביותר',
      'popularity': 'פופולריות',
      'discount': 'הנחה'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'he',
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    }
  });

export default i18n;
