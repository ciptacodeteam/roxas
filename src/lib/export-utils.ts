/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<string, string>
) {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key));
  });

  const keys = Array.from(allKeys);

  // Create header row
  const headerRow = keys.map((key) => {
    const header = headers?.[key] || key;
    // Escape commas and quotes in header
    return `"${String(header).replace(/"/g, '""')}"`;
  });

  // Create data rows
  const dataRows = data.map((item) => {
    return keys.map((key) => {
      const value = item[key];
      let cellValue = "";

      if (value === null || value === undefined) {
        cellValue = "";
      } else if (typeof value === "object") {
        // Handle nested objects (e.g., user.email, productItem.name)
        if (Array.isArray(value)) {
          cellValue = JSON.stringify(value);
        } else {
          // Try to extract meaningful string representation
          cellValue = JSON.stringify(value);
        }
      } else {
        cellValue = String(value);
      }

      // Escape commas, quotes, and newlines
      return `"${cellValue.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "")}"`;
    });
  });

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows]
    .map((row) => row.join(","))
    .join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format order data for export
 */
export function formatOrderForExport(order: any) {
  return {
    "Order Number": order.orderNumber,
    "User Email": order.user?.email || "",
    "User Name": order.user?.name || "",
    "Product Name": order.productItem?.product?.name || "",
    "Product Item": order.productItem?.name || "",
    "Category": order.productItem?.product?.category?.name || "",
    "Original Price": order.originalPrice || 0,
    "Final Price": order.finalPrice || 0,
    "Status": order.status || "",
    "Payment Status": order.payment?.status || "",
    "Payment Method": order.payment?.paymentMethod?.name || "",
    "Payment Amount": order.payment?.amount || 0,
    "Transaction ID": order.payment?.transactionId || "",
    "Digiflazz Status": order.digiflazzTx?.status || "",
    "Digiflazz Transaction ID": order.digiflazzTx?.trxId || "",
    "Customer Data": JSON.stringify(order.customerData || {}),
    "Created At": order.createdAt || "",
    "Paid At": order.paidAt || "",
    "Completed At": order.completedAt || "",
  };
}

/**
 * Format transaction data for export
 */
export function formatTransactionForExport(transaction: any) {
  return {
    "Order Number": transaction.orderNumber,
    "User Email": transaction.user?.email || "",
    "User Name": transaction.user?.name || "",
    "User Phone": transaction.user?.phone || "",
    "Product Name": transaction.productItem?.product?.name || "",
    "Product Item": transaction.productItem?.name || "",
    "Category": transaction.productItem?.product?.category?.name || "",
    "Original Price": transaction.originalPrice || 0,
    "Final Price": transaction.finalPrice || 0,
    "Order Status": transaction.status || "",
    "Payment Status": transaction.payment?.status || "",
    "Payment Method": transaction.payment?.paymentMethod?.name || "",
    "Payment Type": transaction.payment?.paymentMethod?.type || "",
    "Payment Bank": transaction.payment?.paymentMethod?.bank || "",
    "Payment Amount": transaction.payment?.amount || 0,
    "Transaction ID": transaction.payment?.transactionId || "",
    "Payment Expires At": transaction.payment?.expiresAt || "",
    "Payment Paid At": transaction.payment?.paidAt || "",
    "Digiflazz Status": transaction.digiflazzTx?.status || "",
    "Digiflazz Transaction ID": transaction.digiflazzTx?.trxId || "",
    "Digiflazz Ref ID": transaction.digiflazzTx?.refId || "",
    "Digiflazz Message": transaction.digiflazzTx?.message || "",
    "Serial Number": transaction.digiflazzTx?.serialNumber || "",
    "Customer Data": JSON.stringify(transaction.customerData || {}),
    "Created At": transaction.createdAt || "",
    "Updated At": transaction.updatedAt || "",
    "Paid At": transaction.paidAt || "",
    "Completed At": transaction.completedAt || "",
  };
}

