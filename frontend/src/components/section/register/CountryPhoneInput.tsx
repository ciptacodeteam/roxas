"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import countries from "@/lib/data/countries.json";

type Props = {
  value: string; // nomor hp tanpa kode negara
  onChange: (val: string) => void;
};

export default function CountryPhoneInput({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState({
    name: "Indonesia",
    code: "+62",
    flag: "🇮🇩",
  });

  // Sync nilai input dari parent
  const [phone, setPhone] = useState(value);
  useEffect(() => setPhone(value), [value]);

  const updatePhone = (val: string) => {
    const filtered = val.replace(/[^0-9]/g, "");
    setPhone(filtered);
    onChange(filtered); // update ke parent form
  };

  return (
    <div className="w-full">
      <label className="text-sm text-white">Nomor WhatsApp</label>

      <div className="bg-foreground mt-2 flex w-full items-center rounded-md px-2">
        {/* COUNTRY DROPDOWN */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2">
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-white">{selectedCountry.code}</span>
          </PopoverTrigger>

          <PopoverContent
            className="bg-foreground w-[300px] border-0 p-0 text-white ml-24"
          >
            <Command className="bg-foreground text-white">
              <CommandInput
                placeholder="Cari negara..."
                className="text-white placeholder:text-gray-400"
              />

              <CommandList className="max-h-[250px] overflow-y-auto">
                <CommandEmpty className="flex items-center justify-center py-6 text-sm text-white">
                  Negara tidak ditemukan.
                </CommandEmpty>

                {countries.map((country) => (
                  <CommandItem
                    key={`${country.name}-${country.code}`}
                    onSelect={() => {
                      setSelectedCountry(country);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-none py-3"
                  >
                    <span className="flex-1">{country.name}</span>
                    <span className="opacity-70">{country.code}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* PHONE INPUT */}
        <Input
          type="tel"
          value={phone}
          onChange={(e) => updatePhone(e.target.value)}
          placeholder="812 3456 7890"
          className="border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
