"use client"

import React, { Suspense, useCallback, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  outreachAPI,
  type OutreachMonthResponse,
  type OutreachPropertyMonthResponse,
} from "@/lib/api"
import { isValidMonth } from "@/lib/outreach-dates"
import { useKeyedRequest } from "@/lib/use-keyed-request"
import { MessageCard } from "@/components/messages/message-card"
import { PropertyQueueList } from "@/components/messages/property-queue-list"
import { PropertyUpdatesPanel } from "@/components/messages/property-updates-panel"
import { useItemParam, useUrlParam } from "@/components/messages/use-item-param"

/**
 * Messages: /messages?month=YYYY-MM[&property={id}][&item={itemId}].
 *
 * The month URL is the monthly SMS link's target, so the path and `month` parameter must stay
 * exactly this. Without `month` the server picks the current month (Eastern) and the URL is
 * rewritten to carry it. Laid out like Manage Properties: the property list fills the width; picking
 * a property narrows it and opens that property's updates beside it (a full-screen overlay on
 * phones); an update opens its card on top.
 */
function MessagesQueue() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get("month")
  const { value: propertyId, open: openProperty, close: closeProperty } = useUrlParam("property")
  const { itemId, openItem, closeItem } = useItemParam()

  // Month summary (pure DB read).
  const monthFetcher = useCallback(() => outreachAPI.getMonth(monthParam || undefined), [monthParam])
  const monthReq = useKeyedRequest<OutreachMonthResponse>(monthParam ?? "", monthFetcher, (d) => d.month)

  // First load without ?month=: put the server's month in the URL, keeping property/item.
  useEffect(() => {
    if (!monthParam && monthReq.data?.month) {
      const next = new URLSearchParams(searchParams.toString())
      next.set("month", monthReq.data.month)
      router.replace(`/messages?${next.toString()}`, { scroll: false })
    }
  }, [monthParam, monthReq.data?.month, searchParams, router])

  const month = monthReq.data?.month ?? (isValidMonth(monthParam) ? monthParam : null)

  // The selected property's updates for the month (pure DB read), once the month is known.
  const propertyFetcher = useCallback(
    () => outreachAPI.getPropertyMonth(propertyId ?? "", month ?? undefined),
    [propertyId, month],
  )
  const propertyReq = useKeyedRequest<OutreachPropertyMonthResponse>(
    propertyId && month ? `${propertyId}|${month}` : null,
    propertyFetcher,
  )

  const { refresh: refreshMonth } = monthReq
  const { refresh: refreshProperty } = propertyReq
  const handleChanged = useCallback(() => {
    refreshMonth()
    refreshProperty()
  }, [refreshMonth, refreshProperty])

  const selectedRow = monthReq.data?.properties.find((p) => p.property_id === propertyId) ?? null
  const fallback = selectedRow ? { address: selectedRow.address, homeowner: selectedRow.homeowner } : null

  // Overdue / New for the open card, from the list that flagged them.
  const openFlags = useMemo(() => {
    const item = propertyReq.data?.items.find((i) => i.item_id === itemId)
    return item ? { overdue: item.overdue, isNew: item.new } : undefined
  }, [propertyReq.data, itemId])

  const detailOpen = !!propertyId

  const panel = detailOpen ? (
    <PropertyUpdatesPanel
      month={month}
      data={propertyReq.data}
      isLoading={propertyReq.isLoading || (!!propertyId && !month)}
      error={propertyReq.error}
      onRetry={propertyReq.retry}
      onClose={closeProperty}
      onOpenItem={openItem}
      activeItemId={itemId}
      fallback={fallback}
    />
  ) : null

  return (
    <div className="h-full flex flex-col bg-[#F8F9FB] dark:bg-[#0f0f0f]">
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* Left: property list */}
        <div
          className={`flex flex-col w-full bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden h-full transition-all duration-300 ${
            detailOpen ? "lg:w-125 lg:flex-shrink-0" : ""
          }`}
        >
          <PropertyQueueList
            month={month}
            data={monthReq.data}
            isLoading={monthReq.isLoading}
            error={monthReq.error}
            onRetry={monthReq.retry}
            selectedPropertyId={propertyId}
            onSelect={openProperty}
            onCloseDetails={closeProperty}
            expanded={!detailOpen}
          />
        </div>

        {/* Right: the property's updates */}
        {panel && (
          <>
            <div className="hidden lg:flex lg:flex-col flex-1 min-w-0 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden relative">
              {panel}
            </div>
            {/* Phones: full-screen overlay, like the Manage Properties detail */}
            <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-[#1a1a1a] overflow-y-auto">{panel}</div>
          </>
        )}
      </div>

      <MessageCard itemId={itemId} flags={openFlags} onClose={closeItem} onChanged={handleChanged} />
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-full bg-[#F8F9FB] dark:bg-[#0f0f0f]" />}>
      <MessagesQueue />
    </Suspense>
  )
}
