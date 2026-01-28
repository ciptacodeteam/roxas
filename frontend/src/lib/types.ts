// Types that were previously from @prisma/client
// Now defined locally since backend is Django-based

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export enum PaymentMethodType {
  BANK_TRANSFER = "BANK_TRANSFER",
  EWALLET = "EWALLET",
  QRIS = "QRIS",
  CONVENIENCE_STORE = "CONVENIENCE_STORE",
  CREDIT_CARD = "CREDIT_CARD",
}

export enum BankTransferBank {
  BCA = "BCA",
  BNI = "BNI",
  BRI = "BRI",
  MANDIRI = "MANDIRI",
  PERMATA = "PERMATA",
  CIMB = "CIMB",
}

export enum FeeType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}
