"use client"

import { useState } from "react"
import { X, Calendar, Loader2, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI, SystemResponse } from "@/lib/api"

interface ResetModalProps {
    propertyId: string
    system: SystemResponse
    onClose: () => void
    onSuccess: (alertCount: number) => void
}

export function ResetModal({ propertyId, system, onClose, onSuccess }: ResetModalProps) {
    const [replacementDate, setReplacementDate] = useState(() => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    })
    const [notes, setNotes] = useState("")
    const [eventType, setEventType] = useState<'full_replacement' | 'age_adjustment'>("full_replacement")
    const [adjustedAge, setAdjustedAge] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload: {
                replacement_date?: string;
                notes?: string;
                event_type?: 'full_replacement' | 'age_adjustment';
                adjusted_age?: number;
            } = {
                replacement_date: replacementDate,
                notes: notes.trim() || undefined,
                event_type: eventType,
            }

            if (eventType === 'age_adjustment') {
                const ageVal = parseFloat(adjustedAge)
                if (isNaN(ageVal) || ageVal < 0) {
                    throw new Error('Please enter a valid adjusted age')
                }
                payload.adjusted_age = ageVal
            }

            const data = await systemsAPI.resetSystemAge(propertyId, system.system_id, payload)
            onSuccess(data.new_alert_count)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to log replacement")
        } finally {
            setIsSubmitting(false)
        }
    }

    const canSubmit = eventType === 'full_replacement'
        ? !!replacementDate
        : !!replacementDate && adjustedAge.trim() !== '' && !isNaN(parseFloat(adjustedAge))

    const formattedSystemType = system.system_type
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E8730A] to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-100">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38]">Log Replacement</h2>
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
                <div className="p-6 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Replacement Date */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Replacement Date
                        </label>
                        <input
                            type="date"
                            value={replacementDate}
                            onChange={(e) => setReplacementDate(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5">Defaults to today. Change if the replacement happened on a different date.</p>
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Event Type
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setEventType('full_replacement')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    eventType === 'full_replacement'
                                        ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Wrench className="w-4 h-4" />
                                Full Replacement
                            </button>
                            <button
                                type="button"
                                onClick={() => setEventType('age_adjustment')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    eventType === 'age_adjustment'
                                        ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Age Adjustment
                            </button>
                        </div>
                    </div>

                    {/* Adjusted Age - only for age_adjustment */}
                    {eventType === 'age_adjustment' && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                                Adjusted Age (years) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={adjustedAge}
                                onChange={(e) => setAdjustedAge(e.target.value)}
                                placeholder="e.g. 3.5"
                                min={0}
                                step={0.1}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                Set the new age for this system. Use 0 for brand new.
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Replaced after leak..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-11 text-sm font-semibold"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 rounded-xl h-11 text-sm font-semibold"
                        disabled={isSubmitting || !canSubmit}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            eventType === 'full_replacement' ? 'Confirm Replacement' : 'Confirm Adjustment'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
