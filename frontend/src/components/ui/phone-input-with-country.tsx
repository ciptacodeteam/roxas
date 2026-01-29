"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Country codes with dial codes
const countries = [
  { code: "ID", name: "Indonesia", dial: "+62", format: "xxxx-xxxx-xxxx" },
  { code: "US", name: "United States", dial: "+1", format: "(xxx) xxx-xxxx" },
  { code: "GB", name: "United Kingdom", dial: "+44", format: "xxxx xxx xxxx" },
  { code: "SG", name: "Singapore", dial: "+65", format: "xxxx xxxx" },
  { code: "MY", name: "Malaysia", dial: "+60", format: "xxx-xxx xxxx" },
  { code: "AU", name: "Australia", dial: "+61", format: "xxxx xxx xxx" },
  { code: "JP", name: "Japan", dial: "+81", format: "xxx-xxxx-xxxx" },
  { code: "CN", name: "China", dial: "+86", format: "xxx xxxx xxxx" },
  { code: "IN", name: "India", dial: "+91", format: "xxxxx xxxxx" },
  { code: "TH", name: "Thailand", dial: "+66", format: "xxx-xxx-xxxx" },
  { code: "PH", name: "Philippines", dial: "+63", format: "xxxx xxx xxxx" },
  { code: "VN", name: "Vietnam", dial: "+84", format: "xxx-xxx-xxxx" },
] as const;

interface PhoneInputWithCountryProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export function PhoneInputWithCountry({
  value = "",
  onChange,
  onBlur,
  placeholder = "Enter phone number",
  disabled = false,
  error,
  className,
  id,
}: PhoneInputWithCountryProps) {
  const [open, setOpen] = React.useState(false);
  
  // Use ref for onChange to avoid dependency issues
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });
  
  // Parse existing value to extract country code and number
  const parsePhoneNumber = (phone: string) => {
    if (!phone) return { countryCode: "ID", number: "" };
    
    // Find matching country by dial code
    const matchedCountry = countries.find(c => phone.startsWith(c.dial));
    if (matchedCountry) {
      return {
        countryCode: matchedCountry.code,
        number: phone.slice(matchedCountry.dial.length).trim(),
      };
    }
    
    // Default to Indonesia if no match
    return { countryCode: "ID", number: phone };
  };

  const { countryCode: initialCountryCode, number: initialNumber } = parsePhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = React.useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);
  const lastEmittedValue = React.useRef<string | null>(null);

  // Update internal state when value prop changes (for controlled component behavior)
  React.useEffect(() => {
    const { countryCode, number } = parsePhoneNumber(value);
    setSelectedCountry(countryCode);
    setPhoneNumber(number);
  }, [value]);

  const currentCountry = countries.find(c => c.code === selectedCountry) || countries[0];

  // Update parent when country or number changes
  // Format: +62812345678 (country code + digits only, no spaces, no leading zeros)
  React.useEffect(() => {
    let fullNumber = "";
    if (phoneNumber) {
      let digitsOnly = phoneNumber.replace(/\D/g, "");
      // Remove leading zeros (common in Indonesia, Malaysia, Thailand, Australia, UK, etc.)
      digitsOnly = digitsOnly.replace(/^0+/, "");
      fullNumber = `${currentCountry.dial}${digitsOnly}`;
    }
    
    // Only emit if value actually changed
    if (lastEmittedValue.current !== fullNumber) {
      lastEmittedValue.current = fullNumber;
      onChangeRef.current?.(fullNumber);
    }
  }, [selectedCountry, phoneNumber, currentCountry.dial]);

  // Validate phone number based on country using regex
  const validatePhoneNumber = (num: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country || !num) return true;

    // Remove all non-digit characters for validation
    const digitsOnly = num.replace(/\D/g, "");
    
    // Regex validation rules per country
    const validationRules: Record<string, { regex: RegExp; min: number; max: number }> = {
      ID: { regex: /^(8[1-9]|0[1-9])\d{7,11}$/, min: 9, max: 13 },  // Indonesia: starts with 8 or 0
      US: { regex: /^[2-9]\d{9}$/, min: 10, max: 10 }, // US: 10 digits, not starting with 0/1
      GB: { regex: /^[1-9]\d{9,10}$/, min: 10, max: 11 }, // UK: 10-11 digits
      SG: { regex: /^[689]\d{7}$/, min: 8, max: 8 },   // Singapore: starts with 6, 8, or 9
      MY: { regex: /^1\d{8,9}$/, min: 9, max: 10 },  // Malaysia: starts with 1
      AU: { regex: /^[2-9]\d{8}$/, min: 9, max: 9 },   // Australia: 9 digits
      JP: { regex: /^[0-9]\d{9}$/, min: 10, max: 10 }, // Japan: 10 digits
      CN: { regex: /^1[3-9]\d{9}$/, min: 11, max: 11 }, // China: starts with 1[3-9]
      IN: { regex: /^[6-9]\d{9}$/, min: 10, max: 10 }, // India: starts with 6-9
      TH: { regex: /^[0-9]\d{8}$/, min: 9, max: 9 },   // Thailand: 9 digits
      PH: { regex: /^9\d{9}$/, min: 10, max: 10 }, // Philippines: starts with 9
      VN: { regex: /^[0-9]\d{8,9}$/, min: 9, max: 10 },  // Vietnam: 9-10 digits
    };

    const rules = validationRules[countryCode] || { regex: /^\d{8,15}$/, min: 8, max: 15 };
    return rules.regex.test(digitsOnly) && digitsOnly.length >= rules.min && digitsOnly.length <= rules.max;
  };

  const isValid = validatePhoneNumber(phoneNumber, selectedCountry);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow digits, spaces, hyphens, and parentheses
    let sanitized = input.replace(/[^\d\s\-()]/g, "");
    // Remove leading zeros as user types
    sanitized = sanitized.replace(/^0+/, "");
    setPhoneNumber(sanitized);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-[140px] justify-between bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-gray-100",
                error && !isValid && "border-red-500"
              )}
            >
              <span className="truncate">
                {currentCountry.dial}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 bg-gray-800 border-gray-700">
            <Command className="bg-gray-800">
              <CommandInput 
                placeholder="Search country..." 
                className="bg-gray-800 text-gray-100 border-gray-700"
              />
              <CommandList>
                <CommandEmpty className="text-gray-400">No country found.</CommandEmpty>
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.name} ${country.dial}`}
                      onSelect={() => {
                        setSelectedCountry(country.code);
                        setOpen(false);
                      }}
                      className="text-gray-100 hover:bg-gray-700"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry === country.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{country.name}</span>
                        <span className="text-xs text-gray-400">{country.dial}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            id={id}
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "bg-gray-800 text-gray-100 border-gray-700",
              error && !isValid && "border-red-500"
            )}
          />
        </div>
      </div>

      {/* Validation Messages */}
      {phoneNumber && !isValid && (
        <p className="text-xs text-red-500">
          Invalid phone number for {currentCountry.name}. Expected format: {currentCountry.format}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
