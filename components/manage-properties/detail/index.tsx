"use client"

import { useState, useEffect } from "react"
import { Pencil, Download, Trash2, Wrench, TrendingUp, Plus, Settings, Droplets, Wind, Home, ArrowLeft, Calendar, Hammer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { processAPI, documentAPI, MessageResponse, systemsAPI, SystemResponse, propertyAPI, CMAResponse } from "@/lib/api"
import { ResetModal } from "./reset-modal"
import { HistoryModal } from "./history-modal"
import { SetAgeModal } from "./set-age-modal"
import { AddManualSystemModal } from "./add-manual-system-modal"
import { AddDefaultSystemsModal } from "./add-default-systems-modal"
import { EditSystemModal } from "./edit-system-modal"
import { DeleteSystemModal } from "./delete-system-modal"
import { Skeleton } from "@/components/ui/skeleton"

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
    isTransferred?: boolean
    transferredAt?: string | null
}

interface PropertyDetailPanelProps {
    property: PropertyDetailData
    /** Stored CMA for this property from the batch endpoint; null when no valuation exists yet. */
    cma?: CMAResponse | null
    /** True while the parent's batch CMA fetch is still in flight (shows a skeleton). */
    cmaLoading?: boolean
    /** Called with the fresh valuation after a manual "Get latest value" refresh. */
    onCmaRefreshed?: (cma: CMAResponse) => void
    onClose: () => void
    onEdit?: () => void
    onDownload?: () => void
    onDelete?: () => void
    onContinueSetup?: () => void
    onShowToast?: (message: string, type: 'success' | 'error') => void
}

