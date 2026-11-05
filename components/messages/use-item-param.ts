"use client"

import { useCallback, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * A panel or card that lives in the URL as `?{name}={value}` (e.g. `?property=…`, `?item=…`), so
 * the phone's back button closes it and it can be linked to directly. Must be used under a
 * <Suspense> boundary (useSearchParams).
 *
 * Opening pushes a history entry; switching to another value while one is open replaces it (no
 * history pile-up). Closing goes back when we pushed the entry (so back and close agree), and
 * otherwise (opened from a link with the param already present) replaces the URL without it, so
 * closing never leaves the app.
 */
export function useUrlParam(name: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const value = searchParams.get(name)

  const pushedRef = useRef(false)

  // Back button (or any other navigation) removed it: nothing of ours is on the stack.
  useEffect(() => {
    if (!value) pushedRef.current = false
  }, [value])

  const urlWith = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set(name, next)
      else params.delete(name)
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [name, pathname, searchParams],
  )

  const open = useCallback(
    (next: string) => {
      if (value) {
        router.replace(urlWith(next), { scroll: false })
      } else {
        pushedRef.current = true
        router.push(urlWith(next), { scroll: false })
      }
    },
    [router, urlWith, value],
  )

  const close = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false
      router.back()
    } else {
      router.replace(urlWith(null), { scroll: false })
    }
  }, [router, urlWith])

  return { value, open, close }
}

/** The open card: `?item={itemId}`. */
export function useItemParam() {
  const { value, open, close } = useUrlParam("item")
  return { itemId: value, openItem: open, closeItem: close }
}
