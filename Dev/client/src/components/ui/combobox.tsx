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

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  emptyText = "No option found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // When value prop changes externally, update input if needed
  // (Optional depending on desired UX, often good for controlled components)
  // React.useEffect(() => {
  //   setInputValue(value)
  // }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background", className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={(val) => {
              setInputValue(val);
              // Allow typing new values directly
              // Logic: if user types, we can treat it as the value immediately or wait for selection.
              // For "Creatable", standard pattern is usually hitting Enter or clicking "Create".
              // But simplified: Update value on type? No, usually that breaks selection.
              // Let's stick to standard shadcn combobox but with a "Create" option if no match.
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground pb-2">
                  {emptyText}
                </p>
                {inputValue && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => {
                      onChange(inputValue);
                      setOpen(false);
                      setInputValue("");
                    }}
                  >
                    <span className="truncate">Use "{inputValue}"</span>
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
