import { redirect } from "next/navigation";

export default function ProductItemsPage() {
  // Redirect to price-list page since everything is now managed there
  redirect("/admin/price-list");
}

