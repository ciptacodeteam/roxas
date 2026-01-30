/**
 * Payment Methods API Client
 * Handles HTTP requests for payment method management
 */

import type {
  PaymentMethod,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethodListParams,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class PaymentMethodsApiError extends Error {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "PaymentMethodsApiError";
  }
}

/**
 * Get all payment methods with optional filters
 */
export async function getPaymentMethods(
  params?: PaymentMethodListParams
): Promise<PaymentMethod[]> {
  const queryParams = new URLSearchParams();
  
  if (params?.search) queryParams.append("search", params.search);
  if (params?.is_active !== undefined) queryParams.append("is_active", String(params.is_active));
  if (params?.type) queryParams.append("type", params.type);
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.page_size) queryParams.append("page_size", String(params.page_size));

  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/payment-methods/?${queryParams}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new PaymentMethodsApiError("Failed to fetch payment methods");
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
 * Get single payment method by ID
 */
export async function getPaymentMethod(id: string): Promise<PaymentMethod> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/payment-methods/${id}/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new PaymentMethodsApiError("Payment method not found");
    }
    throw new PaymentMethodsApiError("Failed to fetch payment method");
  }

  return response.json();
}

/**
 * Create new payment method
 */
export async function createPaymentMethod(
  data: CreatePaymentMethodRequest
): Promise<PaymentMethod> {
  // Check if we need to use FormData (for file uploads)
  const hasFile = data.icon instanceof File;
  
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
    `${API_BASE_URL}/api/v1/admin/payment-methods/`,
    {
      method: "POST",
      headers,
      credentials: "include",
      body,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new PaymentMethodsApiError(
      errorData.detail || "Failed to create payment method",
      errorData
    );
  }

  return response.json();
}

/**
 * Update existing payment method
 */
export async function updatePaymentMethod(
  id: string,
  data: UpdatePaymentMethodRequest
): Promise<PaymentMethod> {
  // Check if we need to use FormData (for file uploads)
  const hasFile = data.icon instanceof File;
  
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
    `${API_BASE_URL}/api/v1/admin/payment-methods/${id}/`,
    {
      method: "PATCH",
      headers,
      credentials: "include",
      body,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new PaymentMethodsApiError(
      errorData.detail || "Failed to update payment method",
      errorData
    );
  }

  return response.json();
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(id: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/admin/payment-methods/${id}/`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PaymentMethodsApiError(
      errorData.detail || "Failed to delete payment method"
    );
  }
}

/**
 * Get active payment methods (Public API)
 */
export async function getActivePaymentMethods(): Promise<PaymentMethod[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/payment-methods/?is_active=true`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new PaymentMethodsApiError("Failed to fetch active payment methods");
  }

  const data = await response.json();
  return data.results || data;
}
