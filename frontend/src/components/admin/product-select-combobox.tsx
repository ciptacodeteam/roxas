"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
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

interface ProductItem {
    id: string;
    name: string;
    skuCode?: string;
    product: {
        name: string;
        category: {
            name: string;
        };
    };
    sellPrice: number;
}

interface ProductSelectComboboxProps {
    items: ProductItem[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function ProductSelectCombobox({
    items,
    value,
    onValueChange,
    placeholder = "Search product...",
    className,
}: ProductSelectComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    // Find selected item - ensure proper ID comparison
    const selectedItem = React.useMemo(() => {
        if (!value) return undefined;
        return items.find((item) => String(item.id) === String(value));
    }, [items, value]);

    const filteredItems = React.useMemo(() => {
        if (!searchValue.trim()) return items;
        const searchLower = searchValue.toLowerCase().trim();
        return items.filter((item) => {
            try {
                return (
                    item.product?.name?.toLowerCase().includes(searchLower) ||
                    item.name?.toLowerCase().includes(searchLower) ||
                    item.skuCode?.toLowerCase().includes(searchLower) ||
                    item.product?.category?.name?.toLowerCase().includes(searchLower)
                );
            } catch {
                return false;
            }
        });
    }, [items, searchValue]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedItem ? (
                            <span>
                                {selectedItem.product?.name} - {selectedItem.name}
                                {selectedItem.product?.category?.name && (
                                    <span> ({selectedItem.product.category.name})</span>
                                )}
                            </span>
                        ) : value ? (
                            <span className="text-gray-400">Selected (ID: {value})</span>
                        ) : (
                            <span className="text-gray-500">{placeholder}</span>
                        )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-gray-800 border-gray-700">
                <Command className="bg-gray-800 text-gray-100" shouldFilter={false}>
                    <CommandInput
                        placeholder={placeholder}
                        value={searchValue}
                        onValueChange={setSearchValue}
                        className="text-gray-100 placeholder:text-gray-500"
                    />
                    <CommandEmpty className="text-gray-400 py-6 text-center text-sm">
                        No product found.
                    </CommandEmpty>
                    <CommandList className="max-h-48">
                        <CommandGroup>
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() => {
                                            onValueChange(item.id === value ? "" : item.id);
                                            setOpen(false);
                                            setSearchValue("");
                                        }}
                                        className="hover:bg-gray-700 cursor-pointer text-gray-100"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === item.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">
                                                {item.product.name} - {item.name}
                                                {item.skuCode && (
                                                    <span className="text-xs text-gray-500 ml-2">({item.skuCode})</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {item.product.category.name}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))
                            ) : (
                                <div className="py-6 text-center text-sm text-gray-400">
                                    No product found.
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
