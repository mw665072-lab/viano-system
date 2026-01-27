import type React from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: {
        value: number
        direction: "up" | "down"
        color: "green" | "red"
    }
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
    return (
        <Card className="bg-white border-0 shadow-sm w-full min-h-[140px] md:h-[159px] rounded-[24px] p-4 md:p-[18px] flex flex-col justify-between opacity-100 rotate-0">
            <div className="flex items-center gap-[20px]">
                <div className="text-2xl">{icon}</div>

                <h3
                    className="text-[16px] font-medium text-[#3C4653]"
                    style={{ fontFamily: 'Roboto, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                >
                    {title}
                </h3>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <span
                    className="text-3xl md:text-[48px] font-semibold text-[#0C1D38]"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                >
                    {value}
                </span>
                {trend && (
                    <div
                        className={`flex items-center justify-center gap-1 text-xs md:text-sm font-semibold min-w-[70px] md:w-[82px] h-8 md:h-[34px] rounded-full px-2 md:px-[12px] py-1 md:py-[8px] opacity-100 rotate-0 ${trend.direction === "up"
                            ? "bg-[#34C7591A] text-[#34C759]"
                            : "bg-[#BB00001A] text-[#BB0000]"
                            }`}
                    >
                        <span className="leading-none">
                            {trend.direction === "up" ? "+" : "-"}
                            {trend.value}%
                        </span>
                        {trend.direction === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                )}
            </div>
        </Card>
    )
}
