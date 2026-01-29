/**
 * Marketing Banners Module Types
 * Type definitions for marketing banner management
 */

export interface MarketingBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  link: string;
  is_active: boolean;
  is_active_now?: boolean;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMarketingBannerRequest {
  title?: string;
  description?: string;
  image: string | File;
  link?: string;
  is_active?: boolean;
  sort_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface UpdateMarketingBannerRequest {
  title?: string;
  description?: string;
  image?: string | File;
  link?: string;
  is_active?: boolean;
  sort_order?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface MarketingBannerListParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
