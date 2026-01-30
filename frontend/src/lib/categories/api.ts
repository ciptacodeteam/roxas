import type {
    Category,
    CategoryWithCount,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class CategoriesApiError extends Error {
    constructor(
        message: string,
        public errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = "CategoriesApiError";
    }
}

/**
 * Get all categories (Admin)
 */
export async function getCategories(): Promise<Category[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/categories/`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new CategoriesApiError("Failed to fetch categories");
    }

    const data = await response.json();

    // Handle paginated response from Django REST Framework
    if (data && typeof data === "object" && "results" in data) {
        return data.results;
    }

    // Handle non-paginated response (array)
    return Array.isArray(data) ? data : [];
}

/**
 * Get active categories (Public)
 */
export async function getActiveCategories(): Promise<Category[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/categories/`,
        {
            method: "GET",
        }
    );

    if (!response.ok) {
        throw new CategoriesApiError("Failed to fetch active categories");
    }

    const data = await response.json();

    // Handle paginated response from Django REST Framework
    if (data && typeof data === "object" && "results" in data) {
        return data.results;
    }

    // Handle non-paginated response (array)
    return Array.isArray(data) ? data : [];
}

/**
 * Get single category by ID
 */
export async function getCategory(id: string): Promise<CategoryWithCount> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/categories/${id}/`,
        {
            method: "GET",
            credentials: "include",
        }
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new CategoriesApiError("Category not found");
        }
        throw new CategoriesApiError("Failed to fetch category");
    }

    return await response.json();
}

/**
 * Create a new category
 */
export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/categories/`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new CategoriesApiError(
            error.detail || "Failed to create category",
            error
        );
    }

    return await response.json();
}

/**
 * Update a category
 */
export async function updateCategory(
    id: string,
    data: UpdateCategoryRequest
): Promise<Category> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/categories/${id}/`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new CategoriesApiError(
            error.detail || "Failed to update category",
            error
        );
    }

    return await response.json();
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
    const response = await fetch(
        `${API_BASE_URL}/api/v1/admin/categories/${id}/`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new CategoriesApiError(
            error.detail || "Failed to delete category",
            error
        );
    }
}
