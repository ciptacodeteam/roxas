/**
 * Mock data for development
 * Use this when you want to test sync functionality without hitting the real API
 */

interface MockPriceListItem {
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_sku_code: string;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

/**
 * Mock prepaid price list
 */
export const mockPrepaidPriceList: MockPriceListItem[] = [
  {
    product_name: "Mobile Legends 10 Diamonds",
    category: "Games",
    brand: "MOBILE LEGENDS",
    type: "prepaid",
    seller_name: "Mock Seller",
    price: 2500,
    buyer_sku_code: "ml10",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Mobile Legends 10 Diamonds Top Up",
  },
  {
    product_name: "Mobile Legends 50 Diamonds",
    category: "Games",
    brand: "MOBILE LEGENDS",
    type: "prepaid",
    seller_name: "Mock Seller",
    price: 12000,
    buyer_sku_code: "ml50",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Mobile Legends 50 Diamonds Top Up",
  },
  {
    product_name: "Free Fire 100 Diamonds",
    category: "Games",
    brand: "FREE FIRE",
    type: "prepaid",
    seller_name: "Mock Seller",
    price: 14000,
    buyer_sku_code: "ff100",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Free Fire 100 Diamonds Top Up",
  },
  {
    product_name: "Telkomsel 10.000",
    category: "Pulsa",
    brand: "TELKOMSEL",
    type: "prepaid",
    seller_name: "Mock Seller",
    price: 10500,
    buyer_sku_code: "tsel10",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Pulsa Telkomsel 10.000",
  },
  {
    product_name: "Indosat 10.000",
    category: "Pulsa",
    brand: "INDOSAT",
    type: "prepaid",
    seller_name: "Mock Seller",
    price: 10200,
    buyer_sku_code: "isat10",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Pulsa Indosat 10.000",
  },
];

/**
 * Mock pasca price list
 */
export const mockPascaPriceList: MockPriceListItem[] = [
  {
    product_name: "PLN Postpaid",
    category: "PLN",
    brand: "PLN",
    type: "pasca",
    seller_name: "Mock Seller",
    price: 2500,
    buyer_sku_code: "plnpostpaid",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "PLN Postpaid Bill Payment",
  },
  {
    product_name: "Telkomsel Pascabayar",
    category: "Pulsa",
    brand: "TELKOMSEL",
    type: "pasca",
    seller_name: "Mock Seller",
    price: 2000,
    buyer_sku_code: "tselpasca",
    buyer_product_status: true,
    seller_product_status: true,
    unlimited_stock: true,
    stock: 9999,
    multi: false,
    start_cut_off: "00:00",
    end_cut_off: "23:59",
    desc: "Telkomsel Postpaid Bill Payment",
  },
];

/**
 * Get mock price list
 */
export function getMockPriceList(cmd: "prepaid" | "pasca" = "prepaid") {
  console.log(`[Mock] Using mock data for ${cmd} price list`);
  
  const data = cmd === "prepaid" ? mockPrepaidPriceList : mockPascaPriceList;
  
  return {
    data: {
      rc: "00",
      message: "success",
      data: data,
    },
  };
}

