"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Settled<T> {
  /** The key the caller asked for. */
  requestKey: string
  /** The key the response says it belongs to (differs only when `keyOf` resolves it). */
  key: string
  data: T | null
  error: unknown
}

export interface KeyedRequest<T> {
  /** Data for the current key (kept on screen during a background refresh). */
  data: T | null
  /** The error from the last request for the current key, if it failed. */
  error: unknown
  /** True until the current key has a response, and while a retry is in flight. */
  isLoading: boolean
  /** Refetch and show the loading state again (for an error box's Retry). */
  retry: () => void
  /** Refetch in the background, keeping the current data visible (e.g. after a change). */
  refresh: () => void
}

/**
 * Fetches `fetcher()` whenever `key` changes, and ignores responses for any key that's no longer
 * current, so switching months or items quickly never paints the wrong data. `key: null` fetches
 * nothing.
 *
 * Loading is derived from "does the current key have a response yet", so no state is set
 * synchronously inside an effect (react-hooks/set-state-in-effect).
 *
 * `keyOf` lets a response name the key it really belongs to. The month page asks for key "" (no
 * month: the server picks the current one), the response says "2026-12", and when the page then
 * puts `?month=2026-12` in the URL the data is already here, so it isn't fetched twice.
 */
export function useKeyedRequest<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  keyOf?: (data: T) => string,
): KeyedRequest<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [version, setVersion] = useState(0)
  const [retrying, setRetrying] = useState(false)

  // Always call the latest fetcher without making it an effect dependency.
  const fetcherRef = useRef(fetcher)
  const keyOfRef = useRef(keyOf)
  useEffect(() => {
    fetcherRef.current = fetcher
    keyOfRef.current = keyOf
  })

  // Set when a response resolved to a different key; the next run for that key is skipped once.
  const adoptedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (key == null) return
    if (adoptedKeyRef.current === key) {
      adoptedKeyRef.current = null
      return
    }
    adoptedKeyRef.current = null

    let live = true
    fetcherRef.current().then(
      (data) => {
        if (!live) return
        const resolved = keyOfRef.current ? keyOfRef.current(data) : key
        if (resolved !== key) adoptedKeyRef.current = resolved
        setSettled({ requestKey: key, key: resolved, data, error: null })
        setRetrying(false)
      },
      (error: unknown) => {
        if (!live) return
        setSettled((prev) => ({
          requestKey: key,
          key,
          // A failed background refresh keeps the data that's already on screen.
          data: prev && (prev.key === key || prev.requestKey === key) ? prev.data : null,
          error,
        }))
        setRetrying(false)
      },
    )
    return () => {
      live = false
    }
  }, [key, version])

  const retry = useCallback(() => {
    setRetrying(true)
    setVersion((v) => v + 1)
  }, [])

  const refresh = useCallback(() => {
    setVersion((v) => v + 1)
  }, [])

  const current = key != null && settled && (settled.key === key || settled.requestKey === key) ? settled : null

  return {
    data: current ? current.data : null,
    error: current ? current.error : null,
    isLoading: key != null && (!current || retrying),
    retry,
    refresh,
  }
}
