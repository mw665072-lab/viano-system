"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  X,
  Phone,
  Star,
  MapPin,
  Globe,
  Copy,
  Check,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  MessageSquareText,
  Wrench,
  Info,
  Gift,
} from "lucide-react"
import { propertyAPI, getFriendlyErrorMessage, type TouchpointDetailResponse } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

const PRIORITY_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  3: { bg: "bg-emerald-50 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", label: "Low priority" },
  2: { bg: "bg-orange-50 dark:bg-orange-500/15", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-500/30", label: "Medium priority" },
  1: { bg: "bg-red-50 dark:bg-red-500/15", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-500/30", label: "High priority" },
}

function getPriorityStyle(priority: number | null) {
  if (priority == null) return null
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES[1]
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

const FONT = { fontFamily: "Manrope, sans-serif" }

interface AlertDetailModalProps {
  messageId: string | null
  open: boolean
  onClose: () => void
}

export function AlertDetailModal({ messageId, open, onClose }: AlertDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<TouchpointDetailResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState(false)

  // Tracks the message the modal currently wants to show. Async responses for
  // any other id are discarded, so a slow in-flight request for a previously
  // viewed message can never overwrite the current property's detail/card.
  const activeMessageIdRef = useRef<string | null>(null)

  const fetchDetail = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    setDetail(null)
    setCopied(false)
    setCardUrl(null)
    setCardError(false)
    setCardLoading(false)
    try {
      const result = await propertyAPI.getTouchpointDetail(id)
      if (activeMessageIdRef.current !== id) return
      setDetail(result)
    } catch (err) {
      if (activeMessageIdRef.current !== id) return
      console.error("Touchpoint detail fetch error:", err)
      setError(getFriendlyErrorMessage(err, "We couldn't load this message. Please try again."))
    } finally {
      if (activeMessageIdRef.current === id) setIsLoading(false)
    }
  }, [])

  const fetchCard = useCallback(async (id: string) => {
    setCardLoading(true)
    setCardError(false)
    setCardUrl(null)
    try {
      const res = await propertyAPI.getAnniversaryCard(id)
      if (activeMessageIdRef.current !== id) return
      if (res.card_url) {
        setCardUrl(res.card_url)
      } else {
        setCardError(true)
      }
    } catch (err) {
      if (activeMessageIdRef.current !== id) return
      console.error("Anniversary card fetch error:", err)
      setCardError(true)
    } finally {
      if (activeMessageIdRef.current === id) setCardLoading(false)
    }
  }, [])

  useEffect(() => {
    activeMessageIdRef.current = messageId
    if (open && messageId) {
      fetchDetail(messageId)
    }
  }, [open, messageId, fetchDetail])

  // Lazily generate/fetch the card once detail confirms this is a
  // card-eligible anniversary touchpoint (keeps the main modal snappy).
  useEffect(() => {
    if (open && detail?.message_id && detail.anniversary_year != null) {
      fetchCard(detail.message_id)
    }
  }, [open, detail?.message_id, detail?.anniversary_year, fetchCard])

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const handleCopy = useCallback(async () => {
    const text = detail?.client_message || detail?.message_text || ""
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (permissions/insecure context) — fail silently.
    }
  }, [detail])

  if (!open || typeof document === "undefined") return null

  // Only treat loaded detail as current when it matches the message the modal is
  // showing. Guards against a stale, slow response painting the wrong property.
  const activeDetail = detail && detail.message_id === messageId ? detail : null
  const priority = activeDetail ? getPriorityStyle(activeDetail.priority) : null
  const clientMessage = activeDetail?.client_message || activeDetail?.message_text || ""

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-[#161616] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
        style={FONT}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="h-5 w-40 rounded bg-gray-100 dark:bg-white/10 animate-pulse" />
            ) : (
              <>
                <h2 className="text-base sm:text-lg font-bold text-[#0C1D38] dark:text-white leading-tight truncate">
                  {activeDetail?.alert_type || "Message details"}
                </h2>
                {activeDetail && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[activeDetail.client_name, activeDetail.property_address].filter(Boolean).join(" • ")}
                  </p>
                )}
              </>
            )}
          </div>
          {priority && (
            <span className={`hidden sm:inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${priority.bg} ${priority.text} ${priority.border}`}>
              {priority.label}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Loading skeleton — mirrors the real content layout */}
          {isLoading && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div className="flex items-start gap-3 py-4 px-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                {messageId && (
                  <button
                    onClick={() => fetchDetail(messageId)}
                    className="mt-2 text-xs font-semibold text-red-700 dark:text-red-300 underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {detail && detail.message_id === messageId && !isLoading && !error && (
            <>
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                {detail.scheduled_for && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(detail.scheduled_for)}
                  </span>
                )}
                {detail.trigger && (
                  <span className="inline-flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    {detail.trigger}
                  </span>
                )}
                {priority && (
                  <span className={`sm:hidden inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md border ${priority.bg} ${priority.text} ${priority.border}`}>
                    {priority.label}
                  </span>
                )}
              </div>

              {/* Client message */}
              {clientMessage && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <MessageSquareText className="w-4 h-4 text-orange-500" />
                      Message to {detail.client_name || "client"}
                    </h3>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4">
                    <p className="text-sm leading-relaxed text-[#0C1D38] dark:text-gray-100 whitespace-pre-wrap">
                      {clientMessage}
                    </p>
                  </div>
                </section>
              )}

              {/* Anniversary card */}
              {detail.anniversary_year != null && (
                <section>
                  <h3 className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <Gift className="w-4 h-4 text-pink-500" />
                    {detail.anniversary_year}-year anniversary card
                  </h3>
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4">
                    {cardLoading && (
                      <div className="flex flex-col items-center">
                        <Skeleton className="w-full max-w-xs aspect-square rounded-xl" />
                        <Skeleton className="mt-3 h-3 w-56 rounded" />
                        <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                          Creating a personalized card… this can take a few seconds.
                        </p>
                      </div>
                    )}
                    {!cardLoading && cardUrl && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={cardUrl}
                          alt={`${detail.anniversary_year}-year anniversary card for ${detail.client_name || "client"}`}
                          className="w-full max-w-xs mx-auto rounded-xl border border-gray-100 dark:border-white/10 shadow-sm"
                          loading="lazy"
                        />
                        <div className="mt-3 flex items-center justify-center">
                          <a
                            href={cardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Open full size
                          </a>
                        </div>
                      </>
                    )}
                    {!cardLoading && !cardUrl && cardError && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          The card couldn&apos;t be generated right now.
                        </p>
                        <button
                          onClick={() => detail.message_id && fetchCard(detail.message_id)}
                          className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400 underline underline-offset-2"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Agent context */}
              {detail.realtor_context && (
                <section>
                  <h3 className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <Info className="w-4 h-4 text-blue-500" />
                    Why this matters
                  </h3>
                  <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-4">
                    <p className="text-sm leading-relaxed text-[#0C1D38] dark:text-gray-100 whitespace-pre-wrap">
                      {detail.realtor_context}
                    </p>
                  </div>
                </section>
              )}

              {/* Contractors */}
              {detail.contractors.length > 0 && (
                <section>
                  <h3 className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    Recommended contractors near {detail.client_name || "the property"}
                  </h3>
                  <div className="space-y-2.5">
                    {detail.contractors.map((c, i) => (
                      <div
                        key={`${c.name}-${i}`}
                        className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-[#0C1D38] dark:text-white">{c.name}</p>
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
                            <span>{c.address}</span>
                          </p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {c.phone && (
                            <a
                              href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition-colors"
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
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CMA */}
              {detail.cma && (
                <section>
                  <h3 className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Estimated value (CMA)
                  </h3>
                  <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 p-4">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-[#0C1D38] dark:text-white">
                        ${detail.cma.price.toLocaleString()}
                      </span>
                      {detail.cma.formatted && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Range {detail.cma.formatted}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      {detail.cma.confidence_score != null && (
                        <span>Confidence {detail.cma.confidence_score}%</span>
                      )}
                      {detail.cma.last_sale_price != null && (
                        <span>Last sold ${detail.cma.last_sale_price.toLocaleString()}</span>
                      )}
                      {detail.cma.valued_at && (
                        <span>As of {formatDate(detail.cma.valued_at)}</span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Nothing-extra note when SMS-off + no enrichment */}
              {!clientMessage && !detail.realtor_context && detail.contractors.length === 0 && !detail.cma && (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                  No additional details are available for this message.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AlertDetailModal
