"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Country {
  name: string;
  iso2: string;
  dialCode: string;
}

/**
 * Curated country list (name, ISO-3166 alpha-2, E.164 dial code). US/Canada are listed
 * first because they are the most common defaults for this app; the rest are alphabetical.
 * The search box makes the long tail easy to find.
 */
export const COUNTRIES: Country[] = [
  { name: "United States", iso2: "US", dialCode: "+1" },
  { name: "Canada", iso2: "CA", dialCode: "+1" },
  { name: "United Kingdom", iso2: "GB", dialCode: "+44" },
  { name: "Australia", iso2: "AU", dialCode: "+61" },
  { name: "Afghanistan", iso2: "AF", dialCode: "+93" },
  { name: "Albania", iso2: "AL", dialCode: "+355" },
  { name: "Algeria", iso2: "DZ", dialCode: "+213" },
  { name: "Argentina", iso2: "AR", dialCode: "+54" },
  { name: "Austria", iso2: "AT", dialCode: "+43" },
  { name: "Bahrain", iso2: "BH", dialCode: "+973" },
  { name: "Bangladesh", iso2: "BD", dialCode: "+880" },
  { name: "Belgium", iso2: "BE", dialCode: "+32" },
  { name: "Brazil", iso2: "BR", dialCode: "+55" },
  { name: "Bulgaria", iso2: "BG", dialCode: "+359" },
  { name: "Chile", iso2: "CL", dialCode: "+56" },
  { name: "China", iso2: "CN", dialCode: "+86" },
  { name: "Colombia", iso2: "CO", dialCode: "+57" },
  { name: "Croatia", iso2: "HR", dialCode: "+385" },
  { name: "Czechia", iso2: "CZ", dialCode: "+420" },
  { name: "Denmark", iso2: "DK", dialCode: "+45" },
  { name: "Egypt", iso2: "EG", dialCode: "+20" },
  { name: "Estonia", iso2: "EE", dialCode: "+372" },
  { name: "Finland", iso2: "FI", dialCode: "+358" },
  { name: "France", iso2: "FR", dialCode: "+33" },
  { name: "Germany", iso2: "DE", dialCode: "+49" },
  { name: "Ghana", iso2: "GH", dialCode: "+233" },
  { name: "Greece", iso2: "GR", dialCode: "+30" },
  { name: "Hong Kong", iso2: "HK", dialCode: "+852" },
  { name: "Hungary", iso2: "HU", dialCode: "+36" },
  { name: "Iceland", iso2: "IS", dialCode: "+354" },
  { name: "India", iso2: "IN", dialCode: "+91" },
  { name: "Indonesia", iso2: "ID", dialCode: "+62" },
  { name: "Iraq", iso2: "IQ", dialCode: "+964" },
  { name: "Ireland", iso2: "IE", dialCode: "+353" },
  { name: "Israel", iso2: "IL", dialCode: "+972" },
  { name: "Italy", iso2: "IT", dialCode: "+39" },
  { name: "Japan", iso2: "JP", dialCode: "+81" },
  { name: "Jordan", iso2: "JO", dialCode: "+962" },
  { name: "Kenya", iso2: "KE", dialCode: "+254" },
  { name: "Kuwait", iso2: "KW", dialCode: "+965" },
  { name: "Latvia", iso2: "LV", dialCode: "+371" },
  { name: "Lebanon", iso2: "LB", dialCode: "+961" },
  { name: "Lithuania", iso2: "LT", dialCode: "+370" },
  { name: "Luxembourg", iso2: "LU", dialCode: "+352" },
  { name: "Malaysia", iso2: "MY", dialCode: "+60" },
  { name: "Mexico", iso2: "MX", dialCode: "+52" },
  { name: "Morocco", iso2: "MA", dialCode: "+212" },
  { name: "Nepal", iso2: "NP", dialCode: "+977" },
  { name: "Netherlands", iso2: "NL", dialCode: "+31" },
  { name: "New Zealand", iso2: "NZ", dialCode: "+64" },
  { name: "Nigeria", iso2: "NG", dialCode: "+234" },
  { name: "Norway", iso2: "NO", dialCode: "+47" },
  { name: "Oman", iso2: "OM", dialCode: "+968" },
  { name: "Pakistan", iso2: "PK", dialCode: "+92" },
  { name: "Peru", iso2: "PE", dialCode: "+51" },
  { name: "Philippines", iso2: "PH", dialCode: "+63" },
  { name: "Poland", iso2: "PL", dialCode: "+48" },
  { name: "Portugal", iso2: "PT", dialCode: "+351" },
  { name: "Qatar", iso2: "QA", dialCode: "+974" },
  { name: "Romania", iso2: "RO", dialCode: "+40" },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "+966" },
  { name: "Serbia", iso2: "RS", dialCode: "+381" },
  { name: "Singapore", iso2: "SG", dialCode: "+65" },
  { name: "Slovakia", iso2: "SK", dialCode: "+421" },
  { name: "Slovenia", iso2: "SI", dialCode: "+386" },
  { name: "South Africa", iso2: "ZA", dialCode: "+27" },
  { name: "South Korea", iso2: "KR", dialCode: "+82" },
  { name: "Spain", iso2: "ES", dialCode: "+34" },
  { name: "Sri Lanka", iso2: "LK", dialCode: "+94" },
  { name: "Sweden", iso2: "SE", dialCode: "+46" },
  { name: "Switzerland", iso2: "CH", dialCode: "+41" },
  { name: "Taiwan", iso2: "TW", dialCode: "+886" },
  { name: "Thailand", iso2: "TH", dialCode: "+66" },
  { name: "Tunisia", iso2: "TN", dialCode: "+216" },
  { name: "Turkey", iso2: "TR", dialCode: "+90" },
  { name: "Ukraine", iso2: "UA", dialCode: "+380" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "+971" },
  { name: "Uruguay", iso2: "UY", dialCode: "+598" },
  { name: "Venezuela", iso2: "VE", dialCode: "+58" },
  { name: "Vietnam", iso2: "VN", dialCode: "+84" },
];

