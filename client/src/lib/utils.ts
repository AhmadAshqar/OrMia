import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format price in Israeli Shekels
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0
  }).format(price);
}

// Format date to Hebrew format
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Calculate discount percentage
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// Get image URL with fallback
export function getImageUrl(url: string, fallback: string = '/images/placeholder.jpg'): string {
  return url || fallback;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Use Intersection Observer hook
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
): void {
  const observer = new IntersectionObserver(
    (entries) => {
      callback(entries[0].isIntersecting);
    },
    { threshold: 0.1, ...options }
  );

  if (elementRef.current) {
    observer.observe(elementRef.current);
  }

  // Cleanup observer on unmount
  return () => {
    if (elementRef.current) {
      observer.unobserve(elementRef.current);
    }
  };
}
