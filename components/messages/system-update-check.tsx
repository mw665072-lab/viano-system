"use client"

import React, { useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Loader2, XCircle } from "lucide-react"
import {
  ApiError,
  getApiErrorDetail,
  getFriendlyErrorMessage,
  getVerificationErrorCode,
  systemsAPI,
  verificationAPI,
  type ConfirmReplacementRequest,
  type OutreachReview,
  type RejectReason,
  type SystemResponse,
} from "@/lib/api"
import { formatDay, todayISO } from "@/lib/outreach-dates"

const SECTION_HEADING =
  "flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"

const INPUT =
  "w-full h-11 px-3 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-[#0C1D38] dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/40"

const PRIMARY =
  "inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold rounded-xl bg-[#E8730A] text-white hover:bg-[#d06608] transition-colors disabled:opacity-60"

const SECONDARY =
  "inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-[#0C1D38] dark:text-gray-100 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-60"

const REJECT_OPTIONS: { value: RejectReason; label: string; hint: string }[] = [
  {
    value: "not_completed",
    label: "Not replaced yet",
    hint: "Viano keeps the current age and asks again in about 3 months, or sooner if the permit changes.",
  },
  {
    value: "not_this_system",
    label: "The permit is about something else",
    hint: "Viano won't ask about this permit again unless it changes.",
  },
  {
    value: "wrong_property",
    label: "The permit isn't for this home",
    hint: "Viano won't ask about this permit again unless it changes.",
  },
]

const SCENARIO_LEAD: Record<string, string> = {
  A_shadow:
    "PropertyLens shows a completed replacement. Automatic updates are still being trialled, so Viano is asking you before changing the age.",
  B: "PropertyLens shows an open permit for this system, so the work may be under way or recently done.",
  D: "PropertyLens shows a permit that may concern this system, but the details aren't conclusive.",
}

function systemLabel(system: SystemResponse): string {
  const type = system.system_type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return system.name ? `${type} (${system.name})` : type
}

