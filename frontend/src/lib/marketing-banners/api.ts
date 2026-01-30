/**
 * Marketing Banners API Client
 * Handles HTTP requests for marketing banner management
 */

import type {
  MarketingBanner,
  CreateMarketingBannerRequest,
  UpdateMarketingBannerRequest,
  MarketingBannerListParams,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class MarketingBannersApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "MarketingBannersApiError";
  }
}

/**
 * Get all marketing banners with optional filters (Admin)
 */
export async function getMarketingBanners(
  params?: MarketingBannerListParams
): Promise<MarketingBanner[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/marketing-banners/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new MarketingBannersApiError("Failed to fetch marketing banners");
  }

  const data = await response.json();
  
  // Handle paginated response from Django REST Framework
  if (data && typeof data === 'object' && 'results' in data) {
    return data.results;
  }
  
  // Handle non-paginated response (array)
  return data;
}

/**
 * Get active marketing banners (Public)
 */
export async function getActiveMarketingBanners(): Promise<MarketingBanner[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/banners/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new MarketingBannersApiError("Failed to fetch active marketing banners");
  }

  const data = await response.json();
  
  // Handle paginated response from Django REST Framework
  if (data && typeof data === 'object' && 'results' in data) {
    return data.results;
  }
  
  // Handle non-paginated response (array)
  return Array.isArray(data) ? data : [];
}

/**
 * Get single marketing banner by ID
 */
export async function getMarketingBanner(id: string): Promise<MarketingBanner> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/marketing-banners/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new MarketingBannersApiError("Marketing banner not found");
    }
    throw new MarketingBannersApiError("Failed to fetch marketing banner");
  }

  return response.json();
}

/**
 * Create new marketing banner
 */
export async function createMarketingBanner(
  data: CreateMarketingBannerRequest
): Promise<MarketingBanner> {
  // Check if we need to use FormData (for file uploads)
  const hasFile = data.image instanceof File;
  
  let body: BodyInit;
  let headers: HeadersInit = {};
  
  if (hasFile) {
    // Use FormData for file uploads
    const formData = new FormData();
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    body = formData;
    // Don't set Content-Type header - browser will set it with boundary
  } else {
    // Use JSON for data without files
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/marketing-banners/`,
    {
      method: "POST",
      headers,
      credentials: "include",
      body,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new MarketingBannersApiError(
      errorData.detail || "Failed to create marketing banner",
      errorData
    );
  }

  return response.json();
}

/**
 * Update existing marketing banner
 */
export async function updateMarketingBanner(
  id: string,
  data: UpdateMarketingBannerRequest
): Promise<MarketingBanner> {
  // Check if we need to use FormData (for file uploads)
  const hasFile = data.image instanceof File;
  
  let body: BodyInit;
  let headers: HeadersInit = {};
  
  if (hasFile) {
    // Use FormData for file uploads
    const formData = new FormData();
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    body = formData;
    // Don't set Content-Type header - browser will set it with boundary
  } else {
    // Use JSON for data without files
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/marketing-banners/${id}/`,
    {
      method: "PATCH",
      headers,
      credentials: "include",
      body,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new MarketingBannersApiError(
      errorData.detail || "Failed to update marketing banner",
      errorData
    );
  }

  return response.json();
}

/**
 * Delete marketing banner
 */
export async function deleteMarketingBanner(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/marketing-banners/${id}/`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new MarketingBannersApiError(
      errorData.detail || "Failed to delete marketing banner"
    );
  }
}
