"use client"

import { useState, useEffect } from "react"
import { Pencil, Download, Trash2, Wrench, TrendingUp, Plus, Settings, Droplets, Wind, Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processAPI, documentAPI, MessageResponse, systemsAPI, SystemResponse, propertyAPI, CMAResponse } from "@/lib/api"
import { ResetModal } from "./reset-modal"
import { HistoryModal } from "./history-modal"
import { SetAgeModal } from "./set-age-modal"
import { AddManualSystemModal } from "./add-manual-system-modal"
import { AddDefaultSystemsModal } from "./add-default-systems-modal"

interface PropertyDetailData {
    id: string
    name: string
    address: string
    location: string
    type: string
    client: string
    closingDays: number
    status: string
    documentsSubmitted: number
    documentsTotal: number
    aiAnalysisProgress: number
    totalIssues: number
    criticalIssues: number
    statusMessage?: string
    processId?: string
    createdAt?: string
    city?: string
    state?: string
    zipCode?: string
    isDraft?: boolean
}

interface PropertyDetailPanelProps {
    property: PropertyDetailData
    onClose: () => void
    onEdit?: () => void
    onDownload?: () => void
    onDelete?: () => void
    onContinueSetup?: () => void
    onShowToast?: (message: string, type: 'success' | 'error') => void
}

function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return '??'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getSystemIcon(type: string) {
    const t = type.toLowerCase()
    if (t.includes('water')) return <Droplets className="w-4 h-4 text-emerald-500" />
    if (t.includes('hvac') || t.includes('air')) return <Wind className="w-4 h-4 text-blue-400" />
    if (t.includes('roof')) return <Home className="w-4 h-4 text-purple-400" />
    return <Wrench className="w-4 h-4 text-gray-400" />
}

