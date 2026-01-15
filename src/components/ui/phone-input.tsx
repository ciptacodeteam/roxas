"use client";

import * as React from "react";
import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "className"> {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  showLabel?: boolean;
  error?: string;
  className?: string; // Applied to input only
  wrapperClassName?: string; // Applied to wrapper div
}

/**
 * Phone Input Component with +62 (Indonesia) format and validation
 * 
 * Features:
 * - Always shows +62 prefix
 * - Validates Indonesian phone number format
 * - Formats input as user types
 * - Handles existing values (with or without +62)
 */
export function PhoneInput({
  value = "",
  onChange,
  label = "Phone Number",
  showLabel = true,
  error,
  className,
  wrapperClassName,
  id,
  placeholder = "81234567890",
  ...props
}: PhoneInputProps) {
  const inputId = id || "phone-input";
  const [internalValue, setInternalValue] = React.useState("");

  // Initialize internal value from prop
  React.useEffect(() => {
    if (value) {
      // Remove +62 if present, store only the number part
      let numberPart = value.startsWith("+62")
        ? value.slice(3).replace(/\D/g, "")
        : value.replace(/\D/g, "");
      
      // Remove leading zero if present (Indonesian numbers shouldn't start with 0)
      if (numberPart.startsWith("0")) {
        numberPart = numberPart.slice(1);
      }
      
      setInternalValue(numberPart);
    } else {
      setInternalValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove all non-digit characters
    let digitsOnly = input.replace(/\D/g, "");
    
    // Remove leading zero (Indonesian phone numbers shouldn't start with 0 when using +62)
    if (digitsOnly.startsWith("0")) {
      digitsOnly = digitsOnly.slice(1);
    }
    
    // Limit to 13 digits (max Indonesian phone number length)
    const limitedDigits = digitsOnly.slice(0, 13);
    
    setInternalValue(limitedDigits);
    
    // Call onChange with full format (+62 + number)
    if (onChange) {
      const fullNumber = limitedDigits ? `+62${limitedDigits}` : "";
      onChange(fullNumber);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Validation: Indonesian phone numbers should be 9-13 digits after +62
  const isValid = internalValue.length === 0 || (internalValue.length >= 9 && internalValue.length <= 13);
  const displayError = error || (!isValid && internalValue.length > 0 ? "Phone number must be 9-13 digits" : undefined);

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {showLabel && (
        <Label htmlFor={inputId} className="!bg-transparent">
          <Phone className="h-4 w-4" />
          {label}
        </Label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          +62
        </div>
        <Input
          {...props}
          id={inputId}
          type="tel"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "pl-12",
            displayError && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? `${inputId}-error` : undefined}
        />
      </div>
      {displayError && (
        <p
          id={`${inputId}-error`}
          className="text-xs text-red-400"
          role="alert"
        >
          {displayError}
        </p>
      )}
      {!displayError && internalValue && (
        <p className="text-xs text-gray-400">
          Format: +62{internalValue}
        </p>
      )}
    </div>
  );
}

/**
 * Validate Indonesian phone number format
 * @param phone - Phone number with or without +62 prefix
 * @returns Object with isValid boolean and error message
 */
export function validateIndonesianPhone(phone: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phone) {
    return { isValid: true }; // Empty is valid (optional field)
  }

  // Remove +62 prefix if present
  let numberPart = phone.startsWith("+62")
    ? phone.slice(3).replace(/\D/g, "")
    : phone.replace(/\D/g, "");

  // Remove leading zero if present
  if (numberPart.startsWith("0")) {
    numberPart = numberPart.slice(1);
  }

  if (numberPart.length === 0) {
    return { isValid: false, error: "Phone number is required" };
  }

  if (numberPart.length < 9) {
    return { isValid: false, error: "Phone number must be at least 9 digits" };
  }

  if (numberPart.length > 13) {
    return { isValid: false, error: "Phone number must be at most 13 digits" };
  }

  // Check if starts with valid Indonesian mobile prefix (8 or 1)
  const firstDigit = numberPart[0];
  if (firstDigit !== "8" && firstDigit !== "1") {
    return {
      isValid: false,
      error: "Indonesian phone numbers must start with 8 (mobile) or 1",
    };
  }

  return { isValid: true };
}

