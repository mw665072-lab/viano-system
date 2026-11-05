"use client"

import React, { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import {
  ApiError,
  getFriendlyErrorMessage,
  getOutreachErrorCode,
  outreachAPI,
  type OutreachContact,
} from "@/lib/api"
import { todayISO } from "@/lib/outreach-dates"

interface MarkContactedProps {
  itemId: string
  homeowner: string
  /** Recorded (including a repeat with the same date, `already_recorded: true`). */
  onContacted: (contact: OutreachContact) => void
  /** 409 `already_contacted`: a different date was recorded earlier. The message names that date. */
  onAlreadyContacted: (serverMessage: string) => void
  /** 409 `withdrawn`. */
  onWithdrawn: () => void
  /** 404: the update or property is no longer the Realtor's. */
  onNotFound: (err: unknown) => void
}

/**
 * "Mark contacted" with the date the Realtor actually reached the homeowner. Opens an inline panel
 * with a native date picker (default and max: today). The server checks against Eastern time, so a
 * browser east of Eastern can still get `future_date` around midnight; that's handled.
 */
export function MarkContacted({
  itemId,
  homeowner,
  onContacted,
  onAlreadyContacted,
  onWithdrawn,
  onNotFound,
}: MarkContactedProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [maxDate, setMaxDate] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    const today = todayISO()
    setDate(today)
    setMaxDate(today)
    setError(null)
    setOpen(true)
  }

  const handleConfirm = () => {
    if (submitting) return
    if (!date) {
      setError("Choose the date you reached them.")
      return
    }
    if (maxDate && date > maxDate) {
      setError("The contact date can't be in the future.")
      return
    }
    setSubmitting(true)
    setError(null)
    outreachAPI
      .complete(itemId, date)
      .then((res) => {
        onContacted({ contacted_on: res.contacted_on, recorded_at: res.recorded_at })
      })
      .catch((err: unknown) => {
        const code = getOutreachErrorCode(err)
        if (code === "already_contacted") {
          onAlreadyContacted(err instanceof Error ? err.message : "")
          return
        }
        if (code === "withdrawn") {
          onWithdrawn()
          return
        }
        if (code === "future_date") {
          setError("The contact date can't be in the future.")
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          onNotFound(err)
          return
        }
        console.error("Mark contacted error:", err)
        setError(getFriendlyErrorMessage(err, "We couldn't save that. Please try again."))
      })
      .finally(() => setSubmitting(false))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-xl bg-[#E8730A] hover:bg-[#d1670a] text-white transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" />
        Mark contacted
      </button>
    )
  }

  const inputId = `contacted-on-${itemId}`

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold text-[#0C1D38] dark:text-white">
        When did you reach {homeowner}?
      </label>
      <input
        id={inputId}
        type="date"
        value={date}
        max={maxDate || undefined}
        onChange={(e) => {
          setDate(e.target.value)
          if (error) setError(null)
        }}
        disabled={submitting}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-sm text-[#0C1D38] dark:text-white outline-none focus:border-[#E8730A] focus:ring-2 focus:ring-[#E8730A]/30 disabled:opacity-60 dark:[color-scheme:dark]"
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="flex-1 h-11 px-4 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting || !date}
          className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-xl bg-[#E8730A] hover:bg-[#d1670a] text-white transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirm
        </button>
      </div>
    </div>
  )
}

export default MarkContacted
