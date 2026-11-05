"use client"

import React, { Suspense, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

/**
 * Old per-property URL: /messages/property/{id}?month=…[&item=…]. Properties now open in the
 * Messages page's detail panel (like Manage Properties), so redirect to
 * /messages?month=…&property={id}[&item=…] to keep any shared or bookmarked link working.
 */
function RedirectToPanel() {
  const router = useRouter()
  const params = useParams<{ propertyId: string }>()
  const searchParams = useSearchParams()

  useEffect(() => {
    const next = new URLSearchParams()
    const month = searchParams.get("month")
    const item = searchParams.get("item")
    if (month) next.set("month", month)
    if (params?.propertyId) next.set("property", params.propertyId)
    if (item) next.set("item", item)
    router.replace(`/messages?${next.toString()}`)
  }, [params?.propertyId, searchParams, router])

  return <div className="h-full bg-[#F8F9FB] dark:bg-[#0f0f0f]" />
}

export default function PropertyMessagesRedirect() {
  return (
    <Suspense fallback={<div className="h-full bg-[#F8F9FB] dark:bg-[#0f0f0f]" />}>
      <RedirectToPanel />
    </Suspense>
  )
}
