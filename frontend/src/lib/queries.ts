import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";

// ============================================
// Query Keys Factory
// ============================================

export const queryKeys = {
  // Categories
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: string) => [...queryKeys.categories.lists(), { filters }] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: { categoryName?: string; categorySlug?: string; limit?: number }) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
  },

  // Product Items
  productItems: {
    all: ["product-items"] as const,
    lists: () => [...queryKeys.productItems.all, "list"] as const,
    list: (filters?: { category?: string; search?: string }) =>
      [...queryKeys.productItems.lists(), filters] as const,
    details: () => [...queryKeys.productItems.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.productItems.details(), id] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (filters?: { status?: string; paymentStatus?: string }) =>
      [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Dashboard
  dashboard: {
    all: ["dashboard"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },

  // Transactions
  transactions: {
    all: ["transactions"] as const,
    user: () => [...queryKeys.transactions.all, "user"] as const,
    admin: (filters?: { status?: string; paymentStatus?: string }) =>
      [...queryKeys.transactions.all, "admin", filters] as const,
    details: () => [...queryKeys.transactions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },

  // Users
  users: {
    all: ["users"] as const,
    lists: () => [...queryKeys.users.all, "list"] as const,
    list: (filters?: { search?: string }) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // User Profile
  profile: {
    all: ["profile"] as const,
    current: () => [...queryKeys.profile.all, "current"] as const,
  },

  // Marketing Banners
  banners: {
    all: ["banners"] as const,
    lists: () => [...queryKeys.banners.all, "list"] as const,
    active: () => [...queryKeys.banners.all, "active"] as const,
  },

  // Flash Sales
  flashSales: {
    all: ["flash-sales"] as const,
    lists: () => [...queryKeys.flashSales.all, "list"] as const,
    active: () => [...queryKeys.flashSales.all, "active"] as const,
    details: () => [...queryKeys.flashSales.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.flashSales.details(), id] as const,
  },

  // Price Sync
  priceSync: {
    all: ["price-sync"] as const,
    status: () => [...queryKeys.priceSync.all, "status"] as const,
  },

  // Coupons
  coupons: {
    all: ["coupons"] as const,
    lists: () => [...queryKeys.coupons.all, "list"] as const,
    list: (filters?: { isActive?: boolean; search?: string }) =>
      [...queryKeys.coupons.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.coupons.all, "detail", id] as const,
  },

  // Payment Methods
  paymentMethods: {
    all: ["payment-methods"] as const,
    lists: () => [...queryKeys.paymentMethods.all, "list"] as const,
    active: () => [...queryKeys.paymentMethods.all, "active"] as const,
    details: () => [...queryKeys.paymentMethods.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.paymentMethods.details(), id] as const,
  },

  // Ratings
  ratings: {
    all: ["ratings"] as const,
    lists: () => [...queryKeys.ratings.all, "list"] as const,
    list: (filters?: { productId?: string; isActive?: boolean; search?: string }) =>
      [...queryKeys.ratings.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.ratings.all, "detail", id] as const,
  },
};

// ============================================
// Helper Functions
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  // If URL doesn't start with http, prepend the API_BASE_URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    credentials: "include", // Include cookies for authentication
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Request failed");
  }

  return data.data || data;
}

// ============================================
// Query Hooks
// ============================================

// Categories
export function useCategories(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/categories/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      // Handle paginated response from Django REST Framework
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }

      // Handle non-paginated response (array)
      return Array.isArray(data) ? data : [];
    },
    ...options,
  });
}

export function useCategory(id: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/categories/${id}`),
    enabled: !!id,
    ...options,
  });
}

// Products
export function useProducts(
  filters?: { categoryName?: string; categorySlug?: string; limit?: number },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.categoryName) queryParams.set("categoryName", filters.categoryName);
  if (filters?.categorySlug) queryParams.set("category", filters.categorySlug);
  if (filters?.limit) queryParams.set("limit", filters.limit.toString());

  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/products/?${queryParams.toString()}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      // Handle paginated response from Django REST Framework
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }

      // Handle non-paginated response (array)
      return Array.isArray(data) ? data : [];
    },
    ...options,
  });
}

export function useProduct(slug: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => fetchJSON<any>(`/api/products/${slug}`),
    enabled: !!slug,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...options,
  });
}

// Product Items
export function useProductItems(
  filters?: { category?: string; search?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.set("category", filters.category);
  if (filters?.search) queryParams.set("search", filters.search);

  return useQuery({
    queryKey: queryKeys.productItems.list(filters),
    queryFn: () => fetchJSON<any[]>(`/api/admin/product-items?${queryParams.toString()}`),
    ...options,
  });
}

// Transactions
export function useUserTransactions(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.transactions.user(),
    queryFn: async () => {
      const response = await fetch("/api/user/transactions");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch transactions");
      }
      return data.transactions || [];
    },
    ...options,
  });
}

export function useAdminTransactions(
  filters?: { status?: string; paymentStatus?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.paymentStatus) queryParams.set("paymentStatus", filters.paymentStatus);

  return useQuery({
    queryKey: queryKeys.transactions.admin(filters),
    queryFn: () => fetchJSON<any[]>(`/api/admin/transactions?${queryParams.toString()}`),
    ...options,
  });
}

export function useAdminTransaction(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/transactions/${id}`),
    enabled: !!id,
    ...options,
  });
}

