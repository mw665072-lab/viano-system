"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  /** Visual style: "light" for light surfaces (header), "dark" for dark surfaces (sidebar). */
  variant?: "light" | "dark";
  className?: string;
}

export function ThemeToggle({ variant = "light", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const base =
    variant === "dark"
      ? "text-gray-400 hover:text-white hover:bg-white/10"
      : "text-gray-600 hover:text-gray-900 bg-[#F9F9F7] border border-[#F3F4F4] hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${base} ${className}`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
