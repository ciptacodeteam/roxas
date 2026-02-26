import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { API_URL } from "@/lib/api-url"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build full image URL from backend response
 * Handles both absolute URLs and relative paths
 */
export function getImageUrl(imageUrl: string | null | undefined, fallback: string = "/img/placeholder.webp"): string {
  if (!imageUrl) return fallback;

  // If already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Build full URL with backend API URL
  const backendUrl = API_URL;
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

  return `${backendUrl}${cleanPath}`;
}

/**
 * Get product image with fallback to static images based on slug
 */
export function getProductImage(imageUrl: string | null | undefined, slug?: string): string {
  // If image URL exists, use it
  if (imageUrl) {
    return getImageUrl(imageUrl);
  }

  // Fallback to static images based on slug
  const slugImageMap: Record<string, string> = {
    'mobile-legends': '/games/ml.webp',
    'mobile-legends-mlbb': '/games/ml.webp',
    'mobile-legends-login': '/games/ml2.webp',
    'mobile-legends-via-login': '/games/ml2.webp',
    'free-fire': '/games/ff.webp',
    'free-fire-garena': '/games/ff.webp',
    'pubg-mobile': '/games/pubg.webp',
    'roblox-robux': '/games/roblox.webp',
    'roblox-gamepass': '/games/roblox2.webp',
    'roblox-gamepass-robux': '/games/roblox2.webp',
    'roblox-via-login': '/games/roblox.webp',
    'pulsa-telkomsel': '/games/pulsa.webp',
  };

  return slug && slugImageMap[slug] ? slugImageMap[slug] : '/img/ffcover.webp';
}
