"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
  disabled,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [time, setTime] = React.useState<string>(
    value
      ? format(new Date(value), "HH:mm")
      : ""
  )
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (value) {
      const dateValue = new Date(value)
      setDate(dateValue)
      setTime(format(dateValue, "HH:mm"))
    } else {
      setDate(undefined)
      setTime("")
    }
  }, [value])

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined)
      if (onChange) onChange("")
      return
    }

    // If time is already set, combine date and time
    if (time) {
      const [hours, minutes] = time.split(":").map(Number)
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(hours || 0, minutes || 0, 0, 0)
      setDate(newDateTime)
      if (onChange) {
        onChange(formatDateTimeLocal(newDateTime))
      }
    } else {
      // Set time to current time if not set
      const now = new Date()
      const newDateTime = new Date(selectedDate)
      newDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0)
      setDate(newDateTime)
      setTime(format(newDateTime, "HH:mm"))
      if (onChange) {
        onChange(formatDateTimeLocal(newDateTime))
      }
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTime(newTime)
    if (date && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(date)
      newDateTime.setHours(hours || 0, minutes || 0, 0, 0)
      setDate(newDateTime)
      if (onChange) {
        onChange(formatDateTimeLocal(newDateTime))
      }
    }
  }

  const displayValue = date
    ? `${format(date, "PPP")} ${time || format(date, "HH:mm")}`
    : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || <span className="text-gray-500">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="bg-gray-900"
          />
          <div className="flex items-center gap-2 border-t border-gray-700 pt-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <Input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="bg-gray-800 text-gray-100 border-gray-700"
              placeholder="HH:mm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

