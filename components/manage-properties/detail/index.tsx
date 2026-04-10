"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Pencil, Download, Trash2, CheckCircle2, Star, AlertTriangle, AlertCircle, Info, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { processAPI, documentAPI, MessageResponse } from "@/lib/api"

interface PropertyDetailData {
    id: string
    name: string
    address: string
    location: string
    type: string
    client: string
    closingDays: number
    status: "Pending" | "Completed" | "Processing" | "Failed"
    documentsSubmitted: number
    documentsTotal: number
    aiAnalysisProgress: number
    totalIssues: number
    criticalIssues: number
    statusMessage?: string
    processId?: string
    createdAt?: string // Added
    yearBuilt?: number
    squareFootage?: number
    bedrooms?: number
    bathrooms?: number
    lotSize?: number
    propertyType?: string
    purchasePrice?: number
    purchaseDate?: string
    city?: string
    state?: string
    zipCode?: string
}

interface PropertyDetailPanelProps {
    property: PropertyDetailData
    onClose: () => void
    onEdit?: () => void
    onDownload?: () => void
    onDelete?: () => void
}

// Helper to get tier label and color from priority_level
function getTierInfo(priorityLevel: number | null): { label: string; color: string; icon: React.ReactNode } {
    switch (priorityLevel) {
        case 1:
            return { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", icon: <AlertTriangle className="w-3 h-3" /> };
        case 2:
            return { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", icon: <AlertCircle className="w-3 h-3" /> };
        case 3:
            return { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", icon: <Info className="w-3 h-3" /> };
        case 4:
        default:
            return { label: "Low", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Info className="w-3 h-3" /> };
    }
}

export function PropertyDetailPanel({
    property,
    onClose,
    onEdit,
    onDownload,
    onDelete,
}: PropertyDetailPanelProps) {
    const [messages, setMessages] = useState<MessageResponse[]>([])
    const [messageCount, setMessageCount] = useState<number>(property.totalIssues)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)

    // Document count state - initialize to the count from props for immediate display
    const [documentCount, setDocumentCount] = useState<number>(property.documentsSubmitted)
    const [isLoadingDocs, setIsLoadingDocs] = useState(true)

    // Helper: resolve effective priority from realtor_alert.priority (string) first
    const getEffectivePriority = (m: MessageResponse): number => {
        // Prefer realtor_alert.priority (the string inside the nested object)
        const alertPriority = m.realtor_alert?.priority;
        if (alertPriority && typeof alertPriority === 'string') {
            const p = alertPriority.toLowerCase();
            if (p === 'critical') return 1;
            if (p === 'high') return 2;
            if (p === 'medium') return 3;
            if (p === 'low') return 4;
        }
        // Fallback to priority_level if realtor_alert.priority is not available
        if (m.priority_level != null) return m.priority_level;
        return 4; // default to low
    }

    // Fetch messages when property or processId changes
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

    // Fetch actual document count when property changes
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

    // Calculate tier breakdown
    const tierBreakdown = {
        high: messages.filter(m => getEffectivePriority(m) === 1 || getEffectivePriority(m) === 2).length,
        medium: messages.filter(m => getEffectivePriority(m) === 3).length,
        low: messages.filter(m => getEffectivePriority(m) === 4).length,
    }

    const documentsProgress = (documentCount / property.documentsTotal) * 100


    return (
        <div className="flex flex-col bg-white rounded-tl-[32px] lg:rounded-none shadow-[0px_2px_6px_0px_rgba(0,0,0,0.15)] h-full relative overflow-hidden">
            {/* 1. Sticky Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-4 lg:p-6 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-[#007AFF] hover:bg-blue-50 p-1 rounded-full transition-colors flex-shrink-0"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg lg:text-2xl font-bold text-[#0C1D38] truncate leading-tight">
                            {property.client}
                        </h2>
                    </div>
                    <Badge
                        className={`rounded-full px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-tight ${property.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : property.status === "Failed"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : property.status === "Processing"
                                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                    >
                        {property.statusMessage || (property.status === "Completed" ? "Complete" : "Pending")}
                    </Badge>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* 2. Media Section - Restored Rounded Corners & Gradient */}
                <div className="relative w-full h-[220px] md:h-[280px] bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 overflow-hidden rounded-t-[32px] lg:rounded-none">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)' }} />
                    <img
                        src="/property-default.png"
                        alt="Property"
                        className="w-full h-full object-cover"
                    />
                    {/* Subtle Overlay for Location */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-6">
                        <p className="text-xs text-white/90 font-medium drop-shadow-sm">{property.location}</p>
                    </div>
                </div>

                {/* 3. Consolidated Content Section */}
                <div className="p-6 lg:p-8 space-y-6">
                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                            className="flex items-center gap-2 rounded-lg border-gray-200 text-[#0C1D38] hover:bg-gray-50 h-9 text-xs font-semibold px-4"
                        >
                            <Pencil className="w-4 h-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownload}
                            className="flex items-center gap-2 rounded-lg border-gray-200 text-[#0C1D38] hover:bg-gray-50 h-9 text-xs font-semibold px-4 whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </Button>
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

                    {/* Property Address Section - Restored Styling */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5">
                            Property Address
                        </p>
                        <p className="text-sm font-semibold text-[#0C1D38] break-words">
                            {property.address}
                            {property.city && `, ${property.city}`}
                            {property.state && `, ${property.state}`}
                            {property.zipCode && ` ${property.zipCode}`}
                        </p>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-50 px-1">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Viano Activated:</span>
                        <span className="text-sm font-semibold text-[#0C1D38]">
                            {property.createdAt || 'N/A'}
                        </span>
                    </div>

                    {/* Property Specs Section */}
                    {(property.yearBuilt || property.squareFootage || property.propertyType) && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                            <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-3">
                                Property Specifications
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3">
                                {property.propertyType && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Type</p>
                                        <p className="text-sm font-semibold text-[#0C1D38] capitalize">
                                            {property.propertyType.replace('_', ' ')}
                                        </p>
                                    </div>
                                )}
                                {property.yearBuilt && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Year Built</p>
                                        <p className="text-sm font-semibold text-[#0C1D38]">{property.yearBuilt}</p>
                                    </div>
                                )}
                                {property.squareFootage && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Sq Footage</p>
                                        <p className="text-sm font-semibold text-[#0C1D38]">{property.squareFootage.toLocaleString()} sq ft</p>
                                    </div>
                                )}
                                {property.lotSize && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Lot Size</p>
                                        <p className="text-sm font-semibold text-[#0C1D38]">{property.lotSize} Acres</p>
                                    </div>
                                )}
                                {property.bedrooms && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Beds</p>
                                        <p className="text-sm font-semibold text-[#0C1D38]">{property.bedrooms}</p>
                                    </div>
                                )}
                                {property.bathrooms && (
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Baths</p>
                                        <p className="text-sm font-semibold text-[#0C1D38]">{property.bathrooms}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inspection Status Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                                Inspection Status
                            </h3>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>

                        <div className="space-y-4">
                            {/* Documents Progress */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748B]">DOCUMENTS:</span>
                                    <span className="text-sm font-medium text-[#0C1D38]">
                                        {isLoadingDocs ? "..." : `${documentCount}/${property.documentsTotal}`} Submitted
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{ width: `${documentsProgress}%` }}
                                    />
                                </div>
                            </div>

                            {/* AI Analysis Progress */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748B]">AI ANALYSIS:</span>
                                    <span className="text-sm font-medium text-[#0C1D38]">
                                        {property.aiAnalysisProgress}% Complete
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${property.aiAnalysisProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Issues Summary Section - Restored Original Visuals */}
                    {/* Issues Summary Section */}
                    <div className="mt-2 p-5 bg-white rounded-[28px] border border-gray-100/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden group">
                        {/* Background Decorative Element */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors duration-700" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-[#0C1D38] uppercase tracking-wider">Issues Summary</h3>
                                        <p className="text-[9px] text-[#64748B] font-bold mt-0.5 uppercase tracking-tight opacity-60">Priority Distribution</p>
                                    </div>
                                </div>
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500 opacity-80" />
                            </div>

                            <div className="flex items-end justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-5xl font-black text-[#0C1D38] tracking-tighter leading-none">
                                        {isLoadingMessages ? "..." : messageCount}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-[0.15em] leading-tight mb-0.5 opacity-50">Property</span>
                                        <span className="text-xs font-bold text-[#0C1D38] uppercase tracking-wider">Total touchpoints</span>
                                    </div>
                                </div>
                            </div>

                            {!isLoadingMessages && messageCount > 0 && (
                                <div className="mb-6">
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full flex overflow-hidden p-0">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000"
                                            style={{ width: `${(tierBreakdown.high / messageCount) * 100}%` }}
                                        />
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000"
                                            style={{ width: `${(tierBreakdown.medium / messageCount) * 100}%` }}
                                        />
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000"
                                            style={{ width: `${(tierBreakdown.low / messageCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {!isLoadingMessages && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        {
                                            key: 'high',
                                            count: tierBreakdown.high,
                                            label: 'High',
                                            gradient: 'from-orange-50 to-white',
                                            borderColor: 'border-orange-100',
                                            textColor: 'text-orange-700',
                                            iconColor: 'text-orange-500',
                                            Icon: AlertCircle
                                        },
                                        {
                                            key: 'medium',
                                            count: tierBreakdown.medium,
                                            label: 'Medium',
                                            gradient: 'from-amber-50 to-white',
                                            borderColor: 'border-amber-100',
                                            textColor: 'text-amber-700',
                                            iconColor: 'text-amber-500',
                                            Icon: Info
                                        },
                                        {
                                            key: 'low',
                                            count: tierBreakdown.low,
                                            label: 'Low',
                                            gradient: 'from-blue-50 to-white',
                                            borderColor: 'border-blue-100',
                                            textColor: 'text-blue-700',
                                            iconColor: 'text-blue-500',
                                            Icon: Info
                                        },
                                    ]
                                        .map(({ key, count, label, gradient, borderColor, textColor, iconColor, Icon }) => (
                                            <div key={key} className={`flex flex-col items-start gap-2 p-3 rounded-2xl bg-gradient-to-b ${gradient} border ${borderColor} transition-all duration-300 hover:shadow-sm h-full group/card`}>
                                                <div className={`p-1.5 rounded-lg bg-white/80 shadow-sm backdrop-blur-sm`}>
                                                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-[9px] uppercase font-black tracking-widest ${textColor} opacity-50 mb-0.5`}>{label}</p>
                                                    <p className={`text-lg font-black ${textColor} tracking-tight`}>{count}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
