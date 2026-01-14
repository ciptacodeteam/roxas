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

  // Transactions
  transactions: {
    all: ["transactions"] as const,
    user: () => [...queryKeys.transactions.all, "user"] as const,
    admin: (filters?: { status?: string; paymentStatus?: string }) =>
      [...queryKeys.transactions.all, "admin", filters] as const,
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
  },
};

// ============================================
// Helper Functions
// ============================================

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
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
    queryFn: () => fetchJSON<any[]>("/api/categories"),
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
    queryFn: () => fetchJSON<any[]>(`/api/products?${queryParams.toString()}`),
    ...options,
  });
}

export function useProduct(slug: string, options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => fetchJSON<any>(`/api/products/${slug}`),
    enabled: !!slug,
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

// Marketing Banners
export function useMarketingBanners(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.banners.active(),
    queryFn: () => fetchJSON<any[]>("/api/marketing-banners"),
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
    queryKey: ["admin", "payment-methods", filters],
    queryFn: () => fetchJSON<any[]>(`/api/admin/payment-methods?${queryParams.toString()}`),
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
      return fetchJSON<any>("/api/payments/create", {
        method: "POST",
        body: JSON.stringify(data),
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
      return fetchJSON<any>("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code, orderAmount }),
      });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.current() });
    },
    ...options,
  });
}

// ============================================
// Admin Query Hooks
// ============================================

// Admin Products
export function useAdminProducts(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => fetchJSON<any[]>("/api/admin/products"),
    ...options,
  });
}

// Admin Categories
export function useAdminCategories(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => fetchJSON<any[]>("/api/admin/categories"),
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

// Admin Product Items Select (for dropdowns)
export function useAdminProductItemsSelect(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: ["admin", "product-items", "select"],
    queryFn: () => fetchJSON<any[]>("/api/admin/product-items/select"),
    ...options,
  });
}

// Admin Flash Sales
export function useAdminFlashSales(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.flashSales.lists(),
    queryFn: () => fetchJSON<any[]>("/api/admin/flash-sales"),
    ...options,
  });
}

// Admin Marketing Banners (full list)
export function useAdminMarketingBanners(options?: Omit<UseQueryOptions<any[]>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.banners.lists(),
    queryFn: () => fetchJSON<any[]>("/api/admin/marketing-banners"),
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
    queryFn: () => fetchJSON<any[]>(`/api/admin/orders?${queryParams.toString()}`),
    ...options,
  });
}

// Sync Status
export function useSyncStatus(options?: Omit<UseQueryOptions<any>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: queryKeys.priceSync.status(),
    queryFn: async () => {
      const response = await fetch("/api/admin/sync-prices");
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

// Flash Sales Mutations
export function useCreateFlashSale(
  options?: Omit<UseMutationOptions<any, Error, any>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      return fetchJSON<any>("/api/admin/flash-sales", {
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
      return fetchJSON<any>(`/api/admin/flash-sales/${id}`, {
        method: "PUT",
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
      return fetchJSON<any>(`/api/admin/flash-sales/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
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
      queryClient.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
    },
    ...options,
  });
}

// Sync Prices Mutation
export function useSyncPrices(
  options?: Omit<UseMutationOptions<any, Error, { cmd?: string }>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cmd = "full" }: { cmd?: string } = {}) => {
      return fetchJSON<any>("/api/admin/sync-prices", {
        method: "POST",
        body: JSON.stringify({ cmd }),
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

