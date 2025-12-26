"use client";

import { useEffect } from "react";
import { Toaster as Sonner } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Ensure dark theme is applied for gaming aesthetic
    document.documentElement.classList.add('dark');
    
    // Cleanup function to remove dark class when unmounting (if user navigates away)
    return () => {
      // Only remove if we're navigating away from admin routes
      if (!window.location.pathname.startsWith('/admin')) {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  return (
    <div 
      className="dark min-h-screen"
      style={{
        // Force dark theme colors
        '--background': '#151a22',
        '--foreground': '#ffffff',
        '--card': 'oklch(0.205 0 0)',
        '--card-foreground': 'oklch(0.985 0 0)',
        '--popover': 'oklch(0.205 0 0)',
        '--popover-foreground': 'oklch(0.985 0 0)',
        '--primary': 'oklch(0.922 0 0)',
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--secondary': 'oklch(0.269 0 0)',
        '--secondary-foreground': 'oklch(0.985 0 0)',
        '--muted': 'oklch(0.269 0 0)',
        '--muted-foreground': 'oklch(0.708 0 0)',
        '--accent': 'oklch(0.269 0 0)',
        '--accent-foreground': 'oklch(0.985 0 0)',
        '--destructive': 'oklch(0.704 0.191 22.216)',
        '--border': 'oklch(1 0 0 / 10%)',
        '--input': 'oklch(1 0 0 / 15%)',
        '--ring': 'oklch(0.556 0 0)',
        '--sidebar': 'oklch(0.205 0 0)',
        '--sidebar-foreground': 'oklch(0.985 0 0)',
        '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
        '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
        '--sidebar-accent': 'oklch(0.269 0 0)',
        '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
        '--sidebar-border': 'oklch(1 0 0 / 10%)',
        '--sidebar-ring': 'oklch(0.556 0 0)',
      } as React.CSSProperties}
    >
      <div className="min-h-screen bg-[#151a22] text-white">
        {children}
      </div>
      <Sonner
        theme="dark"
        position="top-center"
        className="toaster group"
        icons={{
          success: <CircleCheckIcon className="size-4 text-green-400" />,
          info: <InfoIcon className="size-4 text-blue-400" />,
          warning: <TriangleAlertIcon className="size-4 text-yellow-400" />,
          error: <OctagonXIcon className="size-4 text-red-400" />,
          loading: <Loader2Icon className="size-4 animate-spin text-gray-400" />,
        }}
        toastOptions={{
          duration: 4000, // Default 4 seconds
          unstyled: false,
          classNames: {
            toast: "!bg-[#1B2129] !text-white !border !border-gray-800",
            success: "!bg-green-950/50 !text-green-100 !border-green-800",
            error: "!bg-red-950/50 !text-red-100 !border-red-800",
            warning: "!bg-yellow-950/50 !text-yellow-100 !border-yellow-800",
            info: "!bg-blue-950/50 !text-blue-100 !border-blue-800",
          },
        }}
      />
    </div>
  );
}