/** Format an ISO datetime as "Jun 23, 2026" for the "Valued {date}" freshness line. */
function formatValuedAt(iso: string | null | undefined): string | null {
    if (!iso) return null
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getInitials(name: string): string {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return '??'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getSystemIcon(type: string) {
    const t = type.toLowerCase()
    if (t.includes('water')) return <Droplets className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    if (t.includes('hvac') || t.includes('air')) return <Wind className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    if (t.includes('roof')) return <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
    return <Wrench className="w-5 h-5 text-gray-700 dark:text-gray-300" />
}

/** Format system age for display, e.g. "7 mo / 8 Yrs" or "6 / 10 Yrs" */
function formatAge(currentAge: number | null, lifespanMax: number | string | null): string {
    let agePart: string
    if (currentAge == null) agePart = '?'
    else if (currentAge < 1) agePart = `${Math.max(1, Math.round(currentAge * 12))} mo`
    else agePart = `${Math.round(currentAge)}`
    return `${agePart} / ${lifespanMax ?? '?'} Yrs`
}

/** Get status label and color based on percentage used */
function getSystemStatus(percentageUsed: number | null): { label: string; bgColor: string; textColor: string; borderColor: string } {
    const pct = percentageUsed ?? 0
    if (pct < 50) {
        return { label: 'Good', bgColor: 'bg-[#34C759]/15', textColor: 'text-[#006C1B] dark:text-[#34C759]', borderColor: 'border-transparent' }
    } else if (pct < 75) {
        return { label: 'Fair', bgColor: 'bg-amber-50 dark:bg-amber-500/15', textColor: 'text-amber-600 dark:text-amber-400', borderColor: 'border-amber-200' }
    } else if (pct < 90) {
        return { label: 'Warning', bgColor: 'bg-orange-50 dark:bg-orange-500/15', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-200' }
    } else {
        return { label: 'Critical', bgColor: 'bg-red-50 dark:bg-red-500/15', textColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200' }
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
    cma: cmaProp,
    cmaLoading = false,
    onCmaRefreshed,
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
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedSystem, setSelectedSystem] = useState<SystemResponse | null>(null)

    // CMA comes from the parent's batch fetch (cmaProp). A manual "Get latest value" refresh
    // stashes its result here so the card updates immediately; it's tagged with property_id so
    // it's ignored once a different property is selected (then we fall back to the batch value).
    const [refreshedCMA, setRefreshedCMA] = useState<CMAResponse | null>(null)
    const [isRefreshingCMA, setIsRefreshingCMA] = useState(false)
    const cma = refreshedCMA && refreshedCMA.property_id === property.id ? refreshedCMA : (cmaProp ?? null)

    const [inspectionDate, setInspectionDate] = useState<string | null>(null)

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

    // "Get latest value" — the only call that hits the external valuation API (slow + costs a
    // credit), so it's an explicit button, never automatic. Updates this card and the parent map.
    const handleRefreshCMA = async () => {
        if (!property.id || property.isDraft || isRefreshingCMA) return

        setIsRefreshingCMA(true)
        try {
            const fresh = await propertyAPI.refreshCMA(property.id)
            setRefreshedCMA(fresh)
            onCmaRefreshed?.(fresh)
            onShowToast?.('Home value updated', 'success')
        } catch (err) {
            console.error('Error refreshing CMA:', err)
            const message = err instanceof Error ? err.message : ''
            onShowToast?.(
                message.includes('503') ? 'Valuation service temporarily unavailable' : 'Could not refresh home value',
                'error',
            )
        } finally {
            setIsRefreshingCMA(false)
        }
    }

    useEffect(() => {
        const fetchProperty = async () => {
            if (!property.id) {
                setInspectionDate(null)
                return
            }

            try {
                const data = await propertyAPI.getProperty(property.id)
                setInspectionDate(data.inspection_date)
            } catch (err) {
                console.error('Error fetching property:', err)
                setInspectionDate(null)
            }
        }

        fetchProperty()
    }, [property.id])

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

    const handleOpenEditModal = (system: SystemResponse) => {
        setSelectedSystem(system)
        setShowEditModal(true)
    }

    const handleOpenDeleteModal = (system: SystemResponse) => {
        setSelectedSystem(system)
        setShowDeleteModal(true)
    }

    const handleEditSystemSuccess = () => {
        setShowEditModal(false)
        if (onShowToast) {
            onShowToast('System updated successfully', 'success')
        }
        refreshSystems()
    }

    const handleDeleteSystemSuccess = (deletedAlertCount: number) => {
        setShowDeleteModal(false)
        if (onShowToast) {
            onShowToast(`System deleted — ${deletedAlertCount} alert${deletedAlertCount !== 1 ? 's' : ''} removed`, 'success')
        }
        refreshSystems()
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

    // A transferred property is now another agent's plan — render it read-only (no mutations).
    const isReadOnly = !!property.isTransferred
    const transferredOnLabel = property.transferredAt
        ? (() => {
            const d = new Date(property.transferredAt)
            return isNaN(d.getTime()) ? property.transferredAt : d.toLocaleDateString()
        })()
        : null

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Main Property Card */}
                <div>
                    {/* Header Section */}
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-5">
                            {/* Left column: identity + actions */}
                            <div className="flex flex-col gap-5 min-w-0">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    {/* Back Button */}
                                    <button
                                        onClick={onClose}
                                        aria-label="Back"
                                        className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    {/* Avatar */}
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                                        {getInitials(property.client)}
                                    </div>
                                    {/* Name & Address */}
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{property.client}</h2>
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 truncate">{property.address}</p>
                                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 truncate">{property.location}</p>
                                        {isReadOnly && (
                                            <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-1">
                                                Transferred{transferredOnLabel ? ` on ${transferredOnLabel}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {property.isDraft ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onContinueSetup}
                                            className="flex items-center gap-2 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 h-10 text-xs font-semibold px-4"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Continue Setup
                                        </Button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={onDownload}
                                                aria-label="Download report"
                                                title="Download report"
                                                className="w-11 h-10 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                            {!isReadOnly && (
                                                <button
                                                    onClick={onEdit}
                                                    aria-label="Edit"
                                                    title="Edit"
                                                    className="w-11 h-10 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {!isReadOnly && (
                                        <button
                                            onClick={onDelete}
                                            aria-label="Delete"
                                            title="Delete"
                                            className="w-11 h-10 rounded-xl border border-red-100 dark:border-red-500/30 bg-white dark:bg-white/5 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Home Value */}
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-[#FCFCFC] dark:bg-white/5 p-5 w-full lg:w-[300px] lg:flex-shrink-0 flex flex-col justify-center">
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Current Home Value</p>
                                    <div className="w-9 h-9 rounded-xl border-[1.5px] border-[#E8730A] flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-[#E8730A]" />
                                    </div>
                                </div>
                                {cmaLoading && !cma ? (
                                    <>
                                        <Skeleton className="h-8 w-40 max-w-full mt-1" />
                                        <Skeleton className="h-4 w-48 max-w-full mt-2" />
                                    </>
                                ) : cma ? (
                                    <>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">${cma.price.toLocaleString()}</p>
                                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Estimated Range: ${cma.low.toLocaleString()} - ${cma.high.toLocaleString()}</p>
                                        {formatValuedAt(cma.valued_at) && (
                                            <p className="text-[11px] text-gray-400 mt-1">Valued {formatValuedAt(cma.valued_at)}</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-400 mt-1">N/A</p>
                                        <p className="text-xs text-gray-400 mt-1">Valuation pending — get the latest estimate below.</p>
                                    </>
                                )}
                                {!property.isDraft && !isReadOnly && (
                                    <button
                                        onClick={handleRefreshCMA}
                                        disabled={isRefreshingCMA}
                                        title="Fetches a fresh live valuation (uses an API credit)"
                                        className="mt-3 inline-flex items-center justify-center gap-2 h-9 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCMA ? 'animate-spin' : ''}`} />
                                        {isRefreshingCMA ? 'Getting latest…' : 'Get latest value'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-white/10" />

                    {/* Property Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 px-4 sm:px-6 py-4">
                        <div className="flex flex-col gap-3 sm:pr-6">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                                <p className="text-sm sm:text-base text-gray-900 dark:text-white">Viano Activated on</p>
                            </div>
                            <span className="rounded-full bg-[#E8730A]/15 border border-[#E8730A]/30 text-[#895000] text-sm sm:text-base font-medium text-center px-4 py-2.5">
                                {property.createdAt || 'N/A'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 sm:border-l sm:border-gray-100 dark:border-white/10 sm:px-6">
                            <div className="flex items-center gap-2">
                                <Home className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                                <p className="text-sm sm:text-base text-gray-900 dark:text-white">Property Type</p>
                            </div>
                            <span className="rounded-full bg-[#666666] text-white text-sm sm:text-base font-medium text-center px-4 py-2.5">
                                Single Family
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 sm:border-l sm:border-gray-100 dark:border-white/10 sm:pl-6">
                            <div className="flex items-center gap-2">
                                <Hammer className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0" />
                                <p className="text-sm sm:text-base text-gray-900 dark:text-white">Inspection Date</p>
                            </div>
                            <span className="rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm sm:text-base font-medium text-center px-4 py-2.5">
                                {inspectionDate ? new Date(inspectionDate).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Systems Section */}
                    {!property.isDraft && (
                        <>
                            {/* Divider */}
                            <div className="border-t border-gray-100 dark:border-white/10" />

                            <div className="px-4 sm:px-6 py-4">
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">System Age & Lifespan</h3>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!isReadOnly && (
                                            <button
                                                onClick={() => setShowAddManualModal(true)}
                                                className="flex items-center gap-1.5 text-sm font-medium text-[#E8730A] border border-[#E8730A]/30 hover:bg-[#E8730A]/5 rounded-lg px-3 py-1.5 whitespace-nowrap transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add System
                                            </button>
                                        )}
                                        <span className="text-sm text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 rounded-lg px-3 py-1.5 whitespace-nowrap">{systems.length} Systems Total</span>
                                    </div>
                                </div>

                                {isLoadingSystems ? (
                                    <div className="divide-y divide-gray-100 dark:divide-white/20">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="px-2 py-4">
                                                {/* Desktop row */}
                                                <div className="hidden sm:flex items-center gap-4">
                                                    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                                    <div className="flex-shrink-0 w-40 space-y-2">
                                                        <Skeleton className="h-5 w-28 max-w-full" />
                                                        <Skeleton className="h-4 w-20 max-w-full" />
                                                    </div>
                                                    <Skeleton className="h-7 w-14 rounded-lg flex-shrink-0" />
                                                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 items-end">
                                                        <Skeleton className="h-4 w-24" />
                                                        <Skeleton className="h-2 w-full rounded-full" />
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Skeleton className="h-10 w-28 rounded-lg" />
                                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                                    </div>
                                                </div>
                                                {/* Mobile stacked */}
                                                <div className="flex sm:hidden flex-col gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                                        <div className="min-w-0 flex-1 space-y-2">
                                                            <Skeleton className="h-5 w-28 max-w-full" />
                                                            <Skeleton className="h-4 w-20 max-w-full" />
                                                        </div>
                                                        <Skeleton className="h-7 w-14 rounded-lg flex-shrink-0" />
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <Skeleton className="h-4 w-24 self-end" />
                                                        <Skeleton className="h-2 w-full rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : systems.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No systems data available.</p>
                                        {!isReadOnly && (
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => setShowAddDefaultsModal(true)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-[#E8730A] hover:text-orange-700 px-3 py-1.5 rounded-lg border border-[#E8730A]/30 hover:bg-[#E8730A]/5"
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
                                        )}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-white/20">
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
                                            className="bg-white dark:bg-transparent px-2 py-4"
                                        >
                                            {/* Desktop: single row */}
                                            <div className="hidden sm:flex items-center gap-4">
                                                {/* Icon */}
                                                <div className="w-12 h-12 rounded-xl bg-[#F9F8F7] dark:bg-white/5 border border-[#D9D9D9] dark:border-white/10 flex items-center justify-center flex-shrink-0">
                                                    {getSystemIcon(system.system_type)}
                                                </div>

                                                {/* System Name + Brand */}
                                                <div className="flex-shrink-0 w-40">
                                                    <h4 className="text-base font-semibold text-[#3C4653] dark:text-gray-200 truncate">
                                                        {formatSystemType(system.system_type)}
                                                    </h4>
                                                    {system.brand && (
                                                        <span className="inline-block mt-1 max-w-full truncate text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-2 py-0.5">{system.brand}</span>
                                                    )}
                                                </div>

                                                {/* Dynamic Status Badge */}
                                                <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${status.bgColor} ${status.textColor} flex-shrink-0`}>
                                                    {status.label}
                                                </span>

                                                {/* Progress / Age Unknown */}
                                                <div className="flex-1 min-w-0">
                                                    {!isAgeUnknown ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-300 text-right whitespace-nowrap">
                                                                {formatAge(system.current_age, system.lifespan_max)}
                                                            </span>
                                                            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                    style={{ width: `${progressPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-amber-600">
                                                            Age unknown{!isReadOnly && <> — <button onClick={() => handleOpenSetAgeModal(system)} className="underline">Set Age</button></>}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                {!isReadOnly && (
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {system.replacement_history && system.replacement_history.length > 0 && (
                                                        <button
                                                            onClick={() => handleOpenHistoryModal(system)}
                                                            className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white whitespace-nowrap px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
                                                        >
                                                            History
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenResetModal(system)}
                                                        className="text-sm font-medium text-[#1F1F1F] dark:text-gray-200 whitespace-nowrap px-4 py-2.5 rounded-lg bg-[#F3F4F4] dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                                                    >
                                                        Reset System
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(system)}
                                                        aria-label="Edit system"
                                                        title="Edit system"
                                                        className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteModal(system)}
                                                        aria-label="Delete system"
                                                        title="Delete system"
                                                        className="p-2.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                )}
                                            </div>

                                            {/* Mobile: stacked rows */}
                                            <div className="flex sm:hidden flex-col gap-3">
                                                {/* Row 1: Icon, Name+Brand, Badge */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-[#F9F8F7] dark:bg-white/5 border border-[#D9D9D9] dark:border-white/10 flex items-center justify-center flex-shrink-0">
                                                        {getSystemIcon(system.system_type)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-base font-semibold text-[#3C4653] dark:text-gray-200 truncate">
                                                            {formatSystemType(system.system_type)}
                                                        </h4>
                                                        {system.brand && (
                                                            <span className="inline-block mt-1 max-w-full truncate text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-2 py-0.5">{system.brand}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${status.bgColor} ${status.textColor} flex-shrink-0`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Row 2: Progress / Age Unknown */}
                                                <div>
                                                    {!isAgeUnknown ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-sm text-gray-600 dark:text-gray-300 text-right whitespace-nowrap">
                                                                {formatAge(system.current_age, system.lifespan_max)}
                                                            </span>
                                                            <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                    style={{ width: `${progressPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-amber-600">
                                                            Age unknown{!isReadOnly && <> — <button onClick={() => handleOpenSetAgeModal(system)} className="underline">Set Age</button></>}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row 3: Action Buttons */}
                                                {!isReadOnly && (
                                                <div className="flex items-center gap-2">
                                                    {system.replacement_history && system.replacement_history.length > 0 && (
                                                        <button
                                                            onClick={() => handleOpenHistoryModal(system)}
                                                            className="flex-1 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:text-white whitespace-nowrap px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
                                                        >
                                                            History
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenResetModal(system)}
                                                        className="flex-1 text-center text-sm font-medium text-[#1F1F1F] whitespace-nowrap px-3 py-2.5 rounded-lg bg-[#F3F4F4] hover:bg-gray-200 transition-colors"
                                                    >
                                                        Reset System
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(system)}
                                                        aria-label="Edit system"
                                                        title="Edit system"
                                                        className="p-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDeleteModal(system)}
                                                        aria-label="Delete system"
                                                        title="Delete system"
                                                        className="p-2.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

                    {/* Property Insights */}
                    <div className="px-4 sm:px-6 py-4">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Property Insights</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Total Touch Points</p>
                                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{isLoadingMessages ? "..." : messageCount}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">High Priority Issues</p>
                                <p className="text-3xl sm:text-4xl font-bold text-[#BB0000]">{tierBreakdown.high}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Medium Priority Issues</p>
                                <p className="text-3xl sm:text-4xl font-bold text-[#A38601]">{tierBreakdown.medium}</p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-5">
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Low Priority Issues</p>
                                <p className="text-3xl sm:text-4xl font-bold text-gray-700 dark:text-gray-300">{tierBreakdown.low}</p>
                            </div>
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

            {showEditModal && selectedSystem && property.id && (
                <EditSystemModal
                    propertyId={property.id}
                    system={selectedSystem}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleEditSystemSuccess}
                />
            )}

            {showDeleteModal && selectedSystem && property.id && (
                <DeleteSystemModal
                    propertyId={property.id}
                    system={selectedSystem}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={handleDeleteSystemSuccess}
                />
            )}
        </div>
    );
}
