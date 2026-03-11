"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Home, MessageSquare } from "lucide-react"
import { processAPI, MessageResponse } from "@/lib/api"

interface Property {
    id: string
    name: string
    subtitle: string
    image?: string
    status: "Pending" | "Completed" | "In Progress" | "Failed"
    statusColor: string
    clientName?: string
    closingDate?: string
    createdAt?: string // Added
    processId?: string
}

interface PropertyDetailProps {
    property: Property | null
}

export function PropertyDetail({ property }: PropertyDetailProps) {
    const [messageCount, setMessageCount] = useState<number>(0)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)

    // Fetch messages when property or processId changes
    useEffect(() => {
        const fetchMessages = async () => {
            if (!property?.processId) {
                setMessageCount(0)
                return
            }

            setIsLoadingMessages(true)
            try {
                const messages = await processAPI.getMessages(property.processId)
                setMessageCount(messages.length)
            } catch (err) {
                console.error('Error fetching messages:', err)
                setMessageCount(0)
            } finally {
                setIsLoadingMessages(false)
            }
        }

        fetchMessages()
    }, [property?.processId])

    if (!property) {
        return (
            <Card className="bg-white overflow-hidden py-0 border-0 shadow-none rounded-[24px] md:rounded-[32px] h-full flex items-center justify-center min-h-[200px]">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
                    <p className="text-sm text-gray-500">Choose a property from the list to view details</p>
                </div>
            </Card>
        );
    }

    // Calculate days left until closing
    const daysLeft = property.closingDate
        ? Math.max(0, Math.ceil((new Date(property.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;

    const documents = [
        {
            id: 1,
            name: "4 Point Evaluation",
            progress: property.status === "Completed" ? 100 : 0,
            timestamp: property.status === "Completed" ? "Completed" : "Pending",
            icon: property.status === "Completed" ? "check" : "pending",
            color: "bg-[#007AFF]",
        },
        {
            id: 2,
            name: "Home Inspection",
            progress: property.status === "Completed" ? 100 : 0,
            timestamp: property.status === "Completed" ? "Completed" : "Pending",
            icon: property.status === "Completed" ? "check" : "pending",
            color: "bg-[#007AFF]",
        },
    ]

    // Format activation date for display
    const formattedActivationDate = property.createdAt
        ? new Date(property.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : "Not set";

    return (
        <Card className="bg-white overflow-hidden py-0 border-0 shadow-none rounded-[24px] md:rounded-[32px]">
            {/* Property Header Image */}
            <div className="relative w-full h-[150px] md:h-[200px] bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 overflow-hidden rounded-t-[24px] md:rounded-t-[32px]">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)' }} />

                {/* Property Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                    {property.image ? (
                        <Image
                            src={property.image}
                            alt={property.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 100vw"
                            className="object-cover"
                        />
                    ) : (
                        <img
                            src="/property-default.png"
                            alt="Property"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${property.status === "Completed"
                        ? "bg-emerald-500 text-white"
                        : property.status === "Failed"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}>
                        {property.status === "Completed" ? "✓ Complete" : property.status === "Failed" ? "⚠ Failed" : "⏳ Pending"}
                    </span>
                </div>

                {/* Client Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent pt-8 pb-3 px-4">
                    <h2 className="text-lg font-bold text-[#0C1D38] truncate">{property.clientName || 'No Client'}</h2>
                </div>
            </div>

            <div className="p-4 md:p-[20px]">
                {/* Location Details Section */}
                <div className="rounded-[12px] pt-[16px] pb-[16px] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>CLIENT</p>
                            <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38" }}>
                                {property.clientName || "Not specified"}
                            </p>
                        </div>
                        <div className="flex-shrink-0 text-left sm:text-right">
                            <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>VIANO ACTIVATED</p>
                            <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38" }}>
                                {formattedActivationDate}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-gray-50">
                        <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>COMPLETE ADDRESS</p>
                        <p className="text-[14px] leading-[21px] font-semibold break-words" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38" }}>
                            {property.name || "Not specified"}
                        </p>
                    </div>
                </div>

                {/* Issue Summary Section */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Issues Summary</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                                {isLoadingMessages ? "..." : messageCount}
                            </p>
                            <p className="text-xs text-gray-400">Total Issues</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl border border-gray-100">
                    <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium mb-4" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>DOCUMENTS</p>

                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="space-y-2 p-3 bg-white rounded-lg shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-900">{doc.name}</span>
                                        {doc.icon === "check" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        {doc.icon === "clock" && <Clock className="w-4 h-4 text-[#007AFF]" />}
                                        {doc.icon === "pending" && <AlertCircle className="w-4 h-4 text-slate-400" />}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-[#007AFF] font-medium">{doc.progress}%</p>
                                        {doc.timestamp && <p className="text-[10px] leading-[15px] text-right" style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, color: "#64748B" }}>{doc.timestamp}</p>}
                                    </div>
                                </div>

                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${doc.color} transition-all`} style={{ width: `${doc.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    )
}