// Marketing Banners
export function useMarketingBanners(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.banners.active(),
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/banners/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch marketing banners");
      }

      const data = await response.json();

      // Handle paginated response from Django REST Framework
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }

      // Handle non-paginated response (array)
      return Array.isArray(data) ? data : [];
    },
    ...options,
  });
}

// Price Sync Status
export function usePriceSyncStatus(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.priceSync.status(),
    queryFn: () => fetchJSON<any>("/api/admin/sync-prices"),
    refetchInterval: 5000, // Poll every 5 seconds when syncing
    ...options,
  });
}

// Payment Methods
export function usePaymentMethods(
  filters?: { isActive?: boolean },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) queryParams.set("isActive", filters.isActive.toString());

  return useQuery({
    queryKey: queryKeys.paymentMethods.lists(),
    queryFn: () => fetchJSON<any[]>(`/api/admin/payment-methods?${queryParams.toString()}`),
    ...options,
  });
}

// Admin Payment Methods
export function useAdminPaymentMethods(
  filters?: { isActive?: boolean },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) queryParams.set("isActive", filters.isActive.toString());

  return useQuery({
    queryKey: queryKeys.paymentMethods.lists(),
    queryFn: () => fetchJSON<any[]>(`/api/admin/payment-methods?${queryParams.toString()}`),
    staleTime: 0, // Data is always stale, refetch on mount
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch if data is stale when component mounts
    ...options,
  });
}

export function useAdminPaymentMethod(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.paymentMethods.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/payment-methods/${id}`),
    enabled: !!id,
    staleTime: 0, // Data is always stale
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...options,
  });
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreatePayment(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productItemId: string; customerData: any; couponCode?: string; paymentMethodId?: string }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Map to Django backend format
      const payload = {
        product_item: data.productItemId,
        customer_data: data.customerData,
        payment_method: data.paymentMethodId,
        coupon_code: data.couponCode || "",
      };
      return fetchJSON<any>(`${apiUrl}/api/v1/orders/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.user() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    ...options,
  });
}

export function useValidateCoupon(
  options?: Omit<UseMutationOptions<any, Error, { code: string; orderAmount: number }>, "mutationFn">
) {
  return useMutation({
    mutationFn: async ({ code, orderAmount }: { code: string; orderAmount: number }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Map to Django backend format
      const payload = {
        code,
        order_amount: orderAmount,
      };
      return fetchJSON<any>(`${apiUrl}/api/v1/coupons/validate/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    ...options,
  });
}

// Admin Coupons
export function useAdminCoupons(
  filters?: { isActive?: boolean; search?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.isActive !== undefined) queryParams.set("isActive", filters.isActive.toString());
  if (filters?.search) queryParams.set("search", filters.search);

  return useQuery({
    queryKey: queryKeys.coupons.list(filters),
    queryFn: () => fetchJSON<any[]>(`/api/admin/coupons?${queryParams.toString()}`),
    ...options,
  });
}

export function useAdminCoupon(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.coupons.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/coupons/${id}`),
    enabled: !!id,
    ...options,
  });
}

// User Profile
export function useUserProfile(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: async () => {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch profile");
      }
      return data.user;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    ...options,
  });
}

export function useUpdateProfile(
  options?: Omit<UseMutationOptions<any, Error, { name: string; phone?: string }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; phone?: string }) => {
      return fetchJSON<any>("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ...options,
    onSuccess: async (data, variables, context) => {
      // Invalidate and refetch the profile data
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.current() });
      await queryClient.refetchQueries({ queryKey: queryKeys.profile.current(), exact: true });

      // Call the original onSuccess if provided
      if (options?.onSuccess) {
        await Promise.resolve(options.onSuccess(data, variables, context, undefined as any));
      }
    },
    onError: (error, variables, context) => {
      // Call the original onError if provided
      if (options?.onError) {
        options.onError(error, variables, context, undefined as any);
      }
    },
  });
}

// ============================================
// Admin Query Hooks
// ============================================

