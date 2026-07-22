import { useState, type ComponentType } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export default function FilterSelect({
  icon: Icon,
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2.5 w-full bg-white rounded-xl pl-3.5 pr-3 py-2.5 text-sm font-bold text-[#1a1a1a] border transition-all ${
          open ? "border-[#2563EB] shadow-sm" : "border-[#e8e6e2] hover:border-[#d4d0cb]"
        }`}
      >
        <Icon className="w-4 h-4 text-[#9b9b9b] flex-shrink-0" />
        <span className="flex-1 text-left truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#9b9b9b] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute z-40 mt-2 left-0 right-0 min-w-full bg-white rounded-xl shadow-xl border border-[#f0eeeb] py-1.5 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold text-left transition-colors ${
                    active ? "text-[#2563EB] bg-[#2563EB]/5" : "text-[#1a1a1a] hover:bg-[#f5f3f0]"
                  }`}
                >
                  <span className="flex-1 truncate">{o.label}</span>
                  {active && <Check className="w-4 h-4 flex-shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
