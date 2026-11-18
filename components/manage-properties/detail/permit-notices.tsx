"use client"

import { useEffect, useRef, useState } from "react"
import { BadgeCheck, History, Loader2 } from "lucide-react"
import {
    getFriendlyErrorMessage,
    verificationAPI,
    type SystemResponse,
    type VerificationListItem,
} from "@/lib/api"
import { formatDay } from "@/lib/outreach-dates"

interface PermitNoticesProps {
    propertyId: string
    /** The property's systems; a change (reset, undo, edit) refetches the notices. */
    systems: SystemResponse[]
    /** Open the system's replacement history, where the automatic update can be undone. */
    onOpenHistory: (system: SystemResponse) => void
}

function systemName(system: SystemResponse | undefined): string {
    if (!system) return "a system"
    const type = system.system_type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    return system.name ? `${type} (${system.name})` : type
}

function formatCompleted(notice: VerificationListItem): string | null {
    if (!notice.proposed_date) return null
    const day = notice.proposed_date.slice(0, 10)
    return notice.proposed_precision === "month"
        ? formatDay(day, { month: "long", year: "numeric" })
        : formatDay(day, { month: "short", day: "numeric", year: "numeric" })
}

/**
 * "Viano updated the roof from a permit" notices (automatic updates from PropertyLens). Shown until
 * the Realtor taps OK; "Review or undo" opens the system's history, where Undo already lives.
 * Undoing closes the notice on the server, so it disappears on the next refresh.
 */
export function PermitNotices({ propertyId, systems, onOpenHistory }: PermitNoticesProps) {
    const [notices, setNotices] = useState<VerificationListItem[]>([])
    const [busyId, setBusyId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const aliveRef = useRef(true)
    useEffect(() => {
        aliveRef.current = true
        return () => {
            aliveRef.current = false
        }
    }, [])

    useEffect(() => {
        let live = true
        verificationAPI
            .listForProperty(propertyId, "open")
            .then((rows) => {
                if (live) setNotices(rows.filter((r) => r.kind === "info"))
            })
            .catch((err: unknown) => {
                // Optional information: never block the property page on it.
                console.error("Permit notices fetch error:", err)
            })
        return () => {
            live = false
        }
    }, [propertyId, systems])

    const handleAcknowledge = (notice: VerificationListItem) => {
        if (busyId) return
        setBusyId(notice.verification_id)
        setError(null)
        verificationAPI
            .acknowledge(notice.verification_id)
            .then(() => {
                if (aliveRef.current) setNotices((list) => list.filter((n) => n.verification_id !== notice.verification_id))
            })
            .catch((err: unknown) => {
                if (!aliveRef.current) return
                console.error("Permit notice acknowledge error:", err)
                setError(getFriendlyErrorMessage(err, "We couldn't save that. Please try again."))
            })
            .finally(() => {
                if (aliveRef.current) setBusyId(null)
            })
    }

    if (notices.length === 0) return null

    return (
        <div className="mb-4 space-y-2">
            {notices.map((notice) => {
                const system = systems.find((s) => s.system_id === notice.system_id)
                const completed = formatCompleted(notice)
                const permit = notice.evidence?.permit_number ? ` #${notice.evidence.permit_number}` : ""
                return (
                    <div
                        key={notice.verification_id}
                        role="status"
                        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10 p-3.5"
                    >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <BadgeCheck className="w-5 h-5 text-teal-600 dark:text-teal-300 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-[#0C1D38] dark:text-gray-100">
                                Viano updated the <span className="font-semibold">{systemName(system)}</span> from permit
                                {permit}: replaced{completed ? ` ${completed}` : ""}. Its alerts were rescheduled.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pl-8 sm:pl-0">
                            {system && (
                                <button
                                    type="button"
                                    onClick={() => onOpenHistory(system)}
                                    className="inline-flex items-center gap-1.5 min-h-10 px-3 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <History className="w-3.5 h-3.5" />
                                    Review or undo
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleAcknowledge(notice)}
                                disabled={busyId === notice.verification_id}
                                className="inline-flex items-center gap-1.5 min-h-10 px-4 text-xs font-semibold rounded-lg bg-[#E8730A] text-white hover:bg-[#d06608] transition-colors disabled:opacity-60"
                            >
                                {busyId === notice.verification_id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                OK
                            </button>
                        </div>
                    </div>
                )
            })}
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                    {error}
                </p>
            )}
        </div>
    )
}

export default PermitNotices
