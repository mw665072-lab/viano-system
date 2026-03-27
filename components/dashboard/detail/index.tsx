"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Home, MessageSquare, AlertTriangle, Info, Star } from "lucide-react"
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
    city?: string
    state?: string
    zipCode?: string
}

interface PropertyDetailProps {
    property: Property | null
}

export function PropertyDetail({ property }: PropertyDetailProps) {
    const [messageCount, setMessageCount] = useState<number>(0)
    const [messages, setMessages] = useState<MessageResponse[]>([])
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)

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
            if (!property?.processId) {
                setMessageCount(0)
                return
            }

            setIsLoadingMessages(true)
            try {
                const fetchedMessages = await processAPI.getMessages(property.processId)
                setMessages(fetchedMessages)
                setMessageCount(fetchedMessages.length)
            } catch (err) {
                console.error('Error fetching messages:', err)
                setMessages([])
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
                            {property.name}
                            {property.city && `, ${property.city}`}
                            {property.state && `, ${property.state}`}
                            {property.zipCode && ` ${property.zipCode}`}
                        </p>
                    </div>
                </div>

                {/* Issue Summary Section */}
                <div className="mb-6 p-6 md:p-8 bg-white rounded-[32px] border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group">
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/50 transition-colors duration-700" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#0C1D38] uppercase tracking-wider">Issues Summary</h3>
                                    <p className="text-[11px] text-[#64748B] font-medium mt-0.5 uppercase tracking-tight opacity-70">Intelligent Analysis Distribution</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Priority Insights</span>
                            </div>
                        </div>

                        <div className="flex items-end justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <span className="text-6xl font-black text-[#0C1D38] tracking-tighter leading-none">
                                    {isLoadingMessages ? "..." : messageCount}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em] leading-tight mb-1 opacity-60">Property</span>
                                    <span className="text-sm font-bold text-[#0C1D38] uppercase tracking-wider">Total touchpoints</span>
                                </div>
                            </div>
                        </div>

                        {!isLoadingMessages && messageCount > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Distribution Profile</span>
                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{Math.round((messages.filter(m => getEffectivePriority(m) === 1 || getEffectivePriority(m) === 2).length / messageCount) * 100)}% High Impact</span>
                                </div>
                                <div className="w-full h-2.5 bg-gray-100 rounded-full flex overflow-hidden shadow-inner p-0.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000 rounded-full"
                                        style={{ width: `${(messages.filter(m => getEffectivePriority(m) === 1 || getEffectivePriority(m) === 2).length / messageCount) * 100}%`, marginRight: '2px' }}
                                    />
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 rounded-full"
                                        style={{ width: `${(messages.filter(m => getEffectivePriority(m) === 3).length / messageCount) * 100}%`, marginRight: '2px' }}
                                    />
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000 rounded-full"
                                        style={{ width: `${(messages.filter(m => getEffectivePriority(m) === 4).length / messageCount) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {!isLoadingMessages && (
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    {
                                        key: 'high',
                                        count: messages.filter(m => getEffectivePriority(m) === 1 || getEffectivePriority(m) === 2).length,
                                        label: 'High',
                                        gradient: 'from-orange-50 to-orange-100/50',
                                        borderColor: 'border-orange-200/50',
                                        textColor: 'text-orange-700',
                                        iconColor: 'text-orange-500',
                                        symbolColor: 'bg-orange-500',
                                        Icon: AlertCircle
                                    },
                                    {
                                        key: 'medium',
                                        count: messages.filter(m => getEffectivePriority(m) === 3).length,
                                        label: 'Medium',
                                        gradient: 'from-amber-50 to-amber-100/50',
                                        borderColor: 'border-amber-200/50',
                                        textColor: 'text-amber-700',
                                        iconColor: 'text-amber-500',
                                        symbolColor: 'bg-amber-500',
                                        Icon: Info
                                    },
                                    {
                                        key: 'low',
                                        count: messages.filter(m => getEffectivePriority(m) === 4).length,
                                        label: 'Low',
                                        gradient: 'from-blue-50 to-blue-100/50',
                                        borderColor: 'border-blue-200/50',
                                        textColor: 'text-blue-700',
                                        iconColor: 'text-blue-500',
                                        symbolColor: 'bg-blue-500',
                                        Icon: Info
                                    },
                                ]
                                    .map(({ key, count, label, gradient, borderColor, textColor, iconColor, symbolColor, Icon }) => (
                                        <div key={key} className={`flex flex-col items-start gap-3 p-4 rounded-[20px] bg-gradient-to-b ${gradient} border ${borderColor} transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_10px_20px_rgba(0,0,0,0.05)] h-full relative overflow-hidden group/card`}>
                                            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover/card:scale-110 transition-transform duration-500">
                                                <Icon className="w-20 h-20" />
                                            </div>
                                            <div className={`p-2.5 rounded-xl bg-white/80 shadow-sm flex-shrink-0 backdrop-blur-sm`}>
                                                <Icon className={`w-4 h-4 ${iconColor}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-[10px] uppercase font-black tracking-[0.15em] ${textColor} opacity-50 mb-1`}>{label}</p>
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className={`text-2xl font-black ${textColor} tracking-tight`}>{count}</p>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${symbolColor} animate-pulse`} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
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

