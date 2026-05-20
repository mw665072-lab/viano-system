"use client"

import { useState, useEffect } from "react"
import { X, Clock, ArrowRight, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI, SystemResponse, ReplacementEventResponse } from "@/lib/api"

interface HistoryModalProps {
    propertyId: string
    system: SystemResponse
    onClose: () => void
}

export function HistoryModal({ propertyId, system, onClose }: HistoryModalProps) {
    const [history, setHistory] = useState<ReplacementEventResponse[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await systemsAPI.getReplacementHistory(propertyId, system.system_id)
                setHistory(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load history")
            } finally {
                setIsLoading(false)
            }
        }

        fetchHistory()
    }, [propertyId, system.system_id])

    const formattedSystemType = system.system_type
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatEventType = (type: string) => {
        return type
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-100">
                            <History className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38]">Replacement History</h2>
                            <p className="text-xs text-[#64748B] font-medium">
                                {formattedSystemType}{system.brand ? ` — ${system.brand}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                            <p className="text-sm text-gray-500">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                            {error}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No replacement history</h3>
                            <p className="text-xs text-gray-500">This system has not been replaced yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((event, index) => (
                                <div
                                    key={event.event_id}
                                    className="relative pl-6 pb-4 last:pb-0"
                                >
                                    {/* Timeline line */}
                                    {index < history.length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
                                    )}

                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1 w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    </div>

                                    {/* Event card */}
                                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                                                {formatEventType(event.event_type)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                {formatDate(event.replacement_date)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {event.previous_age_at_inspection} yrs
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-sm font-bold text-emerald-600">
                                                {event.new_age_at_inspection} yrs
                                            </span>
                                        </div>

                                        {event.notes && (
                                            <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-2 mt-2">
                                                &ldquo;{event.notes}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="w-full rounded-xl h-11 text-sm font-semibold"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
}