function inspectionLine(raw: Record<string, unknown>): string | null {
  const text = (key: string) => (typeof raw[key] === "string" && raw[key] ? String(raw[key]) : null)
  const what = text("type") ?? text("description") ?? "Inspection"
  const status = text("status")
  const day = text("last_status_date") ?? text("scheduled_date")
  const when = day && /^\d{4}-\d{2}-\d{2}/.test(day) ? formatDay(day.slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : null
  return [what, status, when].filter(Boolean).join(" · ") || null
}

interface SystemUpdateCheckProps {
  review: OutreachReview
  propertyId: string
  homeowner: string
  /** Answered here (or found already closed): the card and list should be refetched. */
  onAnswered: (message: string) => void
}

/**
 * A System Update Check: PropertyLens shows a permit suggesting a system was replaced, and Viano asks
 * the Realtor before changing its age. The updates that state that age stay on hold until it's answered.
 * "Yes" resets the system's age from the given date; "No" releases the updates unchanged.
 */
export function SystemUpdateCheck({ review, propertyId, homeowner, onAnswered }: SystemUpdateCheckProps) {
  const evidence = review.evidence ?? {}
  const open = review.status === "open"

  const [mode, setMode] = useState<"yes" | "no" | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Yes
  const [date, setDate] = useState(review.proposed_date ?? "")
  const [monthOnly, setMonthOnly] = useState(review.proposed_precision === "month" || review.proposed_precision === "year")
  const [systemId, setSystemId] = useState<string>(review.system_id ?? "")
  const [candidates, setCandidates] = useState<string[]>(review.candidate_system_ids ?? [])
  const [systems, setSystems] = useState<SystemResponse[] | null>(null)
  const [staleRevision, setStaleRevision] = useState<number | null>(null)

  // No
  const [reason, setReason] = useState<RejectReason | null>(null)
  const [note, setNote] = useState("")

  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  // Names for the units the permit could concern (only needed when it doesn't say which).
  const needsUnit = open && !review.system_id
  useEffect(() => {
    if (!needsUnit || systems) return
    systemsAPI
      .getSystems(propertyId)
      .then((list) => {
        if (aliveRef.current) setSystems(list)
      })
      .catch((err: unknown) => console.error("Systems fetch error:", err))
  }, [needsUnit, systems, propertyId])

  const nameOf = (id: string) => {
    const system = systems?.find((s) => s.system_id === id)
    return system ? systemLabel(system) : "Loading…"
  }

  const chooseMode = (next: "yes" | "no") => {
    setMode((m) => (m === next ? null : next))
    setError(null)
    setStaleRevision(null)
  }

  const expectedRevision = (): number | undefined => {
    if (staleRevision != null) return staleRevision // "Confirm anyway"
    if (review.system_id) return review.base_system_revision ?? undefined
    return systems?.find((s) => s.system_id === systemId)?.revision
  }

  const handleConfirm = () => {
    if (submitting) return
    if (!date) {
      setError("Choose when it was replaced.")
      return
    }
    const today = todayISO()
    if (date > today) {
      setError("The replacement date can't be in the future.")
      return
    }
    if (!review.system_id && !systemId) {
      setError("Choose which system was replaced.")
      return
    }
    const body: ConfirmReplacementRequest = {
      replacement_date: date,
      precision: monthOnly ? "month" : "day",
    }
    if (!review.system_id) body.system_id = systemId
    const revision = expectedRevision()
    if (revision != null) body.expected_revision = revision
    if (note.trim()) body.note = note.trim()

    setSubmitting(true)
    setError(null)
    verificationAPI
      .confirm(review.verification_id, body)
      .then(() => {
        if (aliveRef.current) onAnswered("Saved. The system's age was updated and its updates were rescheduled.")
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return
        handleAnswerError(err)
      })
      .finally(() => {
        if (aliveRef.current) setSubmitting(false)
      })
  }

  const handleReject = () => {
    if (submitting) return
    if (!reason) {
      setError("Choose what applies.")
      return
    }
    setSubmitting(true)
    setError(null)
    verificationAPI
      .reject(review.verification_id, reason, note.trim() || undefined)
      .then(() => {
        if (aliveRef.current) onAnswered("Saved. The system's age is unchanged and its updates are back in the queue.")
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return
        handleAnswerError(err)
      })
      .finally(() => {
        if (aliveRef.current) setSubmitting(false)
      })
  }

  const handleAnswerError = (err: unknown) => {
    const code = getVerificationErrorCode(err)
    const detail = getApiErrorDetail(err)
    if (code === "review_closed") {
      onAnswered("This check was already answered.")
      return
    }
    if (code === "stale_revision") {
      const current = typeof detail?.revision === "number" ? detail.revision : null
      setStaleRevision(current)
      setError(null)
      return
    }
    if (code === "system_required") {
      const ids = Array.isArray(detail?.candidate_system_ids) ? (detail.candidate_system_ids as string[]) : []
      if (ids.length) setCandidates(ids)
      setError("Choose which system was replaced.")
      return
    }
    if (err instanceof ApiError && err.status === 404) {
      onAnswered("This check is no longer available.")
      return
    }
    if (detail?.message) {
      setError(detail.message)
      return
    }
    console.error("System Update Check answer error:", err)
    setError(getFriendlyErrorMessage(err, "We couldn't save your answer. Please try again."))
  }

  const facts: { label: string; value: string }[] = []
  if (evidence.permit_number) facts.push({ label: "Permit", value: `#${evidence.permit_number}` })
  if (evidence.status) {
    const asOf = evidence.last_status_on
      ? ` (as of ${formatDay(evidence.last_status_on, { month: "short", day: "numeric", year: "numeric" })})`
      : ""
    facts.push({ label: "Status", value: `${evidence.status}${asOf}` })
  }
  if (evidence.issued_on) {
    facts.push({ label: "Issued", value: formatDay(evidence.issued_on, { month: "short", day: "numeric", year: "numeric" }) })
  }
  if (evidence.work_description) facts.push({ label: "Work", value: evidence.work_description })
  const inspections = (evidence.inspections ?? []).map(inspectionLine).filter((l): l is string => !!l)

  return (
    <section>
      <h3 className={SECTION_HEADING}>
        <ClipboardCheck className="w-4 h-4 text-teal-600" />
        System update check
      </h3>

      <div className="rounded-xl border border-teal-100 dark:border-teal-500/20 bg-teal-50/50 dark:bg-teal-500/10 p-4 space-y-3">
        {SCENARIO_LEAD[review.scenario] && (
          <p className="text-sm leading-relaxed text-[#0C1D38] dark:text-gray-100">{SCENARIO_LEAD[review.scenario]}</p>
        )}

        {facts.length > 0 && (
          <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-sm">
            {facts.map((f) => (
              <React.Fragment key={f.label}>
                <dt className="text-gray-500 dark:text-gray-400">{f.label}</dt>
                <dd className="text-[#0C1D38] dark:text-gray-100 break-words">{f.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}

        {inspections.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <FileText className="w-3.5 h-3.5" />
              Inspections on this permit
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
              {inspections.slice(0, 5).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Updates that mention this system&apos;s age are on hold until you answer.
        </p>
      </div>

      {/* Answered elsewhere or earlier */}
      {!open && (
        <div className="mt-3 flex items-start gap-3 py-3.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" role="status">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {review.status === "confirmed"
              ? "Answered: replaced. The system's age was updated and its updates were rescheduled."
              : review.status === "rejected"
                ? "Answered: not replaced. The system's age is unchanged."
                : "No answer needed: the system's age was updated another way."}
          </p>
        </div>
      )}

      {open && (
        <>
          <p className="mt-4 text-sm font-semibold text-[#0C1D38] dark:text-white">Was it replaced?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => chooseMode("yes")}
              aria-pressed={mode === "yes"}
              className={`${SECONDARY} ${mode === "yes" ? "!border-[#E8730A] !bg-orange-50 dark:!bg-[#E8730A]/10" : ""}`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Yes, replaced
            </button>
            <button
              type="button"
              onClick={() => chooseMode("no")}
              aria-pressed={mode === "no"}
              className={`${SECONDARY} ${mode === "no" ? "!border-[#E8730A] !bg-orange-50 dark:!bg-[#E8730A]/10" : ""}`}
            >
              <XCircle className="w-4 h-4 text-gray-500" />
              No
            </button>
          </div>

          {mode === "yes" && (
            <div className="mt-3 space-y-3 rounded-xl border border-gray-100 dark:border-white/10 p-4">
              {!review.system_id && (
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Which system?</span>
                  <select
                    value={systemId}
                    onChange={(e) => {
                      setSystemId(e.target.value)
                      setStaleRevision(null)
                    }}
                    className={`${INPUT} mt-1`}
                  >
                    <option value="">Choose the system that was replaced</option>
                    {candidates.map((id) => (
                      <option key={id} value={id}>
                        {nameOf(id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">When was it replaced?</span>
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${INPUT} mt-1`}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={monthOnly}
                  onChange={(e) => setMonthOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#E8730A]"
                />
                I only know the month
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Note (optional)</span>
                <input
                  type="text"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={`e.g. ${homeowner.split(" ")[0] || "The owner"} confirmed by text`}
                  className={`${INPUT} mt-1`}
                />
              </label>

              {staleRevision != null && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3" role="status">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#0C1D38] dark:text-gray-100">
                    This system was changed in Viano after the question was asked. Check its age on the property page if
                    you&apos;re unsure, or confirm anyway to record the replacement.
                  </p>
                </div>
              )}

              <button type="button" onClick={handleConfirm} disabled={submitting} className={`${PRIMARY} w-full sm:w-auto`}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {staleRevision != null ? "Confirm anyway" : "Confirm replacement"}
              </button>
            </div>
          )}

          {mode === "no" && (
            <div className="mt-3 space-y-3 rounded-xl border border-gray-100 dark:border-white/10 p-4">
              <fieldset className="space-y-2">
                <legend className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">What applies?</legend>
                {REJECT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                      reason === option.value
                        ? "border-[#E8730A]/50 bg-orange-50/60 dark:bg-[#E8730A]/10"
                        : "border-gray-100 dark:border-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`reject-${review.verification_id}`}
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="mt-0.5 w-4 h-4 accent-[#E8730A]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#0C1D38] dark:text-gray-100">{option.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Note (optional)</span>
                <input
                  type="text"
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Work starts in January"
                  className={`${INPUT} mt-1`}
                />
              </label>
              <button type="button" onClick={handleReject} disabled={submitting} className={`${PRIMARY} w-full sm:w-auto`}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save answer
              </button>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default SystemUpdateCheck
