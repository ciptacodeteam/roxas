export default function PaymentLoading() {
  return (
    <div className="from-card via-muted-foreground to-foreground/20 fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b text-white">
      <div className="flex flex-col items-center gap-4">
        {/* GANTI dengan Lottie kamu */}
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-white/20 border-t-white" />

        <p className="text-sm text-gray-300">
          Menyiapkan halaman pembayaran...
        </p>
      </div>
    </div>
  );
}
