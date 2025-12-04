"use client";

import { useState, useEffect, useRef } from "react";
import { Headset } from "lucide-react";

export default function ChatButton() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Close if click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="fixed right-8 bottom-0 z-50">
      <div ref={boxRef} className="relative">
        {/* Dropdown */}
        {open && (
          <div className="animate-fadeIn absolute right-0 bottom-14 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0f0f0f] shadow-xl">
            <div className="border-b border-white/10 p-4 text-sm font-semibold text-white">
              CHAT CS
            </div>

            <div className="flex flex-col text-sm text-white">
              {[
                "Customer Service (WhatsApp)",
                "Instagram",
              ].map((item, i) => (
                <button
                  key={i}
                  className="px-4 py-3 text-left transition hover:bg-white/10 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setOpen(!open)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-t-xl px-4 py-2 font-medium text-white transition cursor-pointer"
        >
          <Headset size={20} /> CHAT CS
        </button>
      </div>
    </div>
  );
}
