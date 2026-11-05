"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  Check,
  Copy,
  Gift,
  Globe,
  Info,
  Loader2,
  MessageSquareText,
  SearchX,
  X,
} from "lucide-react"
import {
  ApiError,
  getFriendlyErrorMessage,
  getOutreachErrorCode,
  outreachAPI,
  propertyAPI,
  type OutreachCard,
  type OutreachContact,
} from "@/lib/api"
import { ClipboardUnavailableError, copyFromServer, findDay, formatDay, selectContents } from "@/lib/outreach-dates"
import { Skeleton } from "@/components/ui/skeleton"
import { KindBadge } from "./kind-badge"
import { ContactedChip, StatusBadges } from "./status-badges"
import { MarkContacted } from "./mark-contacted"
import { RecommendationsSection } from "./recommendations-section"

const FONT = { fontFamily: "Manrope, sans-serif" }

const SECTION_HEADING =
  "flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"

export interface MessageCardFlags {
  overdue?: boolean
  isNew?: boolean
}

interface MessageCardProps {
  /** The update to show; null keeps the card closed. */
  itemId: string | null
  /** Overdue / New, when the list that opened the card flagged them. */
  flags?: MessageCardFlags
  onClose: () => void
  /** Something changed server-side (contacted, withdrawn): the page should refetch its list. */
  onChanged?: () => void
}

/**
 * The Messages card: why the update is due, the homeowner draft to copy, contractor recommendations
 * on request, and Mark contacted. A bottom sheet on mobile and a centered modal on larger screens.
 *
 * Built only on the /api/outreach endpoints. It never calls the legacy touchpoint detail endpoint
 * (which calls Google Places on every open).
 */
export function MessageCard({ itemId, flags, onClose, onChanged }: MessageCardProps) {
  const open = itemId != null

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

  if (!itemId || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="message-card-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-2xl max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] flex flex-col bg-white dark:bg-[#161616] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden"
        style={FONT}
      >
        {/* Remount per item: per-open state and the once-per-open guards reset with it. */}
        <MessageCardBody key={itemId} itemId={itemId} flags={flags} onClose={onClose} onChanged={onChanged} />
      </div>
    </div>,
    document.body,
  )
}

interface Notice {
  tone: "info" | "warning"
  text: string
}

