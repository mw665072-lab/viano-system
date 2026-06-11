"use client"

import { useState } from "react"
import { X, Calendar, Hash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI, SystemResponse } from "@/lib/api"

interface SetAgeModalProps {
    propertyId: string
    system: SystemResponse
    onClose: () => void
    onSuccess: (alertCount: number) => void
}

type AgeMode = 'mfg_year' | 'age'

export function SetAgeModal({ propertyId, system, onClose, onSuccess }: SetAgeModalProps) {
    const [mode, setMode] = useState<AgeMode>('mfg_year')
    const [mfgYear, setMfgYear] = useState<string>("")
    const [age, setAge] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload = mode === 'mfg_year'
                ? { mfg_year: parseInt(mfgYear, 10) }
                : { age: parseFloat(age) }

            if (mode === 'mfg_year' && (isNaN(parseInt(mfgYear, 10)) || parseInt(mfgYear, 10) < 1900 || parseInt(mfgYear, 10) > new Date().getFullYear())) {
                throw new Error('Please enter a valid manufacturing year')
            }

            if (mode === 'age' && (isNaN(parseFloat(age)) || parseFloat(age) < 0)) {
                throw new Error('Please enter a valid age')
            }

            const data = await systemsAPI.updateSystemAge(propertyId, system.system_id, payload)
            onSuccess(data.new_alert_count)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update system age")
        } finally {
            setIsSubmitting(false)
        }
    }

    const formattedSystemType = system.system_type
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')

    const canSubmit = mode === 'mfg_year'
        ? mfgYear.trim() !== '' && !isNaN(parseInt(mfgYear, 10))
        : age.trim() !== '' && !isNaN(parseFloat(age))

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-100">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38]">Set System Age</h2>
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
                    {/* Info banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                        The age of this system is unknown. Set the manufacturing year or current age to enable lifespan tracking and alerts.
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Mode selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Input Method
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode('mfg_year')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    mode === 'mfg_year'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                MFG Year
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('age')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                                    mode === 'age'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <Hash className="w-4 h-4" />
                                Direct Age
                            </button>
                        </div>
                    </div>

                    {/* MFG Year input */}
                    {mode === 'mfg_year' && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                                Manufacturing Year
                            </label>
                            <input
                                type="number"
                                value={mfgYear}
                                onChange={(e) => setMfgYear(e.target.value)}
                                placeholder="e.g. 2018"
                                min={1900}
                                max={new Date().getFullYear()}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                The system age will be calculated from this year.
                            </p>
                        </div>
                    )}

                    {/* Age input */}
                    {mode === 'age' && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                                Current Age (years)
                            </label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="e.g. 8.5"
                                min={0}
                                step={0.1}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                Enter the current age in years. Decimals are allowed.
                            </p>
                        </div>
                    )}
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
                            'Set Age'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
