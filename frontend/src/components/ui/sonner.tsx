"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        duration: 4000, // Default 4 seconds
        unstyled: false,
        classNames: {
          toast: "!bg-[#1B2129] !text-white !border !border-gray-800 !shadow-lg",
          title: "!text-white !font-semibold",
          description: "!text-gray-300",
          success: "!bg-[#1B2129] !text-white !border !border-green-500/30",
          error: "!bg-[#1B2129] !text-white !border !border-red-500/30",
          warning: "!bg-[#1B2129] !text-white !border !border-yellow-500/30",
          info: "!bg-[#1B2129] !text-white !border !border-blue-500/30",
        },
      }}
      style={
        {
          "--normal-bg": "#1B2129",
          "--normal-text": "#ffffff",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--border-radius": "0.625rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
