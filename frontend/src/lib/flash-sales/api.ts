/**
 * Flash Sales API Client
 * Handles HTTP requests for flash sale management
 */

import type {
  FlashSale,
  FlashSaleItem,
  CreateFlashSaleRequest,
  UpdateFlashSaleRequest,
  CreateFlashSaleItemRequest,
  UpdateFlashSaleItemRequest,
  FlashSaleListParams,
  PaginatedResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class FlashSalesApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "FlashSalesApiError";
  }
}

/**
 * Get all flash sales with optional filters
 */
export async function getFlashSales(
  params?: FlashSaleListParams
): Promise<FlashSale[]> {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sales/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new FlashSalesApiError("Failed to fetch flash sales");
  }

  const data = await response.json();

  // Handle paginated response from Django REST Framework
  if (data && typeof data === "object" && "results" in data) {
    return data.results;
  }

  // Handle non-paginated response (array)
  return data;
}

/**
 * Get single flash sale by ID
 */
export async function getFlashSale(id: string): Promise<FlashSale> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sales/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new FlashSalesApiError("Flash sale not found");
    }
    throw new FlashSalesApiError("Failed to fetch flash sale");
  }

  return response.json();
}

/**
 * Create new flash sale
 */
export async function createFlashSale(
  data: CreateFlashSaleRequest
): Promise<FlashSale> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/flash-sales/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to create flash sale",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to create flash sale",
      error.errors
    );
  }

  return response.json();
}

/**
 * Update existing flash sale
 */
export async function updateFlashSale(
  id: string,
  data: UpdateFlashSaleRequest
): Promise<FlashSale> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/flash-sales/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update flash sale",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to update flash sale",
      error.errors
    );
  }

  return response.json();
}

/**
 * Delete flash sale
 */
export async function deleteFlashSale(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/flash-sales/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to delete flash sale",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to delete flash sale",
      error.errors
    );
  }
}

/**
 * Get all flash sale items for a flash sale
 */
export async function getFlashSaleItems(
  flashSaleId: string
): Promise<FlashSaleItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sale-items/?flash_sale=${flashSaleId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new FlashSalesApiError("Failed to fetch flash sale items");
  }

  const data = await response.json();

  // Handle paginated response from Django REST Framework
  if (data && typeof data === "object" && "results" in data) {
    return data.results;
  }

  // Handle non-paginated response (array)
  return data;
}

/**
 * Get single flash sale item by ID
 */
export async function getFlashSaleItem(id: string): Promise<FlashSaleItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sale-items/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new FlashSalesApiError("Flash sale item not found");
    }
    throw new FlashSalesApiError("Failed to fetch flash sale item");
  }

  return response.json();
}

/**
 * Create new flash sale item
 */
export async function createFlashSaleItem(
  data: CreateFlashSaleItemRequest
): Promise<FlashSaleItem> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/flash-sale-items/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to create flash sale item",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to create flash sale item",
      error.errors
    );
  }

  return response.json();
}

/**
 * Update existing flash sale item
 */
export async function updateFlashSaleItem(
  id: string,
  data: UpdateFlashSaleItemRequest
): Promise<FlashSaleItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sale-items/${id}/`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to update flash sale item",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to update flash sale item",
      error.errors
    );
  }

  return response.json();
}

/**
 * Delete flash sale item
 */
export async function deleteFlashSaleItem(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/flash-sale-items/${id}/`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "Failed to delete flash sale item",
    }));
    throw new FlashSalesApiError(
      error.detail || "Failed to delete flash sale item",
      error.errors
    );
  }
}
