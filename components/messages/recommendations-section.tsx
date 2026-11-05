"use client"

import React, { useEffect, useRef, useState } from "react"
import { Check, Copy, Globe, Loader2, MapPin, Phone, Star, Wrench } from "lucide-react"
import {
  ApiError,
  getFriendlyErrorMessage,
  getOutreachErrorCode,
  outreachAPI,
  type ContractorReferral,
  type OutreachRecommendations,
} from "@/lib/api"
import { ClipboardUnavailableError, copyText, selectContents } from "@/lib/outreach-dates"
import { Skeleton } from "@/components/ui/skeleton"

interface RecommendationsSectionProps {
  itemId: string
  homeowner: string
  /** The update was withdrawn (409): the card switches to its withdrawn state. */
  onWithdrawn: () => void
  /** The update is gone (404): the card shows its not-found state. */
  onNotFound: (err: unknown) => void
}

/** "HVAC contractor" -> "HVAC contractors"; null -> "contractors". */
function pluralTrade(trade: string | null): string {
  const t = trade?.trim()
  if (!t) return "contractors"
  return /s$/i.test(t) ? t : `${t}s`
}

/**
 * Contractor recommendations, fetched only when the Realtor taps the button.
 *
 * Every fetch is a paid Google Places call, so: one request per tap (the button is disabled while
 * it runs), no prefetch, no polling, and the result lives in component state only. It's gone when
 * the card closes, and it is never written to localStorage/sessionStorage (Places terms forbid
 * storing place details).
 */
export function RecommendationsSection({ itemId, homeowner, onWithdrawn, onNotFound }: RecommendationsSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OutreachRecommendations | null>(null)
  const [copied, setCopied] = useState(false)
  const [manualCopy, setManualCopy] = useState(false)
  const copyBoxRef = useRef<HTMLPreElement | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
  }, [])

  // When the clipboard is blocked, select the text so the Realtor can press and hold to copy.
  useEffect(() => {
    if (manualCopy) selectContents(copyBoxRef.current)
  }, [manualCopy])

  const handleShow = () => {
    if (loading) return
    setLoading(true)
    setError(null)
    outreachAPI
      .getRecommendations(itemId)
      .then((res) => setResult(res))
      .catch((err: unknown) => {
        if (getOutreachErrorCode(err) === "withdrawn") {
          onWithdrawn()
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          onNotFound(err)
          return
        }
        console.error("Recommendations fetch error:", err)
        setError(getFriendlyErrorMessage(err, "We couldn't load recommendations. Please try again."))
      })
      .finally(() => setLoading(false))
  }

  const handleCopy = () => {
    const text = result?.copy_text
    if (!text) return
    copyText(text)
      .then(() => {
        setManualCopy(false)
        setCopied(true)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch((err: unknown) => {
        if (err instanceof ClipboardUnavailableError) setManualCopy(true)
      })
  }

  const trades = pluralTrade(result?.trade ?? null)
  const heading = result?.trade ? `Recommended ${trades}` : "Recommendations"

  return (
    <section aria-labelledby={`recs-${itemId}`}>
      <h3
        id={`recs-${itemId}`}
        className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
      >
        <Wrench className="w-4 h-4 text-orange-500" />
        {result && result.contractors.length > 0 ? heading : "Contractor recommendations"}
      </h3>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Share these only if {homeowner} asks.</p>

      {/* Not fetched yet (or the last attempt failed) */}
      {!result && !loading && (
        <>
          {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
          <button
            type="button"
            onClick={handleShow}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-[#0C1D38] dark:text-gray-100 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Wrench className="w-4 h-4 text-orange-500" />
            {error ? "Try again" : "Show recommendations"}
          </button>
        </>
      )}

      {loading && (
        <div className="space-y-2.5" aria-busy="true" aria-label="Loading recommendations">
          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Finding contractors near the property…
          </p>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {result && !result.available && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No contractor recommendations apply to this update.</p>
      )}

      {/* available but empty covers both "nothing nearby" and "property has no ZIP code" */}
      {result && result.available && result.contractors.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No highly rated {trades} found nearby.</p>
      )}

      {result && result.available && result.contractors.length > 0 && (
        <>
          <div className="space-y-2.5">
            {result.contractors.map((c, i) => (
              <ContractorRow key={`${c.name}-${i}`} contractor={c} />
            ))}
          </div>

          {result.copy_text && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-[#0C1D38] dark:text-gray-100 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy recommendations"}
              </button>
              {manualCopy && (
                <>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400" role="status">
                    Couldn&apos;t copy automatically. Press and hold to copy.
                  </p>
                  <pre
                    ref={copyBoxRef}
                    className="mt-2 max-h-48 overflow-auto rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-3 text-xs leading-relaxed text-[#0C1D38] dark:text-gray-100 whitespace-pre-wrap break-words select-all"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {result.copy_text}
                  </pre>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

/** One contractor, matching the rows in AlertDetailModal (rating, address, phone link, website). */
function ContractorRow({ contractor: c }: { contractor: ContractorReferral }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[#0C1D38] dark:text-white break-words min-w-0">{c.name}</p>
        {c.rating != null && (
          <span className="inline-flex items-center gap-1 flex-shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            {c.rating}
          </span>
        )}
      </div>
      {c.address && (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">{c.address}</span>
        </p>
      )}
      {(c.phone || c.website) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center gap-1.5 min-h-10 px-3 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {c.phone}
            </a>
          )}
          {c.website && (
            <a
              href={c.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 min-h-10 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Website
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default RecommendationsSection
