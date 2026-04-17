"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";

import { useAppStore } from "@/stores/app-store";

const timezones = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "UTC",
];

const currencies = ["AUD", "NZD", "USD", "EUR", "GBP"];

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const testingPalettes = [
  { value: "default", label: "Default (globals.css)" },
  { value: "butter-yellow", label: "Butter Yellow & Marigold x Burgundy" },
  { value: "midnight", label: "Midnight & Gentian Blue x Mist Grey" },
  { value: "ivory-donkey", label: "Ivory x Donkey Brown" },
  { value: "deep-forest", label: "Deep Forest x Champagne" },
  { value: "space-black", label: "Space Black x Neon Coral" },
] as const;

const PALETTE_STORAGE_KEY = "strabb-testing-palette";

export function GeneralSection() {
  const addToast = useAppStore((s) => s.addToast);
  const [companyName, setCompanyName] = useState("STRABB Properties");
  const [timezone, setTimezone] = useState("Australia/Sydney");
  const [currency, setCurrency] = useState("AUD");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState<string>("default");
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (stored) setPalette(stored);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (palette === "default") {
      root.removeAttribute("data-palette");
    } else {
      root.setAttribute("data-palette", palette);
    }
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  }, [palette, mounted]);

  const handleSave = () => {
    addToast({ type: "success", message: "General settings saved" });
  };

  return (
    <div className="space-y-md">
      <div>
        <h2 className="text-subheading font-semibold text-gray-900">General</h2>
        <p className="text-body text-gray-500">Basic account and display settings.</p>
      </div>

      <div className="space-y-sm">
        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">Default Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">Default Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border px-sm py-base text-body"
            style={{ borderColor: "var(--border)" }}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">Appearance</label>
          <div
            className="inline-flex rounded-lg border p-xs"
            style={{ borderColor: "var(--border)" }}
          >
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mounted && theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className="flex items-center gap-xs rounded-sm px-sm py-xs text-body font-medium transition-colors"
                  style={{
                    backgroundColor: active ? "var(--strabb-secondary)" : "transparent",
                    color: active ? "var(--surface-60)" : "var(--brand-10)",
                  }}
                  aria-pressed={active}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-xs block text-body font-medium text-gray-700">Testing</label>
          <PaletteDropdown value={palette} onChange={setPalette} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg px-sm py-base text-body font-medium text-white"
        style={{ backgroundColor: "var(--strabb-secondary)" }}
      >
        Save Changes
      </button>
    </div>
  );
}

function PaletteDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = testingPalettes.find((p) => p.value === value)?.label ?? "Default";

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-block", width: 320 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "8px 13px",
          fontSize: 13,
          lineHeight: "21px",
          borderRadius: 8,
          border: "1px solid var(--brand-10)",
          backgroundColor: "var(--surface-60)",
          color: "var(--brand-10)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {current}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 150ms",
          }}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: "100%",
            zIndex: 50,
            margin: 0,
            padding: 4,
            listStyle: "none",
            borderRadius: 8,
            border: "1px solid var(--brand-10)",
            backgroundColor: "var(--surface-60)",
            color: "var(--brand-10)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {testingPalettes.map((p) => {
            const selected = p.value === value;
            return (
              <li key={p.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(p.value);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    fontSize: 13,
                    lineHeight: "21px",
                    borderRadius: 5,
                    border: "none",
                    backgroundColor: selected
                      ? "var(--neutral-30)"
                      : "transparent",
                    color: "var(--brand-10)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected)
                      e.currentTarget.style.backgroundColor =
                        "var(--neutral-30)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      flexShrink: 0,
                      display: "inline-flex",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <Check size={12} />}
                  </span>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