// Admin Products
// @deprecated Use useProducts from @/lib/products instead
export function useAdminProducts(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetchJSON<any[]>("/api/admin/products"),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Admin Product Detail
// @deprecated Use useProduct from @/lib/products instead
export function useAdminProduct(
  productId: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["admin", "products", productId],
    queryFn: () => fetchJSON<any>(`/api/admin/products/${productId}`),
    enabled: !!productId,
    ...options,
  });
}

// Admin Categories
export function useAdminCategories(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchJSON<any[]>("/api/admin/categories"),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Admin Category Detail
export function useAdminCategory(
  categoryId: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["admin", "categories", categoryId],
    queryFn: () => fetchJSON<any>(`/api/admin/categories/${categoryId}`),
    enabled: !!categoryId,
    ...options,
  });
}

// Admin Users
export function useAdminUsers(
  filters?: { search?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.search) queryParams.set("search", filters.search);

  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchJSON<any[]>(`/api/admin/users?${queryParams.toString()}`),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Admin User Detail
export function useAdminUser(
  userId: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchJSON<any>(`/api/admin/users/${userId}`),
    enabled: !!userId,
    ...options,
  });
}

// Admin Product Items
export function useAdminProductItems(
  filters?: { category?: string; search?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.category) queryParams.set("category", filters.category);
  if (filters?.search) queryParams.set("search", filters.search);

  return useQuery({
    queryKey: queryKeys.productItems.list(filters),
    queryFn: () => fetchJSON<any[]>(`/api/admin/product-items?${queryParams.toString()}`),
    ...options,
  });
}

export function useAdminProductItem(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.productItems.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/product-items/${id}`),
    enabled: !!id,
    ...options,
  });
}

// Admin Product Items Select (for dropdowns)
export function useAdminProductItemsSelect(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "product-items", "select"],
    queryFn: () => fetchJSON<any[]>("/api/admin/product-items/select"),
    ...options,
  });
}

// Admin Flash Sales - DEPRECATED: Use @/lib/flash-sales instead
// Kept for backward compatibility during migration
export function useAdminFlashSales(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.flashSales.lists(),
    queryFn: () => fetchJSON<any[]>("/api/v1/admin/flash-sales"),
    ...options,
  });
}

export function useAdminFlashSale(id: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.flashSales.detail(id),
    queryFn: () => fetchJSON<any>(`/api/v1/admin/flash-sales/${id}`),
    enabled: !!id,
    ...options,
  });
}

// Public Active Flash Sales (for homepage)
export function useActiveFlashSales(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.flashSales.active(),
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/flash-sales/`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch active flash sales");
      }

      const data = await response.json();

      // Handle paginated response from Django REST Framework
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results;
      }

      // Handle non-paginated response (array)
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60, // Refetch every 1 minute
    ...options,
  });
}

// Admin Marketing Banners (full list)
export function useAdminMarketingBanners(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.banners.lists(),
    queryFn: () => fetchJSON<any[]>("/api/admin/marketing-banners"),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    ...options,
  });
}

// Admin Marketing Banner Detail
export function useAdminMarketingBanner(
  bannerId: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["admin", "marketing-banners", bannerId],
    queryFn: () => fetchJSON<any>(`/api/admin/marketing-banners/${bannerId}`),
    enabled: !!bannerId,
    ...options,
  });
}

// Admin Orders
export function useAdminOrders(
  filters?: { status?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.status && filters.status !== "all") queryParams.set("status", filters.status);

  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => fetchJSON<any[]>(`/api/v1/admin/orders/?${queryParams.toString()}`),
    ...options,
  });
}

export function useAdminOrder(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => fetchJSON<any>(`/api/v1/admin/orders/${id}/`),
    enabled: !!id,
    ...options,
  });
}

export function useAdminDashboard(
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: () => fetchJSON<any>("/api/v1/admin/dashboard/"),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 30000, // Cache for 30 seconds
    ...options,
  });
}

// Sync Status
export function useSyncStatus(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.priceSync.status(),
    queryFn: async () => {
      const response = await fetch("/api/admin/sync-prices?statusOnly=true");
      const data = await response.json();
      return data.lastSync || null;
    },
    ...options,
  });
}

// ============================================
// Admin Mutation Hooks
// ============================================

// Products Mutations
// @deprecated Use useCreateProduct from @/lib/products instead
export function useCreateProduct(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    ...options,
  });
}

// @deprecated Use useUpdateProduct from @/lib/products instead
export function useUpdateProduct(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    ...options,
  });
}

// @deprecated Use useDeleteProduct from @/lib/products instead
export function useDeleteProduct(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    ...options,
  });
}

// Categories Mutations
export function useCreateCategory(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    ...options,
  });
}

export function useUpdateCategory(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    ...options,
  });
}

export function useDeleteCategory(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
    ...options,
  });
}

