/**
 * Ratings Type Definitions
 */

/**
 * Custom error class for Ratings API errors
 */
export class RatingsApiError extends Error {
    constructor(
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "RatingsApiError";
    }
}

export interface Rating {
    id: string;
    product_id: string;
    user_id: string | null;
    rating: number;
    comment: string;
    user_name: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    product: {
        id: string;
        name: string;
        slug: string;
    };
    user: {
        id: string;
        email: string;
        name: string | null;
    } | null;
}

export interface RatingFilters {
    product_id?: string;
    rating?: number;
    is_active?: boolean;
}

export interface UpdateRatingRequest {
    product_id?: string;
    rating?: number;
    comment?: string;
    user_name?: string;
    is_active?: boolean;
    sort_order?: number;
}
