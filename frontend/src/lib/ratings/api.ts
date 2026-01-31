/**
 * Ratings API Client
 * Handles HTTP requests to Django backend for ratings management
 */

import type { Rating, UpdateRatingRequest, RatingFilters } from "./types";
import { RatingsApiError } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        credentials: "include",
        headers: {
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new RatingsApiError(
            error.message || error.detail || "Request failed",
            error
        ) as RatingsApiError;
    }

    return response.json();
}

/**
 * Get all ratings
 */
export async function getRatings(filters?: RatingFilters): Promise<Rating[]> {
    const queryParams = new URLSearchParams();
    if (filters?.product_id) {
        queryParams.set("product_id", filters.product_id);
    }
    if (filters?.rating) {
        queryParams.set("rating", filters.rating.toString());
    }
    if (filters?.is_active !== undefined) {
        queryParams.set("is_active", filters.is_active.toString());
    }

    const url = `/api/admin/ratings${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return fetchAPI<Rating[]>(url);
}

/**
 * Get single rating by ID
 */
export async function getRating(id: string): Promise<Rating> {
    return fetchAPI<Rating>(`/api/admin/ratings/${id}`);
}

/**
 * Update rating
 */
export async function updateRating(
    id: string,
    data: UpdateRatingRequest
): Promise<Rating> {
    return fetchAPI<Rating>(`/api/admin/ratings/${id}/`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
}

/**
 * Delete rating
 */
export async function deleteRating(id: string): Promise<void> {
    return fetchAPI<void>(`/api/admin/ratings/${id}/`, {
        method: "DELETE",
    });
}
