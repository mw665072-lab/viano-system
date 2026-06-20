"use client"

import { useState } from "react"
import { X, Plus, Trash2, Loader2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { systemsAPI } from "@/lib/api"

const ROOF_TYPES = [
    { value: 'shingle', label: 'Shingle' },
    { value: 'tile', label: 'Tile' },
    { value: 'metal', label: 'Metal' },
] as const

interface HVACUnit {
    id: string
    name: string
    mfg_year: string
    brand: string
}

interface AddDefaultSystemsModalProps {
    propertyId: string
    onClose: () => void
    onSuccess: (createdCount: number) => void
}

type WaterHeaterAgeMode = 'mfg_year' | 'age' | 'none'
type RoofAgeMode = 'mfg_year' | 'age' | 'none'

export function AddDefaultSystemsModal({ propertyId, onClose, onSuccess }: AddDefaultSystemsModalProps) {
    // Water Heater state
    const [whMfgYear, setWhMfgYear] = useState<string>("")
    const [whAge, setWhAge] = useState<string>("")
    const [whBrand, setWhBrand] = useState<string>("")
    const [whAgeMode, setWhAgeMode] = useState<WaterHeaterAgeMode>('mfg_year')

    // HVAC state
    const [hvacUnits, setHvacUnits] = useState<HVACUnit[]>([
        { id: '1', name: 'Unit 1', mfg_year: '', brand: '' }
    ])

    // Roof state
    const [roofType, setRoofType] = useState<string>('shingle')
    const [roofMfgYear, setRoofMfgYear] = useState<string>("")
    const [roofAge, setRoofAge] = useState<string>("")
    const [roofAgeMode, setRoofAgeMode] = useState<RoofAgeMode>('mfg_year')

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addHvacUnit = () => {
        setHvacUnits(prev => [
            ...prev,
            { id: String(Date.now()), name: `Unit ${prev.length + 1}`, mfg_year: '', brand: '' }
        ])
    }

    const removeHvacUnit = (id: string) => {
        setHvacUnits(prev => prev.filter(u => u.id !== id))
    }

    const updateHvacUnit = (id: string, field: keyof HVACUnit, value: string) => {
        setHvacUnits(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u))
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload: {
                water_heater_mfg_year?: number;
                water_heater_age?: number | null;
                water_heater_brand?: string;
                hvac_units?: Array<{ name: string; mfg_year: number; brand: string }>;
                roof_type: 'shingle' | 'tile' | 'metal';
                roof_mfg_year?: number;
                roof_age?: number | null;
            } = {
                roof_type: roofType as 'shingle' | 'tile' | 'metal',
            }

            // Water heater
            if (whAgeMode === 'mfg_year' && whMfgYear.trim()) {
                const year = parseInt(whMfgYear, 10)
                if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
                    payload.water_heater_mfg_year = year
                }
            } else if (whAgeMode === 'age' && whAge.trim()) {
                const ageVal = parseFloat(whAge)
                if (!isNaN(ageVal) && ageVal >= 0) {
                    payload.water_heater_age = ageVal
                }
            }
            if (whBrand.trim()) {
                payload.water_heater_brand = whBrand.trim()
            }

            // HVAC units
            const validHvacUnits = hvacUnits
                .filter(u => u.name.trim() && u.mfg_year.trim())
                .map(u => ({
                    name: u.name.trim(),
                    mfg_year: parseInt(u.mfg_year, 10),
                    brand: u.brand.trim() || undefined,
                }))
                .filter(u => !isNaN(u.mfg_year) && u.mfg_year >= 1900 && u.mfg_year <= new Date().getFullYear())

            if (validHvacUnits.length > 0) {
                payload.hvac_units = validHvacUnits as Array<{ name: string; mfg_year: number; brand: string }>
            }

            // Roof
            if (roofAgeMode === 'mfg_year' && roofMfgYear.trim()) {
                const year = parseInt(roofMfgYear, 10)
                if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear()) {
                    payload.roof_mfg_year = year
                }
            } else if (roofAgeMode === 'age' && roofAge.trim()) {
                const ageVal = parseFloat(roofAge)
                if (!isNaN(ageVal) && ageVal >= 0) {
                    payload.roof_age = ageVal
                }
            }

            const data = await systemsAPI.addDefaultSystems(propertyId, payload)
            onSuccess(data.created.length)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add default systems")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#E8730A] to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-100">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#0C1D38]">Add Default Systems</h2>
                            <p className="text-xs text-[#64748B] font-medium">
                                Water Heater, A/C, and Roof
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
                <div className="p-6 space-y-8">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Water Heater Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-orange-600">WH</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#0C1D38]">Water Heater</h3>
                        </div>

                        <div className="pl-10 space-y-3">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWhAgeMode('mfg_year')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        whAgeMode === 'mfg_year'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    MFG Year
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWhAgeMode('age')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        whAgeMode === 'age'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    Age
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWhAgeMode('none')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        whAgeMode === 'none'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    Unknown
                                </button>
                            </div>

                            {whAgeMode === 'mfg_year' && (
                                <input
                                    type="number"
                                    value={whMfgYear}
                                    onChange={(e) => setWhMfgYear(e.target.value)}
                                    placeholder="MFG Year e.g. 2020"
                                    min={1900}
                                    max={new Date().getFullYear()}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                />
                            )}
                            {whAgeMode === 'age' && (
                                <input
                                    type="number"
                                    value={whAge}
                                    onChange={(e) => setWhAge(e.target.value)}
                                    placeholder="Age in years e.g. 5"
                                    min={0}
                                    step={0.1}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                />
                            )}

                            <input
                                type="text"
                                value={whBrand}
                                onChange={(e) => setWhBrand(e.target.value)}
                                placeholder="Brand (optional) e.g. Rheem"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                            />
                        </div>
                    </div>

                    {/* HVAC Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-sky-600">AC</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#0C1D38]">HVAC Units</h3>
                        </div>

                        <div className="pl-10 space-y-3">
                            {hvacUnits.map((unit, index) => (
                                <div key={unit.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-[#64748B]">Unit {index + 1}</span>
                                        {hvacUnits.length > 1 && (
                                            <button
                                                onClick={() => removeHvacUnit(unit.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={unit.name}
                                        onChange={(e) => updateHvacUnit(unit.id, 'name', e.target.value)}
                                        placeholder="Name e.g. Unit 1"
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={unit.mfg_year}
                                            onChange={(e) => updateHvacUnit(unit.id, 'mfg_year', e.target.value)}
                                            placeholder="MFG Year"
                                            min={1900}
                                            max={new Date().getFullYear()}
                                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                        />
                                        <input
                                            type="text"
                                            value={unit.brand}
                                            onChange={(e) => updateHvacUnit(unit.id, 'brand', e.target.value)}
                                            placeholder="Brand"
                                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addHvacUnit}
                                className="flex items-center gap-2 text-xs font-semibold text-[#E8730A] hover:text-orange-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Another HVAC Unit
                            </button>
                        </div>
                    </div>

                    {/* Roof Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-stone-600">RF</span>
                            </div>
                            <h3 className="text-sm font-bold text-[#0C1D38]">Roof</h3>
                        </div>

                        <div className="pl-10 space-y-3">
                            <select
                                value={roofType}
                                onChange={(e) => setRoofType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all appearance-none"
                            >
                                {ROOF_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRoofAgeMode('mfg_year')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        roofAgeMode === 'mfg_year'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    MFG Year
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRoofAgeMode('age')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        roofAgeMode === 'age'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    Age
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRoofAgeMode('none')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                                        roofAgeMode === 'none'
                                            ? 'bg-[#E8730A]/10 border-[#E8730A]/40 text-[#E8730A]'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    Unknown
                                </button>
                            </div>

                            {roofAgeMode === 'mfg_year' && (
                                <input
                                    type="number"
                                    value={roofMfgYear}
                                    onChange={(e) => setRoofMfgYear(e.target.value)}
                                    placeholder="MFG Year e.g. 2015"
                                    min={1900}
                                    max={new Date().getFullYear()}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                />
                            )}
                            {roofAgeMode === 'age' && (
                                <input
                                    type="number"
                                    value={roofAge}
                                    onChange={(e) => setRoofAge(e.target.value)}
                                    placeholder="Age in years e.g. 10"
                                    min={0}
                                    step={0.1}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C1D38] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8730A]/20 focus:border-[#E8730A] transition-all"
                                />
                            )}
                        </div>
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
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Adding...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Add Systems
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
