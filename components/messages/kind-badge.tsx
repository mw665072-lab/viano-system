import React from "react"
import {
  Gift,
  Handshake,
  Hammer,
  Info,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { OutreachKind } from "@/lib/api"

interface KindStyle {
  label: string
  icon: LucideIcon
  className: string
}

const KIND_STYLES: Record<OutreachKind, KindStyle> = {
  check_in: {
    label: "Check-in",
    icon: Handshake,
    className: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
  },
  system_alert: {
    label: "System alert",
    icon: Wrench,
    className: "bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30",
  },
  anniversary: {
    label: "Anniversary",
    icon: Gift,
    className: "bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30",
  },
  insurance: {
    label: "Insurance",
    icon: ShieldCheck,
    className: "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
  },
  home_value: {
    label: "Home value",
    icon: TrendingUp,
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
  },
  maintenance: {
    label: "Maintenance",
    icon: Hammer,
    className: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  },
  negotiated_win: {
    label: "Negotiated win",
    icon: Trophy,
    className: "bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30",
  },
  intro: {
    label: "Intro",
    icon: Sparkles,
    className: "bg-violet-50 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
  },
  other: {
    label: "Update",
    icon: Info,
    className: "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10",
  },
}

/** Icon and label for an update's kind. Unknown kinds (a newer backend) fall back to "Update". */
export function KindBadge({ kind, className = "" }: { kind: OutreachKind | string; className?: string }) {
  const style = KIND_STYLES[kind as OutreachKind] ?? KIND_STYLES.other
  const Icon = style.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border whitespace-nowrap ${style.className} ${className}`}
    >
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      {style.label}
    </span>
  )
}

export default KindBadge