/** Default selection — United States, per product requirement. */
export const DEFAULT_COUNTRY: Country =
  COUNTRIES.find((c) => c.iso2 === "US") ?? COUNTRIES[0];

/** Turn a 2-letter ISO country code into its flag emoji (regional indicator symbols). */
export function isoToFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/** Strip everything but digits from a national number. */
export function nationalDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Combine a country dial code and a national number into an E.164 string
 * (e.g. "+1", "7274234870" -> "+17274234870"). Returns "" when no national digits.
 */
export function toE164(dialCode: string, national: string): string {
  const digits = nationalDigits(national);
  if (!digits) return "";
  const code = (dialCode || "").replace(/[^\d+]/g, "");
  return `${code}${digits}`;
}

/**
 * Lightweight validity check for the national portion of a phone number.
 * North American numbers (+1) must be exactly 10 digits; everything else accepts
 * 6–14 digits so the full E.164 string never exceeds the 15-digit maximum.
 */
export function isValidPhone(country: Country, national: string): boolean {
  const digits = nationalDigits(national);
  if (country.dialCode === "+1") return digits.length === 10;
  return digits.length >= 6 && digits.length <= 14;
}

/**
 * Best-effort split of a stored E.164 number back into a country + national number,
 * so existing values can pre-fill the selector. Falls back to the default country.
 * (+1 resolves to US since US/Canada share a dial code.)
 */
export function parsePhone(value?: string | null): { country: Country; national: string } {
  const raw = (value || "").trim();
  if (raw.startsWith("+")) {
    const digits = "+" + nationalDigits(raw);
    const byLongestCode = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of byLongestCode) {
      if (digits.startsWith(c.dialCode)) {
        return { country: c, national: digits.slice(c.dialCode.length) };
      }
    }
  }
  return { country: DEFAULT_COUNTRY, national: nationalDigits(raw) };
}

interface PhoneInputProps {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Extra classes for the outer field wrapper. */
  className?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export function PhoneInput({
  country,
  onCountryChange,
  value,
  onChange,
  disabled = false,
  placeholder = "Mobile Number",
  className,
  id,
  name,
  autoComplete = "tel-national",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<PanelPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 288);
    const vw = window.innerWidth;
    let left = rect.left;
    if (left + width > vw - 8) left = Math.max(8, vw - width - 8);

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(320, (openAbove ? spaceAbove : spaceBelow) - 12);
    const top = openAbove ? rect.top - maxHeight - 6 : rect.bottom + 6;
    setPos({ top, left, width, maxHeight });
  }, []);

  // Keep the floating panel anchored to the trigger while it's open.
  useEffect(() => {
    if (!open) return;
    computePosition();
    const handle = () => computePosition();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [open, computePosition]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Focus the search box when the panel opens (query is reset in the toggle handler).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const toggleOpen = () => {
    if (disabled) return;
    setQuery("");
    setOpen((o) => !o);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    const qDigits = q.replace(/[^\d]/g, "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso2.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        (qDigits && c.dialCode.replace("+", "").includes(qDigits))
    );
  }, [query]);

  const handleSelect = (c: Country) => {
    onCountryChange(c);
    setOpen(false);
    // Return focus to the number field for a smooth flow.
    setTimeout(() => {
      const input = document.getElementById(id ?? "") as HTMLInputElement | null;
      input?.focus();
    }, 0);
  };

  return (
    <div
      className={cn(
        "flex w-full items-stretch rounded-lg border border-gray-200 bg-white transition-all dark:border-white/10 dark:bg-white/5",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
        disabled && "opacity-70",
        className
      )}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={toggleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${country.name} (${country.dialCode})`}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-l-lg pl-3 pr-2.5 text-sm text-gray-900 outline-none transition-colors hover:bg-gray-50 disabled:cursor-not-allowed dark:text-white dark:hover:bg-white/5"
      >
        <span className="text-base leading-none" aria-hidden>
          {isoToFlag(country.iso2)}
        </span>
        <span className="font-medium text-gray-700 dark:text-gray-200">{country.dialCode}</span>
        <ChevronDown
          size={14}
          className={cn("text-gray-400 transition-transform", open && "rotate-180")}
        />
      </button>

      <span className="my-2 w-px self-stretch bg-gray-200 dark:bg-white/10" aria-hidden />

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:cursor-not-allowed dark:text-white dark:placeholder:text-gray-400"
      />

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
            className="z-[200] flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1f1f1f]"
          >
            <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/10">
              <Search size={15} className="flex-shrink-0 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code"
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none dark:text-white"
              />
            </div>
            <ul className="flex-1 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-gray-400">No matches</li>
              ) : (
                filtered.map((c) => {
                  const selected = c.iso2 === country.iso2;
                  return (
                    <li key={c.iso2}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => handleSelect(c)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-white/10",
                          selected && "bg-primary/10"
                        )}
                      >
                        <span className="text-base leading-none" aria-hidden>
                          {isoToFlag(c.iso2)}
                        </span>
                        <span className="flex-1 truncate text-gray-900 dark:text-gray-100">
                          {c.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{c.dialCode}</span>
                        {selected && <Check size={15} className="text-primary" />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
