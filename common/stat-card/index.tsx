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
        <Card className="bg-white border-0 shadow-sm w-full h-[159px] rounded-[24px] p-[18px] flex flex-col justify-between opacity-100 rotate-0">
            <div className="flex items-center gap-[20px]">
                <div className="text-2xl">{icon}</div>

                <h3
                    className="text-[16px] font-medium text-[#3C4653]"
                    style={{ fontFamily: 'Roboto, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                >
                    {title}
                </h3>
            </div>

            <div className="flex items-center gap-4">
                <span
                    className="text-[48px] font-semibold text-[#0C1D38]"
                    style={{ fontFamily: 'Inter, system-ui, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                >
                    {value}
                </span>
                {trend && (
                    <div
                        className={`flex items-center justify-center gap-[4px] text-sm font-semibold w-[82px] h-[34px] rounded-[3232px] px-[12px] py-[8px] opacity-100 rotate-0 ${trend.direction === "up"
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
