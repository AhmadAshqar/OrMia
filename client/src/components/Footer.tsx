import { Link } from "wouter";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const categories = [
  { name: "טבעות אירוסין", href: "/category/engagement-rings" },
  { name: "טבעות נישואין", href: "/category/wedding-rings" },
  { name: "שרשראות", href: "/category/necklaces" },
  { name: "צמידים", href: "/category/bracelets" },
  { name: "עגילים", href: "/category/earrings" },
  { name: "קולקציות מיוחדות", href: "/category/special-collections" },
];

const infoLinks = [
  { name: "אודות", href: "/about" },
  { name: "משלוח ומדיניות החזרה", href: "/shipping-policy" },
  { name: "שאלות נפוצות", href: "/faq" },
  { name: "תנאי שימוש", href: "/terms" },
  { name: "מדיניות פרטיות", href: "/privacy" },
  { name: "צור קשר", href: "/contact" },
];

const contactInfo = [
  { icon: "map-marker", text: "רחוב אלנבי 40, תל אביב" },
  { icon: "phone", text: "03-1234567" },
  { icon: "envelope", text: "info@luxmoissanite.co.il" },
  { icon: "clock", text: "א'-ה': 9:00-19:00\nו': 9:00-14:00" },
];

export default function Footer() {
  return (
    <footer className="bg-[hsl(var(--black-dark))] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-serif mb-6">
              <span className="text-[hsl(var(--gold))]">לוקס</span>מויסנייט
            </h3>
            <p className="text-white/70 mb-6">
              אנו מתמחים באספקת תכשיטי מויסנייט יוקרתיים באיכות גבוהה במחירים תחרותיים, עם משלוח מהיר לכל רחבי ישראל.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[hsl(var(--gold))] transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[hsl(var(--gold))] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://pinterest.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[hsl(var(--gold))] transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-[hsl(var(--gold))] transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">קטגוריות</h4>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <Link 
                    href={category.href}
                    className="text-white/70 hover:text-[hsl(var(--gold))] transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">מידע</h4>
            <ul className="space-y-3">
              {infoLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-[hsl(var(--gold))] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">צור קשר</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--gold))] mt-1 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white/70">רחוב אלנבי 40, תל אביב</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--gold))] mt-1 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-white/70">03-1234567</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--gold))] mt-1 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-white/70">info@luxmoissanite.co.il</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[hsl(var(--gold))] mt-1 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white/70">א'-ה': 9:00-19:00<br />ו': 9:00-14:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm mb-4 md:mb-0">© 2023 לוקס מויסנייט. כל הזכויות שמורות.</p>
          <div className="flex gap-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" 
              alt="Visa" 
              className="h-8 w-auto bg-white/90 p-1 rounded"
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" 
              alt="Mastercard" 
              className="h-8 w-auto bg-white/90 p-1 rounded"
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png" 
              alt="PayPal" 
              className="h-8 w-auto bg-white/90 p-1 rounded"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
