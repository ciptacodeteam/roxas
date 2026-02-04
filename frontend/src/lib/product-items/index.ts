/**
 * Product Items Module
 * Centralized exports for product items management
 */

// Types
export type {
    ProductItem,
    ProductItemWithProduct,
    CreateProductItemRequest,
    UpdateProductItemRequest,
    SyncPricesRequest,
    SyncPricesResponse,
    SyncStatus,
} from "./types";
export { ProductItemsApiError } from "./types";

// API
export {
    getProductItems,
    getProductItem,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    syncPrices,
    getSyncStatus,
    searchProductItems,
} from "./api";

// Queries
export {
    productItemsQueryKeys,
    useProductItems,
    useSearchProductItems,
    useProductItem,
    useSyncStatus,
    useCreateProductItem,
    useUpdateProductItem,
    useDeleteProductItem,
    useSyncPrices,
} from "./queries";

// Schemas
export {
    CreateProductItemSchema,
    UpdateProductItemSchema,
    SyncPricesSchema,
    type CreateProductItemInput,
    type UpdateProductItemInput,
    type SyncPricesInput,
} from "./schemas";
