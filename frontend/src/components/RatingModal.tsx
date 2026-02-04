"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  isSubmitting?: boolean;
  orderNumber?: string;
}

export function RatingModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  orderNumber,
}: RatingModalProps) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedRating) {
      onSubmit(selectedRating);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedRating(null);
      setHoveredStar(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-white">
            Bagaimana pengalaman Anda?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            {orderNumber && (
              <span className="block mb-2">Pesanan #{orderNumber}</span>
            )}
            Berikan rating untuk produk yang Anda beli
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Star Rating */}
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive =
                hoveredStar !== null
                  ? star <= hoveredStar
                  : selectedRating !== null
                    ? star <= selectedRating
                    : false;

              return (
                <button
                  key={star}
                  type="button"
                  disabled={isSubmitting}
                  onMouseEnter={() => !isSubmitting && setHoveredStar(star)}
                  onMouseLeave={() => !isSubmitting && setHoveredStar(null)}
                  onClick={() => !isSubmitting && setSelectedRating(star)}
                  className="transition-all duration-200 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Star
                    className={`w-12 h-12 transition-all ${
                      isActive
                        ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                        : "fill-gray-600 text-gray-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Rating Label */}
          {selectedRating && (
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                {selectedRating === 1 && "Sangat Buruk"}
                {selectedRating === 2 && "Buruk"}
                {selectedRating === 3 && "Cukup"}
                {selectedRating === 4 && "Baik"}
                {selectedRating === 5 && "Sangat Baik"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedRating} dari 5 bintang
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Nanti Saja
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedRating || isSubmitting}
              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Rating"}
            </Button>
          </div>
        </div>

        {/* Decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400" />
      </DialogContent>
    </Dialog>
  );
}
