"use client"

import React from "react"
import { Search, type LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

// Shared pieces for the Messages list panels, matching Manage Properties (components/manage-properties/list).

export const PAGE_SIZE = 8

export function getInitials(name: string | null | undefined): string {
  const parts = (name || "").split(" ").filter(Boolean)
  if (parts.length === 0) return "??"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Homeowner initials in a circle (40px in lists, 56–64px in the detail header). */
export function InitialsAvatar({
  name,
  selected = false,
  size = "md",
}: {
  name: string | null | undefined
  selected?: boolean
  size?: "md" | "lg"
}) {
  if (size === "lg") {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
        {getInitials(name)}
      </div>
    )
  }
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        selected
          ? "bg-gray-200 text-gray-700 dark:bg-white/15 dark:text-gray-200"
          : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300"
      }`}
    >
      {getInitials(name)}
    </div>
  )
}

export function PanelSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 h-10 rounded-lg border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 w-full"
      />
    </div>
  )
}

/** Gray tile + title + body, matching the Manage Properties empty list. */
export function PanelEmpty({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon
  title: string
  body?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {body && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[300px]">{body}</p>}
      {children}
    </div>
  )
}

/** Compact page list with ellipses, e.g. [1, 2, 3, 'ellipsis', 9]. */
function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  const items: (number | "ellipsis")[] = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 2 && p <= current + 2)) {
      items.push(p)
    } else if (items[items.length - 1] !== "ellipsis") {
      items.push("ellipsis")
    }
  }
  return items
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
}

export function pageSlice<T>(items: T[], page: number): T[] {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
}

/** Footer pagination, identical to the Manage Properties list. */
export function PanelPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-2 gap-y-2 px-4 py-3 border-t border-gray-100 dark:border-white/10 flex-shrink-0 mt-auto">
      <div className="flex items-center gap-1">
        {getPageItems(currentPage, totalPages).map((item, i) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={currentPage === item ? "page" : undefined}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                currentPage === item
                  ? "bg-[#E8730A] text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="text-sm font-medium text-white bg-[#E8730A] px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Next
        </button>
      </div>
    </div>
  )
}

/** The "View Details" / "Hide Details" toggle from Manage Properties, with a custom noun. */
export function ViewToggleButton({
  selected,
  noun,
  onClick,
  ShowIcon,
  HideIcon,
}: {
  selected: boolean
  noun: string
  onClick: (e: React.MouseEvent) => void
  ShowIcon: LucideIcon
  HideIcon: LucideIcon
}) {
  const Icon = selected ? HideIcon : ShowIcon
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 h-10 lg:h-8 px-3 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
        selected
          ? "border-[#E8730A] text-[#E8730A] bg-[#E8730A]/5 hover:bg-[#E8730A]/10"
          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {selected ? "Hide" : "View"}
      <span className="hidden sm:inline">{noun}</span>
    </button>
  )
}
