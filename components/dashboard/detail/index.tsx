"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle, Home } from "lucide-react"

interface Property {
    id: string
    name: string
    subtitle: string
    image?: string
    status: "Pending" | "Completed"
    statusColor: string
    clientName?: string
    closingDate?: string
}

interface PropertyDetailProps {
    property: Property | null
}

export function PropertyDetail({ property }: PropertyDetailProps) {
    if (!property) {
        return (
            <Card className="bg-white overflow-hidden py-0 border-0 shadow-none rounded-[32px] h-full flex items-center justify-center">
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

    // Format closing date for display
    const formattedClosingDate = property.closingDate
        ? new Date(property.closingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : "Not set";

    return (
        <Card className="bg-white overflow-hidden py-0 border-0 shadow-none rounded-[32px]">
            <div className="relative w-full h-[223px] bg-slate-200 overflow-hidden rounded-tl-[32px] rounded-tr-[32px]">
                {property.image ? (
                    <Image
                        src={property.image}
                        alt={property.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 100vw"
                        className="object-cover"
                        style={{ transform: "rotate(0deg)", opacity: 1 }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                        <Home className="w-16 h-16 text-slate-400" />
                    </div>
                )}

                <div className="absolute inset-0 p-4">
                    <div
                        className={`absolute top-4 right-4 flex items-center justify-center gap-[10px] px-[10px] py-[8px] text-xs font-semibold rounded-[20px] ${property.status === "Completed"
                                ? "text-emerald-600 bg-emerald-100/80"
                                : "text-[#FF4D00]"
                            }`}
                        style={{
                            background: property.status === "Completed"
                                ? "rgba(16, 185, 129, 0.2)"
                                : "rgba(255, 149, 0, 0.2)",
                            backdropFilter: "blur(2px)"
                        }}
                    >
                        {property.status === "Completed" ? "Evaluation Complete" : "Evaluation Pending"}
                    </div>

                    <h2
                        className="absolute left-4 bottom-4 text-white text-[18px] font-bold drop-shadow-lg"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, lineHeight: "22.5px" }}
                    >
                        {property.name}
                    </h2>
                </div>
            </div>

            <div className="p-[20px]">
                <div className="flex items-center justify-between rounded-[12px] pt-[16px] pb-[16px]">
                    <div>
                        <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>CLIENT</p>
                        <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38" }}>
                            {property.clientName || "Not specified"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>CLOSING</p>
                        <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38", textAlign: "right" }}>
                            {formattedClosingDate}
                        </p>
                        {daysLeft !== null && (
                            <p className={`text-xs font-medium ${daysLeft <= 7 ? "text-[#FF3B30]" : daysLeft <= 14 ? "text-amber-500" : "text-emerald-500"}`}>
                                {daysLeft} days left
                            </p>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium mb-4" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>DOCUMENTS</p>

                    <div className="space-y-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="space-y-2">
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
