"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Pencil, Download, Trash2, CheckCircle2, Star, AlertTriangle, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { processAPI, MessageResponse } from "@/lib/api"

interface PropertyDetailData {
    id: string
    name: string
    address: string
    type: string
    client: string
    closingDays: number
    status: "Pending" | "Completed"
    documentsSubmitted: number
    documentsTotal: number
    aiAnalysisProgress: number
    totalIssues: number
    criticalIssues: number
    processId?: string
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

    // Calculate tier breakdown
    const tierBreakdown = {
        critical: messages.filter(m => m.priority_level === 1).length,
        high: messages.filter(m => m.priority_level === 2).length,
        medium: messages.filter(m => m.priority_level === 3).length,
        low: messages.filter(m => m.priority_level === 4 || m.priority_level === null).length,
    }

    const documentsProgress = (property.documentsSubmitted / property.documentsTotal) * 100


    return (
        <div className="h-full flex flex-col bg-white rounded-tl-[32px] lg:rounded-none shadow-[0px_2px_6px_0px_rgba(0,0,0,0.15)]">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={onClose}
                            className="mt-1 text-[#007AFF] hover:text-blue-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-[#0C1D38]">
                                {property.name}
                            </h2>
                            <p className="text-sm text-[#64748B] mt-1">{property.address}</p>
                        </div>
                    </div>
                    <Badge
                        className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${property.status === "Completed"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                    >
                        {property.status === "Completed" ? "Inspection Complete" : "Inspection Pending"}
                    </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="flex items-center gap-2 rounded-lg border-gray-300 text-[#0C1D38] hover:bg-gray-50"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDownload}
                        className="flex items-center gap-2 rounded-lg border-gray-300 text-[#0C1D38] hover:bg-gray-50"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                        className="flex items-center gap-2 rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                {/* Property Details Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                            Property Details
                        </h3>
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect
                                    x="3"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1"
                                    stroke="#64748B"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="14"
                                    y="3"
                                    width="7"
                                    height="7"
                                    rx="1"
                                    stroke="#64748B"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="3"
                                    y="14"
                                    width="7"
                                    height="7"
                                    rx="1"
                                    stroke="#64748B"
                                    strokeWidth="2"
                                />
                                <rect
                                    x="14"
                                    y="14"
                                    width="7"
                                    height="7"
                                    rx="1"
                                    stroke="#64748B"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">TYPE:</span>
                            <span className="text-sm font-medium text-[#0C1D38]">{property.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">CLIENT:</span>
                            <span className="text-sm font-medium text-[#0C1D38]">{property.client}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-[#64748B]">CLOSING:</span>
                            <span className={`text-sm font-medium ${property.closingDays <= 14 ? "text-emerald-600" : "text-[#0C1D38]"}`}>
                                {property.closingDays} days
                            </span>
                        </div>
                    </div>
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
                                    {property.documentsSubmitted}/{property.documentsTotal} Submitted
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
                                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                                    style={{ width: `${property.aiAnalysisProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Issues Summary Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
                            Issues Summary
                        </h3>
                        <Star className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <span className="text-4xl font-bold text-[#0C1D38]">
                                {isLoadingMessages ? "..." : messageCount}
                            </span>
                        </div>
                        <span className="text-sm text-[#64748B]">TOTAL ISSUES</span>
                    </div>

                    {/* Tier Breakdown */}
                    {!isLoadingMessages && messageCount > 0 && (
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">By Priority</p>
                            <div className="grid grid-cols-2 gap-2">
                                {tierBreakdown.critical > 0 && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                        <span className="text-sm font-medium text-red-700">Critical: {tierBreakdown.critical}</span>
                                    </div>
                                )}
                                {tierBreakdown.high > 0 && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                                        <AlertCircle className="w-4 h-4 text-orange-600" />
                                        <span className="text-sm font-medium text-orange-700">High: {tierBreakdown.high}</span>
                                    </div>
                                )}
                                {tierBreakdown.medium > 0 && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                        <Info className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-700">Medium: {tierBreakdown.medium}</span>
                                    </div>
                                )}
                                {tierBreakdown.low > 0 && (
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700">Low: {tierBreakdown.low}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