/** Get status label and color based on percentage used */
function getSystemStatus(percentageUsed: number | null): { label: string; bgColor: string; textColor: string; borderColor: string } {
    const pct = percentageUsed ?? 0
    if (pct < 50) {
        return { label: 'Good', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' }
    } else if (pct < 75) {
        return { label: 'Fair', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' }
    } else if (pct < 90) {
        return { label: 'Warning', bgColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-200' }
    } else {
        return { label: 'Critical', bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' }
    }
}

/** Get progress bar color based on percentage used */
function getProgressBarColor(percentageUsed: number | null): string {
    const pct = percentageUsed ?? 0
    if (pct < 50) return 'bg-emerald-500'
    if (pct < 75) return 'bg-amber-400'
    if (pct < 90) return 'bg-orange-500'
    return 'bg-red-500'
}

export function PropertyDetailPanel({
    property,
    onClose,
    onEdit,
    onDownload,
    onDelete,
    onContinueSetup,
    onShowToast,
}: PropertyDetailPanelProps) {
    const [messages, setMessages] = useState<MessageResponse[]>([])
    const [messageCount, setMessageCount] = useState<number>(property.totalIssues)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)

    const [documentCount, setDocumentCount] = useState<number>(property.documentsSubmitted)
    const [isLoadingDocs, setIsLoadingDocs] = useState(true)

    const [systems, setSystems] = useState<SystemResponse[]>([])
    const [isLoadingSystems, setIsLoadingSystems] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [showSetAgeModal, setShowSetAgeModal] = useState(false)
    const [showAddManualModal, setShowAddManualModal] = useState(false)
    const [showAddDefaultsModal, setShowAddDefaultsModal] = useState(false)
    const [selectedSystem, setSelectedSystem] = useState<SystemResponse | null>(null)

    const [cmaData, setCmaData] = useState<CMAResponse | null>(null)
    const [isLoadingCMA, setIsLoadingCMA] = useState(false)
    const [cmaError, setCmaError] = useState<string | null>(null)

    const getEffectivePriority = (m: MessageResponse): number => {
        const alertPriority = m.realtor_alert?.priority;
        if (alertPriority && typeof alertPriority === 'string') {
            const p = alertPriority.toLowerCase();
            if (p === 'critical') return 1;
            if (p === 'high') return 2;
            if (p === 'medium') return 3;
            if (p === 'low') return 4;
        }
        if (m.priority_level != null) return m.priority_level;
        return 4;
    }

    useEffect(() => {
        const fetchMessages = async () => {
            if (!property.processId) {
                setMessageCount(property.totalIssues)
                setMessages([])
                return
            }

            setIsLoadingMessages(true)
            try {
                const fetchedMessages = await processAPI.getMessages(property.processId)
                setMessages(fetchedMessages)
                setMessageCount(fetchedMessages.length)
            } catch (err) {
                console.error('Error fetching messages:', err)
                setMessageCount(property.totalIssues)
                setMessages([])
            } finally {
                setIsLoadingMessages(false)
            }
        }

        fetchMessages()
    }, [property.processId, property.totalIssues])

    useEffect(() => {
        const fetchDocumentCount = async () => {
            setIsLoadingDocs(true)
            try {
                const docs = await documentAPI.getPropertyDocuments(property.id)
                if (Array.isArray(docs)) {
                    setDocumentCount(docs.length)
                } else {
                    setDocumentCount(0)
                }
            } catch (err) {
                console.error('Error fetching document count:', err)
                setDocumentCount(0)
            } finally {
                setIsLoadingDocs(false)
            }
        }

        fetchDocumentCount()
    }, [property.id, property.processId])

    useEffect(() => {
        const fetchSystems = async () => {
            if (!property.id || property.isDraft) {
                setSystems([])
                return
            }

            setIsLoadingSystems(true)
            try {
                const data = await systemsAPI.getSystems(property.id)
                setSystems(data)
            } catch (err) {
                console.error('Error fetching systems:', err)
                setSystems([])
            } finally {
                setIsLoadingSystems(false)
            }
        }

        fetchSystems()
    }, [property.id, property.isDraft])

    useEffect(() => {
        const fetchCMA = async () => {
            if (!property.id || property.isDraft) {
                setCmaData(null)
                setCmaError(null)
                return
            }

            setIsLoadingCMA(true)
            setCmaError(null)
            try {
                const data = await propertyAPI.getCMA(property.id)
                setCmaData(data)
            } catch (err) {
                console.error('Error fetching CMA:', err)
                const message = err instanceof Error ? err.message : 'Failed to load CMA estimate'
                if (message.includes('503') || message.toLowerCase().includes('rentcast') || message.toLowerCase().includes('unavailable')) {
                    setCmaError('CMA service temporarily unavailable')
                } else {
                    setCmaData(null)
                }
            } finally {
                setIsLoadingCMA(false)
            }
        }

        fetchCMA()
    }, [property.id, property.isDraft])

    const refreshSystems = async () => {
        if (property.id && !property.isDraft) {
            setIsLoadingSystems(true)
            try {
                const data = await systemsAPI.getSystems(property.id)
                setSystems(data)
            } catch (err) {
                console.error('Error refreshing systems:', err)
            } finally {
                setIsLoadingSystems(false)
            }
        }
    }

    const handleOpenResetModal = (system: SystemResponse) => {
        setSelectedSystem(system)
        setShowResetModal(true)
    }

    const handleOpenHistoryModal = (system: SystemResponse) => {
        setSelectedSystem(system)
        setShowHistoryModal(true)
    }

    const handleOpenSetAgeModal = (system: SystemResponse) => {
        setSelectedSystem(system)
        setShowSetAgeModal(true)
    }

    const handleResetSuccess = (alertCount: number) => {
        setShowResetModal(false)
        if (onShowToast) {
            onShowToast(`${alertCount} alert${alertCount !== 1 ? 's' : ''} rescheduled`, 'success')
        }
        refreshSystems()
    }

    const handleSetAgeSuccess = (alertCount: number) => {
        setShowSetAgeModal(false)
        if (onShowToast) {
            onShowToast(`Age set — ${alertCount} alert${alertCount !== 1 ? 's' : ''} generated`, 'success')
        }
        refreshSystems()
    }

    const handleUndoSuccess = (deletedAlertCount: number) => {
        if (onShowToast) {
            onShowToast(`Undo successful — ${deletedAlertCount} alert${deletedAlertCount !== 1 ? 's' : ''} removed`, 'success')
        }
        refreshSystems()
    }

    const handleAddManualSuccess = () => {
        setShowAddManualModal(false)
        if (onShowToast) {
            onShowToast('System added successfully', 'success')
        }
        refreshSystems()
    }

    const handleAddDefaultsSuccess = (createdCount: number) => {
        setShowAddDefaultsModal(false)
        if (onShowToast) {
            onShowToast(`${createdCount} system${createdCount !== 1 ? 's' : ''} added successfully`, 'success')
        }
        refreshSystems()
    }

    const formatSystemType = (type: string) => {
        return type
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    }

    const tierBreakdown = {
        high: messages.filter(m => getEffectivePriority(m) === 1 || getEffectivePriority(m) === 2).length,
        medium: messages.filter(m => getEffectivePriority(m) === 3).length,
        low: messages.filter(m => getEffectivePriority(m) === 4).length,
    }

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Main Property Card */}
                <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
                    {/* Header Section */}
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {/* Back Button */}
                                <button
                                    onClick={onClose}
                                    className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                {/* Avatar */}
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center text-base sm:text-lg font-bold text-gray-500 flex-shrink-0">
                                    {getInitials(property.client)}
                                </div>
                                {/* Name & Address */}
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{property.client}</h2>
                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{property.address}</p>
                                    <p className="text-xs sm:text-sm text-gray-400 truncate">{property.location}</p>
                                </div>
                            </div>
                            {/* Home Value */}
                            <div className="border border-gray-200 rounded-xl p-4 sm:p-5 pl-11 sm:pl-4 flex-1 sm:flex-none sm:min-w-[220px] self-stretch sm:self-auto flex flex-col justify-center">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Home Value</p>
                                        {isLoadingCMA ? (
                                            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mt-1" />
                                        ) : cmaData ? (
                                            <>
                                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{cmaData.formatted}</p>
                                                <p className="text-xs text-gray-400">Estimated Range: ${cmaData.low.toLocaleString()} - ${cmaData.high.toLocaleString()}</p>
                                            </>
                                        ) : (
                                            <p className="text-lg sm:text-xl font-bold text-gray-400">N/A</p>
                                        )}
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
                        {property.isDraft ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onContinueSetup}
                                className="flex items-center gap-2 rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50 h-9 text-xs font-semibold px-4"
                            >
                                <Pencil className="w-4 h-4" />
                                Continue Setup
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onEdit}
                                    className="flex items-center gap-2 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 h-9 text-xs font-semibold px-4"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDownload}
                                    className="flex items-center gap-2 rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 h-9 text-xs font-semibold px-4 whitespace-nowrap"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Report
                                </Button>
                            </>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDelete}
                            className="flex items-center gap-2 rounded-lg border-red-100 text-red-600 hover:bg-red-50 h-9 text-xs font-semibold px-4"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100" />

                    {/* Property Info Grid */}
                    <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Viano Activated</p>
                            <p className="text-sm font-semibold text-gray-900">{property.createdAt || 'N/A'}</p>
                        </div>
                        <div className="border-l border-gray-100 pl-4">
                            <p className="text-xs text-gray-500 mb-1">Property Type</p>
                            <p className="text-sm font-semibold text-gray-900">Single Family</p>
                        </div>
                        <div className="border-l border-gray-100 pl-4">
                            <p className="text-xs text-gray-500 mb-1">Year Built</p>
                            <p className="text-sm font-semibold text-gray-900">2001</p>
                        </div>
                    </div>

                    {/* Systems Section */}
                    {!property.isDraft && (
                        <>
                            {/* Divider */}
                            <div className="border-t border-gray-100" />

                            <div className="px-4 sm:px-6 py-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">System Age & Lifespan</h3>
                                    <span className="text-xs text-gray-400">{systems.length} Systems</span>
                                </div>

                                {isLoadingSystems ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : systems.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-gray-500 mb-3">No systems data available.</p>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => setShowAddDefaultsModal(true)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200"
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                                Add Defaults
                                            </button>
                                            <button
                                                onClick={() => setShowAddManualModal(true)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Add Manual
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                {systems.map((system) => {
                                    const isAgeUnknown = system.age_unknown
                                    const progressPercent = system.percentage_used != null
                                        ? Math.min(100, Math.max(0, system.percentage_used))
                                        : 0
                                    const status = getSystemStatus(system.percentage_used)
                                    const barColor = getProgressBarColor(system.percentage_used)

                                    return (
                                        <div
                                            key={system.system_id}
                                            className="bg-white rounded-xl px-4 py-3"
                                        >
                                            {/* Desktop: single row */}
                                            <div className="hidden sm:flex items-center gap-3">
                                                {/* Icon */}
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                    {getSystemIcon(system.system_type)}
                                                </div>

                                                {/* System Name */}
                                                <div className="flex-shrink-0 w-32">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                        {formatSystemType(system.system_type)}
                                                    </h4>
                                                    {system.brand && (
                                                        <p className="text-xs text-gray-500 truncate">{system.brand}</p>
                                                    )}
                                                </div>

                                                {/* Dynamic Status Badge */}
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor} flex-shrink-0`}>
                                                    {status.label}
                                                </span>

                                                {/* Progress / Age Unknown */}
                                                <div className="flex-1 flex items-center gap-3 min-w-0">
                                                    {!isAgeUnknown ? (
                                                        <>
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                    style={{ width: `${progressPercent}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {system.current_age != null ? system.current_age.toFixed(1) : '?'} yrs / {system.lifespan_max} yrs
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-amber-600">
                                                            Age unknown — <button onClick={() => handleOpenSetAgeModal(system)} className="underline">Set Age</button>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {system.replacement_history && system.replacement_history.length > 0 && (
                                                        <button
                                                            onClick={() => handleOpenHistoryModal(system)}
                                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                                                        >
                                                            History
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenResetModal(system)}
                                                        className="text-xs font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                                    >
                                                        Reset System
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile: stacked rows */}
                                            <div className="flex sm:hidden flex-col gap-2">
                                                {/* Row 1: Icon, Name, Badge */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                        {getSystemIcon(system.system_type)}
                                                    </div>
                                                    <div className="flex-shrink-0 w-28">
                                                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                            {formatSystemType(system.system_type)}
                                                        </h4>
                                                        {system.brand && (
                                                            <p className="text-xs text-gray-500 truncate">{system.brand}</p>
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor} flex-shrink-0`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Row 2: Progress / Age Unknown */}
                                                <div className="flex items-center gap-3 pl-11">
                                                    {!isAgeUnknown ? (
                                                        <>
                                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                    style={{ width: `${progressPercent}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 whitespace-nowrap">
                                                                {system.current_age != null ? system.current_age.toFixed(1) : '?'} yrs / {system.lifespan_max} yrs
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-amber-600">
                                                            Age unknown — <button onClick={() => handleOpenSetAgeModal(system)} className="underline">Set Age</button>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row 3: Action Buttons */}
                                                <div className="flex items-center gap-2 pl-11">
                                                    {system.replacement_history && system.replacement_history.length > 0 && (
                                                        <button
                                                            onClick={() => handleOpenHistoryModal(system)}
                                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                                                        >
                                                            History
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenResetModal(system)}
                                                        className="text-xs font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                                    >
                                                        Reset System
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* Property Insights */}
                <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">Property Insights</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <p className="text-2xl font-bold text-purple-600">{isLoadingMessages ? "..." : messageCount}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">Total<br/>Touchpoints</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                            <p className="text-2xl font-bold text-orange-500">{tierBreakdown.high}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">High Priority<br/>Issues</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <p className="text-2xl font-bold text-amber-500">{tierBreakdown.medium}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">Medium Priority<br/>Issues</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-2xl font-bold text-blue-500">{tierBreakdown.low}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">Low Priority<br/>Issues</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showResetModal && selectedSystem && property.id && (
                <ResetModal
                    propertyId={property.id}
                    system={selectedSystem}
                    onClose={() => setShowResetModal(false)}
                    onSuccess={handleResetSuccess}
                />
            )}

            {showSetAgeModal && selectedSystem && property.id && (
                <SetAgeModal
                    propertyId={property.id}
                    system={selectedSystem}
                    onClose={() => setShowSetAgeModal(false)}
                    onSuccess={handleSetAgeSuccess}
                />
            )}

            {showAddManualModal && property.id && (
                <AddManualSystemModal
                    propertyId={property.id}
                    onClose={() => setShowAddManualModal(false)}
                    onSuccess={handleAddManualSuccess}
                />
            )}

            {showAddDefaultsModal && property.id && (
                <AddDefaultSystemsModal
                    propertyId={property.id}
                    onClose={() => setShowAddDefaultsModal(false)}
                    onSuccess={handleAddDefaultsSuccess}
                />
            )}

            {showHistoryModal && selectedSystem && property.id && (
                <HistoryModal
                    propertyId={property.id}
                    system={selectedSystem}
                    onClose={() => setShowHistoryModal(false)}
                    onUndoSuccess={handleUndoSuccess}
                />
            )}
        </div>
    );
}
