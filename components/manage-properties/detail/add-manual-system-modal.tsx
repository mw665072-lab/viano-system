"use client"

import { useState } from "react"
import { X, Plus, Loader2, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI } from "@/lib/api"

const VALID_SYSTEM_TYPES = [
    { value: 'hvac', label: 'HVAC' },
    { value: 'water_heater', label: 'Water Heater' },
    { value: 'roof_shingle', label: 'Roof - Shingle' },
    { value: 'roof_tile', label: 'Roof - Tile' },
    { value: 'roof_metal', label: 'Roof - Metal' },
    { value: 'pool_equipment', label: 'Pool Equipment' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'appliances', label: 'Appliances' },
] as const

interface AddManualSystemModalProps {
    propertyId: string
    onClose: () => void
    onSuccess: () => void
}

type AgeMode = 'mfg_year' | 'age' | 'none'

export function AddManualSystemModal({ propertyId, onClose, onSuccess }: AddManualSystemModalProps) {
    const [systemType, setSystemType] = useState<string>('')
    const [name, setName] = useState<string>("")
    const [brand, setBrand] = useState<string>("")
    const [ageMode, setAgeMode] = useState<AgeMode>('mfg_year')
    const [mfgYear, setMfgYear] = useState<string>("")
    const [age, setAge] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            if (!systemType) {
                throw new Error('Please select a system type')
            }

            const payload: {
                system_type: string;
                name?: string;
                brand?: string;
                mfg_year?: number | null;
                age?: number | null;
            } = {
                system_type: systemType,
            }

            if (name.trim()) payload.name = name.trim()
            if (brand.trim()) payload.brand = brand.trim()

            if (ageMode === 'mfg_year') {
                const year = parseInt(mfgYear, 10)
                if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                    throw new Error('Please enter a valid manufacturing year')
                }
                payload.mfg_year = year
                payload.age = null
            } else if (ageMode === 'age') {
                const ageVal = parseFloat(age)
                if (isNaN(ageVal) || ageVal < 0) {
                    throw new Error('Please enter a valid age')
                }
                payload.age = ageVal
                payload.mfg_year = null
            } else {
                payload.mfg_year = null
                payload.age = null
            }

            await systemsAPI.addManualSystem(propertyId, payload)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add system")
        } finally {
            setIsSubmitting(false)
        }
    }

    const canSubmit = systemType !== '' && (
        ageMode === 'none' ||
        (ageMode === 'mfg_year' && mfgYear.trim() !== '' && !isNaN(parseInt(mfgYear, 10))) ||
        (ageMode === 'age' && age.trim() !== '' && !isNaN(parseFloat(age)))
    )

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-100">
                            <Plus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38]">Add Manual System</h2>
                            <p className="text-xs text-[#64748B] font-medium">
                                Add a system manually to this property
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

                    {/* System Type */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            System Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={systemType}
                            onChange={(e) => setSystemType(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="">Select a system type...</option>
                            {VALID_SYSTEM_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Name <span className="text-gray-400 font-normal normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Unit 2"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Brand <span className="text-gray-400 font-normal normal-case">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g. Trane"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Age Mode Selector */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                            Age Information <span className="text-gray-400 font-normal normal-case">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setAgeMode('mfg_year')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                    ageMode === 'mfg_year'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                MFG Year
                            </button>
                            <button
                                type="button"
                                onClick={() => setAgeMode('age')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                    ageMode === 'age'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Direct Age
                            </button>
                            <button
                                type="button"
                                onClick={() => setAgeMode('none')}
                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                    ageMode === 'none'
                                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Unknown
                            </button>
                        </div>
                    </div>

                    {/* MFG Year input */}
                    {ageMode === 'mfg_year' && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                                Manufacturing Year
                            </label>
                            <input
                                type="number"
                                value={mfgYear}
                                onChange={(e) => setMfgYear(e.target.value)}
                                placeholder="e.g. 2020"
                                min={1900}
                                max={new Date().getFullYear()}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    )}

                    {/* Age input */}
                    {ageMode === 'age' && (
                        <div>
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                                Current Age (years)
                            </label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="e.g. 5.5"
                                min={0}
                                step={0.1}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
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
                                Adding...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add System
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