function MessageCardBody({
  itemId,
  flags,
  onClose,
  onChanged,
}: {
  itemId: string
  flags?: MessageCardFlags
  onClose: () => void
  onChanged?: () => void
}) {
  const [card, setCard] = useState<OutreachCard | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [loadVersion, setLoadVersion] = useState(0)

  // Draft preparation. Auto-prepare runs at most once per open (guarded by a ref, so StrictMode's
  // double effect in development doesn't call it twice); after that only an explicit action does.
  const autoPrepareStartedRef = useRef(false)
  const [prepareDone, setPrepareDone] = useState(false)
  const [repreparing, setRepreparing] = useState(false)
  const [prepareError, setPrepareError] = useState<string | null>(null)

  const [notice, setNotice] = useState<Notice | null>(null)

  // Copy
  const [copyBusy, setCopyBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [manualCopy, setManualCopy] = useState(false)
  const draftRef = useRef<HTMLParagraphElement | null>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Anniversary card image (lazy, after the main card; first view may generate the image).
  const annRequestedRef = useRef(false)
  const [annUrl, setAnnUrl] = useState<string | null>(null)
  const [annError, setAnnError] = useState(false)

  // This instance only ever shows `itemId` (it remounts per item), so "is this response still
  // wanted" is "is this instance still mounted". Used for requests that must survive StrictMode's
  // effect re-run (prepare, anniversary card), which a per-effect flag would drop.
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  // Load the card: a pure database read.
  useEffect(() => {
    let live = true
    outreachAPI.getCard(itemId).then(
      (c) => {
        if (live) setCard(c)
      },
      (err: unknown) => {
        if (!live) return
        // A 404 (removed, transferred, someone else's) is an expected state, not an error.
        if (!(err instanceof ApiError && err.status === 404)) console.error("Outreach card fetch error:", err)
        setLoadError(err)
      },
    )
    return () => {
      live = false
    }
  }, [itemId, loadVersion])

  const reloadCard = useCallback(() => {
    outreachAPI
      .getCard(itemId)
      .then((c) => {
        if (aliveRef.current) setCard(c)
      })
      .catch((err: unknown) => console.error("Outreach card refetch error:", err))
  }, [itemId])

  const markWithdrawn = useCallback(() => {
    setCard((c) => (c ? { ...c, withdrawn: true } : c))
    setNotice(null)
    onChanged?.()
  }, [onChanged])

  const showNotFound = useCallback(
    (err: unknown) => {
      setLoadError(err)
      onChanged?.()
    },
    [onChanged],
  )

  const runPrepare = useCallback(() => {
    outreachAPI
      .prepare(itemId)
      .then((c) => {
        if (!aliveRef.current) return
        setCard(c)
        setPrepareError(c.withdrawn || c.draft.status === "ready" ? null : "The message isn't ready yet.")
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return
        if (getOutreachErrorCode(err) === "withdrawn") {
          markWithdrawn()
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          showNotFound(err)
          return
        }
        console.error("Outreach prepare error:", err)
        setPrepareError(getFriendlyErrorMessage(err, "We couldn't prepare the message. Please try again."))
      })
      .finally(() => {
        if (!aliveRef.current) return
        setPrepareDone(true)
        setRepreparing(false)
      })
  }, [itemId, markWithdrawn, showNotFound])

  const needsPrepare = !!card && !card.withdrawn && card.draft.status !== "ready"

  // Auto-prepare once per open when the draft is missing or stale.
  useEffect(() => {
    if (!needsPrepare || autoPrepareStartedRef.current) return
    autoPrepareStartedRef.current = true
    runPrepare()
  }, [needsPrepare, runPrepare])

  const anniversaryYear = card && !card.withdrawn ? card.anniversary_year : null

  const fetchAnniversaryCard = useCallback(() => {
    propertyAPI
      .getAnniversaryCard(itemId)
      .then((res) => {
        if (!aliveRef.current) return
        if (res.card_url) setAnnUrl(res.card_url)
        else setAnnError(true)
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return
        console.error("Anniversary card fetch error:", err)
        setAnnError(true)
      })
  }, [itemId])

  // Lazily load the anniversary card once the main card says it applies (once per open).
  useEffect(() => {
    if (anniversaryYear == null || annRequestedRef.current) return
    annRequestedRef.current = true
    fetchAnniversaryCard()
  }, [anniversaryYear, fetchAnniversaryCard])

  // Clipboard blocked: select the draft so the Realtor can press and hold to copy.
  useEffect(() => {
    if (manualCopy) selectContents(draftRef.current)
  }, [manualCopy, card?.draft.text])

  const handleCopy = () => {
    if (!card || copyBusy) return
    // Start the request synchronously inside the tap (iOS Safari); copy what the server returns,
    // never the text on screen, so an outdated draft can't be copied.
    const pending = copyFromServer(() => outreachAPI.copy(itemId).then((r) => r.text))
    setCopyBusy(true)
    setCopyError(null)
    setManualCopy(false)
    pending
      .then((text) => {
        if (!aliveRef.current) return
        setCard((c) => (c && c.draft.text !== text ? { ...c, draft: { ...c.draft, text } } : c))
        setCopied(true)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 2000)
      })
      .catch((err: unknown) => {
        if (!aliveRef.current) return
        if (err instanceof ClipboardUnavailableError) {
          setCard((c) => (c && c.draft.text !== err.text ? { ...c, draft: { ...c.draft, text: err.text } } : c))
          setManualCopy(true)
          return
        }
        const code = getOutreachErrorCode(err)
        if (code === "draft_stale" || code === "draft_not_ready") {
          // Show the updated draft for review. Never auto-copy it.
          setNotice({ tone: "warning", text: "This update changed. Review the updated message, then copy again." })
          setPrepareError(null)
          setRepreparing(true)
          runPrepare()
          return
        }
        if (code === "withdrawn") {
          markWithdrawn()
          return
        }
        if (err instanceof ApiError && err.status === 404) {
          showNotFound(err)
          return
        }
        console.error("Outreach copy error:", err)
        setCopyError(getFriendlyErrorMessage(err, "We couldn't copy the message. Please try again."))
      })
      .finally(() => {
        if (aliveRef.current) setCopyBusy(false)
      })
  }

  const handlePrepareAgain = () => {
    setPrepareError(null)
    setRepreparing(true)
    runPrepare()
  }

  const handleContacted = (contact: OutreachContact) => {
    setCard((c) => (c ? { ...c, contact } : c))
    setNotice(null)
    onChanged?.()
  }

  const handleAlreadyContacted = (serverMessage: string) => {
    const day = findDay(serverMessage)
    setNotice({
      tone: "info",
      text: day ? `Already marked contacted on ${formatDay(day)}.` : serverMessage || "This update was already marked contacted.",
    })
    reloadCard()
    onChanged?.()
  }

  const handleRetryLoad = () => {
    setLoadError(null)
    setLoadVersion((v) => v + 1)
  }

  const handleRetryAnniversary = () => {
    setAnnError(false)
    fetchAnniversaryCard()
  }

  const isLoading = !card && !loadError
  const notFound = loadError instanceof ApiError && loadError.status === 404
  const draftLoading = repreparing || (needsPrepare && !prepareDone && !prepareError)
  const draftText = card && card.draft.status === "ready" ? card.draft.text : null

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          ) : card && !loadError ? (
            <>
              <h2 id="message-card-title" className="text-base sm:text-lg font-bold text-[#0C1D38] dark:text-white leading-tight break-words">
                {card.title}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 break-words">
                {[card.homeowner, card.address].filter(Boolean).join(" • ")}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {card.outreach_on && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mr-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDay(card.outreach_on, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                <KindBadge kind={card.kind} />
                <StatusBadges overdue={flags?.overdue && !card.contact} isNew={flags?.isNew && !card.contact} />
                {card.contact && (
                  <ContactedChip label={`Contacted on ${formatDay(card.contact.contacted_on, { month: "short", day: "numeric" })}`} />
                )}
              </div>
            </>
          ) : (
            <h2 id="message-card-title" className="text-base sm:text-lg font-bold text-[#0C1D38] dark:text-white leading-tight">
              Update
            </h2>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex-shrink-0 w-10 h-10 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">
        {isLoading && (
          <div className="space-y-5" aria-busy="true">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        )}

        {notFound && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-2">
              <SearchX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-[#0C1D38] dark:text-white">This update isn&apos;t available</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[280px]">
              It may have been removed, or the property was transferred.
            </p>
          </div>
        )}

        {!!loadError && !notFound && (
          <div className="flex items-start gap-3 py-4 px-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/30" role="alert">
            <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {getFriendlyErrorMessage(loadError, "We couldn't load this update. Please try again.")}
              </p>
              <button
                type="button"
                onClick={handleRetryLoad}
                className="mt-1 min-h-10 text-xs font-semibold text-red-700 dark:text-red-300 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {card && !loadError && (
          <>
            {card.withdrawn && (
              <div className="flex items-start gap-3 py-3.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" role="status">
                <Ban className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  This update was withdrawn (transfer, system change or billing hold). Nothing to send.
                </p>
              </div>
            )}

            {notice && (
              <div
                role="status"
                className={`flex items-start gap-3 py-3.5 px-4 rounded-xl border ${
                  notice.tone === "warning"
                    ? "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
                    : "border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10"
                }`}
              >
                <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${notice.tone === "warning" ? "text-amber-600 dark:text-amber-400" : "text-blue-500"}`} />
                <p className="text-sm text-[#0C1D38] dark:text-gray-100">{notice.text}</p>
              </div>
            )}

            {/* Why it's due */}
            {card.reason && (
              <section>
                <h3 className={SECTION_HEADING}>
                  <Info className="w-4 h-4 text-blue-500" />
                  Why it&apos;s due
                </h3>
                <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-4">
                  <p className="text-sm leading-relaxed text-[#0C1D38] dark:text-gray-100 whitespace-pre-wrap break-words">{card.reason}</p>
                </div>
              </section>
            )}

            {/* Message to the homeowner */}
            {!card.withdrawn && (
              <section>
                <h3 className={SECTION_HEADING}>
                  <MessageSquareText className="w-4 h-4 text-orange-500" />
                  Message to {card.homeowner || "the homeowner"}
                </h3>

                {draftLoading && (
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4 space-y-2" aria-busy="true">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <Skeleton className="h-3.5 w-11/12 rounded" />
                    <Skeleton className="h-3.5 w-4/5 rounded" />
                    <Skeleton className="h-3.5 w-2/3 rounded" />
                    <p className="pt-1 text-[11px] text-gray-400 dark:text-gray-500">Preparing the message…</p>
                  </div>
                )}

                {!draftLoading && draftText && (
                  <>
                    <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4">
                      <p ref={draftRef} className="text-sm leading-relaxed text-[#0C1D38] dark:text-gray-100 whitespace-pre-wrap break-words select-text">
                        {draftText}
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={handleCopy}
                        disabled={copyBusy}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-[#0C1D38] dark:text-gray-100 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-70"
                      >
                        {copyBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : copied ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copied ? "Copied" : "Copy message"}
                      </button>
                      {manualCopy && (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400" role="status">
                          Couldn&apos;t copy automatically. Press and hold to copy.
                        </p>
                      )}
                      {copyError && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                          {copyError}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {!draftLoading && !draftText && (
                  <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {prepareError ?? "The message hasn't been prepared yet."}
                    </p>
                    <button
                      type="button"
                      onClick={handlePrepareAgain}
                      className="mt-1 min-h-10 text-xs font-semibold text-orange-600 dark:text-orange-400 underline underline-offset-2"
                    >
                      {prepareError ? "Try again" : "Prepare message"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Anniversary card */}
            {anniversaryYear != null && (
              <section>
                <h3 className={SECTION_HEADING}>
                  <Gift className="w-4 h-4 text-pink-500" />
                  {anniversaryYear}-year anniversary card
                </h3>
                <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 p-4">
                  {!annUrl && !annError && (
                    <div className="flex flex-col items-center">
                      <Skeleton className="w-full max-w-xs aspect-square rounded-xl" />
                      <Skeleton className="mt-3 h-3 w-56 max-w-full rounded" />
                      <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 text-center">
                        Creating a personalized card… this can take a few seconds.
                      </p>
                    </div>
                  )}
                  {annUrl && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={annUrl}
                        alt={`${anniversaryYear}-year anniversary card for ${card.homeowner || "the homeowner"}`}
                        className="w-full max-w-xs mx-auto rounded-xl border border-gray-100 dark:border-white/10 shadow-sm"
                        loading="lazy"
                      />
                      <div className="mt-3 flex items-center justify-center">
                        <a
                          href={annUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 min-h-10 px-3 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Open full size
                        </a>
                      </div>
                    </>
                  )}
                  {!annUrl && annError && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">The card couldn&apos;t be generated right now.</p>
                      <button
                        type="button"
                        onClick={handleRetryAnniversary}
                        className="mt-1 min-h-10 text-xs font-semibold text-orange-600 dark:text-orange-400 underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Contractor recommendations: on request only */}
            {card.recommendations_available && !card.withdrawn && (
              <RecommendationsSection
                itemId={itemId}
                homeowner={card.homeowner || "the homeowner"}
                onWithdrawn={markWithdrawn}
                onNotFound={showNotFound}
              />
            )}
          </>
        )}
      </div>

      {/* Footer: Mark contacted (pending, not withdrawn) */}
      {card && !loadError && !card.withdrawn && !card.contact && (
        <div className="px-5 sm:px-6 py-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#161616] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <MarkContacted
            itemId={itemId}
            homeowner={card.homeowner || "the homeowner"}
            onContacted={handleContacted}
            onAlreadyContacted={handleAlreadyContacted}
            onWithdrawn={markWithdrawn}
            onNotFound={showNotFound}
          />
        </div>
      )}
    </>
  )
}

export default MessageCard
