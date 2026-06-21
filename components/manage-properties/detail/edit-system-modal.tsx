"use client"

import { useState } from "react"
import { X, Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI, SystemResponse, EditSystemRequest } from "@/lib/api"

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

interface EditSystemModalProps {
    propertyId: string
    system: SystemResponse
    onClose: () => void
    onSuccess: () => void
}

/** Base type for the dropdown — collapses water_heater_tankless into water_heater. */
function baseType(systemType: string): string {
    return systemType === 'water_heater_tankless' ? 'water_heater' : systemType
}

export function EditSystemModal({ propertyId, system, onClose, onSuccess }: EditSystemModalProps) {
    const initialType = baseType(system.system_type)
    const initialName = system.name ?? ''
    const initialBrand = system.brand ?? ''
    const initialTankless = system.system_type === 'water_heater_tankless'

    const [systemType, setSystemType] = useState<string>(initialType)
    const [name, setName] = useState<string>(initialName)
    const [brand, setBrand] = useState<string>(initialBrand)
    const [isTankless, setIsTankless] = useState<boolean>(initialTankless)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isWaterHeater = systemType === 'water_heater'

    // Only consider tankless changes meaningful for water heaters
    const tanklessChanged = isWaterHeater && isTankless !== initialTankless
    const typeChanged = systemType !== initialType
    const nameChanged = name.trim() !== initialName.trim()
    const brandChanged = brand.trim() !== initialBrand.trim()
    const hasChanges = typeChanged || nameChanged || brandChanged || tanklessChanged

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload: EditSystemRequest = {}
            if (typeChanged) payload.system_type = systemType
            if (nameChanged) payload.name = name.trim()
            if (brandChanged) payload.brand = brand.trim()
            if (tanklessChanged) payload.is_tankless = isTankless

            await systemsAPI.editSystem(propertyId, system.system_id, payload)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update system")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#1a1a1a] border border-transparent dark:border-white/10 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1a1a1a] rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E8730A] to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-100">
                            <Pencil className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38] dark:text-white">Edit System</h2>
                            <p className="text-xs text-[#64748B] dark:text-gray-400 font-medium">
                                Update this system&apos;s details
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {/* System Type */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider mb-2">
                            System Type
                        </label>
                        <select
                            value={systemType}
                            onChange={(e) => setSystemType(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#0C1D38] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all appearance-none"
                        >
                            {VALID_SYSTEM_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tankless toggle (water heaters only) */}
                    {isWaterHeater && (
                        <label className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer">
                            <div>
                                <span className="block text-sm font-semibold text-[#0C1D38] dark:text-white">Tankless</span>
                                <span className="block text-xs text-[#64748B] dark:text-gray-400">Changes expected lifespan (8 → 20 yrs)</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={isTankless}
                                onChange={(e) => setIsTankless(e.target.checked)}
                                className="w-5 h-5 accent-[#E8730A]"
                            />
                        </label>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider mb-2">
                            Name <span className="text-gray-400 dark:text-gray-400 font-normal normal-case">(leave blank to clear)</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Unit 1"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#0C1D38] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                        />
                    </div>

                    {/* Brand */}
                    <div>
                        <label className="block text-[10px] font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider mb-2">
                            Brand <span className="text-gray-400 dark:text-gray-400 font-normal normal-case">(leave blank to clear)</span>
                        </label>
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="e.g. Rheem"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-[#0C1D38] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                        />
                    </div>

                    <p className="text-xs text-[#94A3B8] dark:text-gray-400">
                        To change the system&apos;s age, use Reset System instead.
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 flex gap-3 sticky bottom-0 bg-white dark:bg-[#1a1a1a] rounded-b-2xl">
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
                        disabled={isSubmitting || !hasChanges}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Pencil className="w-4 h-4" />
                                Save Changes
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
