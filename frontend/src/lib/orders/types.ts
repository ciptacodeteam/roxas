/**
 * Orders Type Definitions
 */

/**
 * Custom error class for Orders API errors
 */
export class OrdersApiError extends Error {
    constructor(
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "OrdersApiError";
    }
}

export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    product_item_id: string;
    customer_data: Record<string, unknown>;
    original_price: number;
    final_price: number;
    payment_fee: number;
    vat_amount: number;
    total_amount: number;
    status: OrderStatus;
    payment_expires_at: string | null;
    created_at: string;
    updated_at: string;
    paid_at: string | null;
    completed_at: string | null;
    refund_amount: number;
    refund_reason: string;
    refunded_at: string | null;
    user: {
        id: string;
        email: string;
        name: string | null;
        phone: string | null;
    };
    product_item: {
        id: string;
        name: string;
        product: {
            id: string;
            name: string;
            category: {
                id: string;
                name: string;
            };
        };
    };
    payment: {
        id: string;
        transaction_id: string | null;
        payment_method_id: string | null;
        payment_method: {
            id: string;
            name: string;
            type: string;
            bank: string | null;
        } | null;
        status: string | null;
        amount: number;
        paid_at: string | null;
        expires_at: string | null;
    } | null;
    digiflazz_tx: {
        id: string;
        ref_id: string;
        trx_id: string | null;
        status: string;
        message: string | null;
        rc: string | null;
        sn: string | null;
    } | null;
}

export type OrderStatus =
    | "PENDING"
    | "PAID"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "REFUNDED"
    | "EXPIRED";

export interface OrderFilters {
    status?: OrderStatus | "all";
    payment_status?: string;
}
