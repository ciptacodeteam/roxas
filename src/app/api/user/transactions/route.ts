import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { getServerAuthSession } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user's orders with related data
    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      include: {
        productItem: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        payment: true,
        digiflazzTx: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform orders to transaction format
    const transactions = orders.map((order) => {
      // Map status - prioritize Digiflazz status if available, otherwise use Order status
      // Digiflazz status: "Pending", "Sukses", "Gagal"
      // Order status: PENDING, PAID, PROCESSING, COMPLETED, FAILED, REFUNDED, EXPIRED
      let status: "Sukses" | "Kadaluarsa" | "Belum Dibayar" = "Belum Dibayar";
      
      // If Digiflazz transaction exists, use its status as primary source
      if (order.digiflazzTx?.status) {
        const digiflazzStatus = order.digiflazzTx.status.toLowerCase();
        if (digiflazzStatus === "sukses") {
          status = "Sukses";
        } else if (digiflazzStatus === "gagal") {
          status = "Kadaluarsa";
        } else if (digiflazzStatus === "pending") {
          status = "Belum Dibayar";
        }
      } else {
        // Fallback to Order status if no Digiflazz transaction
        if (order.status === "COMPLETED") {
          status = "Sukses";
        } else if (order.status === "EXPIRED") {
          status = "Kadaluarsa";
        } else if (order.status === "PENDING" || order.status === "PAID" || order.status === "PROCESSING") {
          status = "Belum Dibayar";
        } else if (order.status === "FAILED" || order.status === "REFUNDED") {
          status = "Kadaluarsa";
        }
      }

      // Format date
      const date = new Date(order.createdAt);
      const formattedDate = date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return {
        id: order.id,
        faktur: order.orderNumber,
        kategori: order.productItem.product.category.name,
        layanan: order.productItem.name,
        tanggal: formattedDate,
        status: status,
        orderStatus: order.status,
        finalPrice: order.finalPrice,
        originalPrice: order.originalPrice,
        customerData: order.customerData,
        digiflazzStatus: order.digiflazzTx?.status,
        paymentStatus: order.payment?.status,
      };
    });

    return NextResponse.json(
      {
        success: true,
        transactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get transactions" },
      { status: 500 }
    );
  }
}

