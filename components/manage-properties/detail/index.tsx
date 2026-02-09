"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Pencil, Download, Trash2, CheckCircle2, Star, AlertTriangle, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { processAPI, documentAPI, MessageResponse, getCurrentUserId } from "@/lib/api"

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
            const userId = getCurrentUserId()
            if (!userId) {
                setDocumentCount(0)
                setIsLoadingDocs(false)
                return
            }

            try {
                const docs = await documentAPI.getPropertyDocuments(userId, property.id)
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
        critical: messages.filter(m => m.priority_level === 1).length,
        high: messages.filter(m => m.priority_level === 2).length,
        medium: messages.filter(m => m.priority_level === 3).length,
        low: messages.filter(m => m.priority_level === 4 || m.priority_level === null).length,
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
                        </p>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-gray-50 px-1">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Viano Activated:</span>
                        <span className="text-sm font-semibold text-[#0C1D38]">
                            {property.createdAt || 'N/A'}
                        </span>
                    </div>

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
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                                Issues Summary
                            </h3>
                            <Star className="w-5 h-5 text-amber-500" />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl font-bold text-[#0C1D38]">
                                {isLoadingMessages ? "..." : messageCount}
                            </span>
                            <span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Total Issues</span>
                        </div>

                        {!isLoadingMessages && messageCount > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
                                {[
                                    { key: 'critical', count: tierBreakdown.critical, label: 'Critical', bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-700', iconColor: 'text-red-600', Icon: AlertTriangle },
                                    { key: 'high', count: tierBreakdown.high, label: 'High', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', textColor: 'text-orange-700', iconColor: 'text-orange-600', Icon: AlertCircle },
                                    { key: 'medium', count: tierBreakdown.medium, label: 'Medium', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700', iconColor: 'text-amber-600', Icon: Info },
                                    { key: 'low', count: tierBreakdown.low, label: 'Low', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700', iconColor: 'text-blue-600', Icon: Info },
                                ]
                                    .filter(item => item.count > 0)
                                    .map(({ key, count, label, bgColor, borderColor, textColor, iconColor, Icon }) => (
                                        <div key={key} className={`flex items-center gap-2 p-3 rounded-xl ${bgColor} border ${borderColor}`}>
                                            <Icon className={`w-4 h-4 ${iconColor}`} />
                                            <span className={`text-sm font-bold ${textColor}`}>{label}: {count}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
