"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown } from "lucide-react";

// Country codes with dial codes and flags
const countries = [
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
] as const;

interface PhoneInputAuthProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function PhoneInputAuth({
  value = "",
  onChange,
  placeholder = "812 3456 7890",
  id,
}: PhoneInputAuthProps) {
  const [open, setOpen] = React.useState(false);

  // Use ref for onChange to prevent infinite loops
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Parse existing value to extract country code and number
  const parsePhoneNumber = (phone: string) => {
    if (!phone) return { countryCode: "ID", number: "" };

    // Find matching country by dial code
    const matchedCountry = countries.find((c) => phone.startsWith(c.dial));
    if (matchedCountry) {
      return {
        countryCode: matchedCountry.code,
        number: phone.slice(matchedCountry.dial.length).trim(),
      };
    }

    // Default to Indonesia if no match
    return { countryCode: "ID", number: phone };
  };

  const { countryCode: initialCountryCode, number: initialNumber } =
    parsePhoneNumber(value);
  const [selectedCountry, setSelectedCountry] =
    React.useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = React.useState(initialNumber);
  const lastEmittedValue = React.useRef<string | null>(null);

  // Update internal state when value prop changes
  React.useEffect(() => {
    const { countryCode, number } = parsePhoneNumber(value);
    setSelectedCountry(countryCode);
    setPhoneNumber(number);
  }, [value]);

  const currentCountry =
    countries.find((c) => c.code === selectedCountry) || countries[0];

  // Update parent when country or number changes
  React.useEffect(() => {
    let fullNumber = "";
    if (phoneNumber && phoneNumber.trim()) {
      let digitsOnly = phoneNumber.replace(/\D/g, "");
      // Remove leading zeros
      digitsOnly = digitsOnly.replace(/^0+/, "");
      if (digitsOnly) {
        fullNumber = `${currentCountry.dial}${digitsOnly}`;
      }
    }

    // Only emit if value actually changed
    if (lastEmittedValue.current !== fullNumber) {
      lastEmittedValue.current = fullNumber;
      onChangeRef.current?.(fullNumber);
    }
  }, [selectedCountry, phoneNumber, currentCountry.dial]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only digits and spaces
    const sanitized = input.replace(/[^\d\s]/g, "");
    setPhoneNumber(sanitized);
  };

  return (
    <div className="bg-foreground flex h-10 w-full items-center rounded-md ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Country Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-full items-center gap-2 whitespace-nowrap px-3 text-sm text-gray-400"
          >
            <span>{currentCountry.code}</span>
            <span>{currentCountry.dial}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="bg-foreground w-[280px] border-gray-700 p-0">
          <Command className="bg-foreground text-white border-0">
            <CommandInput
              placeholder="Cari negara..."
              className="text-white placeholder:text-gray-400 border-0"
            />
            <CommandList className="max-h-[200px]">
              <CommandEmpty className="py-6 text-center text-sm text-gray-200">
                Negara tidak ditemukan.
              </CommandEmpty>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.name}
                  onSelect={() => {
                    setSelectedCountry(country.code);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:bg-white/10 text-white"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-gray-200 text-sm">{country.dial}</span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Separator Line */}
      <div className="h-4 w-px bg-input" />

      {/* Phone Number Input */}
      <Input
        id={id}
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className="h-full w-full border-0 bg-transparent px-3 py-2 text-sm text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