// Users Mutations
export function useCreateUser(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

export function useUpdateUser(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
    },
    ...options,
  });
}

export function useDeleteUser(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
    ...options,
  });
}

// Flash Sales Mutations - DEPRECATED: Use @/lib/flash-sales instead
// Kept for backward compatibility during migration
export function useCreateFlashSale(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/v1/admin/flash-sales/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.all });
    },
    ...options,
  });
}

export function useUpdateFlashSale(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/v1/admin/flash-sales/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.all });
    },
    ...options,
  });
}

export function useDeleteFlashSale(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/v1/admin/flash-sales/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.flashSales.all });
    },
    ...options,
  });
}

// Marketing Banners Mutations
export function useCreateMarketingBanner(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/marketing-banners", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
    ...options,
  });
}

export function useUpdateMarketingBanner(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/marketing-banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
    ...options,
  });
}

export function useDeleteMarketingBanner(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/marketing-banners/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.banners.all });
    },
    ...options,
  });
}

// Orders Mutations
export function useUpdateOrder(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
    ...options,
  });
}

export function useRateOrder(
  options?: Omit<UseMutationOptions<any, Error, { orderId: string; rating: number }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, rating }: { orderId: string; rating: number }) => {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/orders/${orderId}/rate/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to submit rating" }));
        throw new Error(error.error || error.message || "Failed to submit rating");
      }

      return response.json();
    },
    onSuccess: (_, { orderId }) => {
      // Invalidate the specific order query
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      // Invalidate all orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
    ...options,
  });
}

// Product Items Mutations
export function useUpdateProductItem(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/product-items/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productItems.all });
    },
    ...options,
  });
}

// Payment Methods Mutations
export function useCreatePaymentMethod(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/payment-methods", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Invalidate all payment method queries
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
      // Also invalidate the lists query specifically
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.lists() });
      // Invalidate active payment methods for public API
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.active() });
    },
    ...options,
  });
}

export function useUpdatePaymentMethod(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/payment-methods/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate all payment method queries
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
      // Also invalidate the lists query specifically
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.lists() });
      // Invalidate the specific detail query
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.detail(variables.id) });
      // Invalidate active payment methods for public API
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.active() });
    },
    ...options,
  });
}

export function useDeletePaymentMethod(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/payment-methods/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate all payment method queries
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
      // Also invalidate the lists query specifically
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.lists() });
      // Invalidate active payment methods for public API
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.active() });
    },
    ...options,
  });
}

// Coupons Mutations
export function useCreateCoupon(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
    ...options,
  });
}

export function useUpdateCoupon(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific coupon detail
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.detail(variables.id) });
    },
    ...options,
  });
}

export function useDeleteCoupon(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    },
    ...options,
  });
}

// Admin Ratings
export function useAdminRatings(
  filters?: { productId?: string; isActive?: boolean; search?: string },
  options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">
) {
  const queryParams = new URLSearchParams();
  if (filters?.productId) queryParams.set("productId", filters.productId);
  if (filters?.isActive !== undefined) queryParams.set("isActive", filters.isActive.toString());
  if (filters?.search) queryParams.set("search", filters.search);

  return useQuery({
    queryKey: queryKeys.ratings.list(filters),
    queryFn: () => fetchJSON<any>(`/api/admin/ratings?${queryParams.toString()}`).then((res) => res.data || []),
    ...options,
  });
}

export function useAdminRating(
  id: string,
  options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.ratings.detail(id),
    queryFn: () => fetchJSON<any>(`/api/admin/ratings/${id}`).then((res) => res.data),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRating(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/ratings", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
    },
    ...options,
  });
}

export function useUpdateRating(
  options?: Omit<UseMutationOptions<any, Error, { id: string; data: any }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return fetchJSON<any>(`/api/admin/ratings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
    },
    ...options,
  });
}

export function useDeleteRating(
  options?: Omit<UseMutationOptions<any, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchJSON<any>(`/api/admin/ratings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
    },
    ...options,
  });
}

// Sync Prices Mutation
export function useSyncPrices(
  options?: Omit<UseMutationOptions<any, Error, { cmd?: string; jsonData?: { prepaid?: any[]; pasca?: any[] }; autoCreate?: boolean }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cmd = "full", jsonData, autoCreate }: { cmd?: string; jsonData?: { prepaid?: any[]; pasca?: any[] }; autoCreate?: boolean } = {}) => {
      return fetchJSON<any>("/api/admin/sync-prices", {
        method: "POST",
        body: JSON.stringify({ cmd, jsonData, autoCreate }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.priceSync.status() });
      queryClient.invalidateQueries({ queryKey: ["admin", "product-items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.productItems.all });
    },
    ...options,
  });
}

