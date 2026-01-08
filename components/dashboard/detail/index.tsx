import Image from "next/image"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface Property {
    id: number
    name: string
    subtitle: string
    image: string
    status: "Pending" | "Completed"
    statusColor: string
}

interface PropertyDetailProps {
    property: Property
}

export function PropertyDetail({ property }: PropertyDetailProps) {
    const documents = [
        {
            id: 1,
            name: "4 Point Evaluation",
            progress: 100,
            timestamp: "2 hours ago",
            icon: "check",
            color: "bg-[#007AFF]",
        },
        {
            id: 2,
            name: "Home Inspection",
            progress: 65,
            timestamp: "In progress",
            icon: "clock",
            color: "bg-[#007AFF]",
        },
    ]

    return (
        <Card className="bg-white overflow-hidden py-0 border-0 shadow-none rounded-[32px]">
            <div className="relative w-full h-[223px] bg-slate-200 overflow-hidden rounded-tl-[32px] rounded-tr-[32px]">
                <Image
                    src="/property-placeholder.png"
                    alt={property.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 100vw"
                    className="object-cover"
                    style={{ transform: "rotate(0deg)", opacity: 1 }}
                />

                <div className="absolute inset-0 p-4">
                    <div
                        className="absolute top-4 right-4 flex items-center justify-center gap-[10px] px-[10px] py-[8px] text-[#FF4D00] text-xs font-semibold rounded-[20px]"
                        style={{ background: "rgba(255, 149, 0, 0.2)", backdropFilter: "blur(2px)", transform: "rotate(0deg)", opacity: 1 }}
                    >
                        Evaluation Pending
                    </div>

                    <h2
                        className="absolute left-4 bottom-4 text-white text-[18px] font-bold"
                        style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontStyle: "normal", lineHeight: "22.5px", color: "#FFFFFF" }}
                    >
                        Wayland Beach House
                    </h2>
                </div>
            </div>

            <div className="p-[20px]">
                <div className="flex items-center justify-between rounded-[12px] pt-[16px] pb-[16px]" style={{ transform: "rotate(0deg)", opacity: 1 }}>
                    <div>
                        <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>CLIENT</p>
                        <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38" }}>Sarah Johnson</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[12px] leading-[18px] tracking-[0.3px] uppercase font-medium" style={{ fontFamily: "Inter, sans-serif", color: "#64748B", fontWeight: 500 }}>CLOSING</p>
                        <p className="text-[14px] leading-[21px] font-semibold" style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, color: "#0C1D38", textAlign: "right" }}>Feb 15, 2024</p>
                        <p className="text-xs text-[#FF3B30] font-medium">0 days left</p>
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
