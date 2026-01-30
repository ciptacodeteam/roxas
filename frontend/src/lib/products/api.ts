import type {
    Product,
    ProductWithItems,
    PaginatedProductsResponse,
    CreateProductRequest,
    UpdateProductRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ProductsApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public details?: unknown
    ) {
        super(message);
        this.name = "ProductsApiError";
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorDetails: unknown;

        try {
            const errorData = await response.json();
            if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            } else if (typeof errorData === "object") {
                errorDetails = errorData;
                errorMessage = JSON.stringify(errorData);
            }
        } catch {
            errorMessage = await response.text();
        }

        throw new ProductsApiError(errorMessage, response.status, errorDetails);
    }

    const data = await response.json();
    return data;
}

export async function getProducts(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/products/`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await handleResponse<PaginatedProductsResponse | Product[]>(response);

    // Handle both paginated and non-paginated responses
    if (Array.isArray(data)) {
        return data;
    }

    return data.results;
}

/**
 * Get active products (Public)
 */
export async function getActiveProducts(params?: {
    category?: string;
    search?: string;
}): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);

    const response = await fetch(
        `${API_BASE_URL}/api/v1/products/?${queryParams}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const data = await handleResponse<PaginatedProductsResponse | Product[]>(response);

    // Handle both paginated and non-paginated responses
    if (Array.isArray(data)) {
        return data;
    }

    return data.results;
}

export async function getProduct(id: string): Promise<ProductWithItems> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/products/${id}/`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleResponse<ProductWithItems>(response);
}

/**
 * Get active product by slug (Public)
 */
export async function getActiveProductBySlug(slug: string): Promise<ProductWithItems> {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${slug}/`, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return handleResponse<ProductWithItems>(response);
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
    // Check if we have File objects
    const imageIsFile = data.image != null && typeof data.image === 'object' && 'name' in data.image;
    const bannerIsFile = data.banner_image != null && typeof data.banner_image === 'object' && 'name' in data.banner_image;
    const hasFile = imageIsFile || bannerIsFile;

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
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
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

    const response = await fetch(`${API_BASE_URL}/api/admin/products/`, {
        method: "POST",
        credentials: "include",
        headers,
        body,
    });

    return handleResponse<Product>(response);
}

export async function updateProduct(
    id: string,
    data: UpdateProductRequest
): Promise<Product> {
    // Check if we have File objects
    const imageIsFile = data.image != null && typeof data.image === 'object' && 'name' in data.image;
    const bannerIsFile = data.banner_image != null && typeof data.banner_image === 'object' && 'name' in data.banner_image;
    const hasFile = imageIsFile || bannerIsFile;

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
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
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

    const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body,
    });

    return handleResponse<Product>(response);
}

export async function deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}/`, {
        method: "DELETE",
        credentials: "include",
    });

    if (!response.ok) {
        throw new ProductsApiError(`Failed to delete product`, response.status);
    }
}
