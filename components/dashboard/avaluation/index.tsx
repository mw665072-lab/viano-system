"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { PropertyList } from "../list"
import { PropertyDetail } from "../detail"


const properties = [
    {
        id: 1,
        name: "Wayland Beach House",
        subtitle: "Wayland Beach house",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop",
        status: "Pending",
        statusColor: "bg-amber-100 text-amber-800",
    },
    {
        id: 2,
        name: "Lakeview Cabin",
        subtitle: "Lakeview Cabin",
        image: "https://images.unsplash.com/photo-1535202712071-c1b9a9b1df60?w=200&h=120&fit=crop",
        status: "Completed",
        statusColor: "bg-emerald-100 text-emerald-800",
    },
    {
        id: 3,
        name: "Mountain Retreat",
        subtitle: "Mountain Retreat",
        image: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=200&h=120&fit=crop",
        status: "Pending",
        statusColor: "bg-amber-100 text-amber-800",
    },
    {
        id: 4,
        name: "Seaside Villa",
        subtitle: "Seaside Villa",
        image: "https://images.unsplash.com/photo-1613228060223-461bfa1220a0?w=200&h=120&fit=crop",
        status: "Pending",
        statusColor: "bg-amber-100 text-amber-800",
    },
    {
        id: 5,
        name: "Urban Penthouse",
        subtitle: "Urban Penthouse",
        image: "https://images.unsplash.com/photo-1512917774080-9b274b5ce7c0?w=200&h=120&fit=crop",
        status: "Completed",
        statusColor: "bg-emerald-100 text-emerald-800",
    },
]

export function PropertyEvaluationDashboard() {
    const [selectedProperty, setSelectedProperty] = useState(properties[0])

    return (
        <div className="rounded-[32px] opacity-100 rotate-0">
            <div className="grid grid-cols-1 lg:grid-cols-[65%_30%] gap-4 lg:gap-6">
                {/* Left Column - Property List */}
                <div className="bg-white p-4 lg:p-6 rounded-[16px] lg:rounded-[32px] flex flex-col h-full lg:h-[60vh]">
                    <div className="mb-4 lg:mb-6 flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2
                                className="text-[18px] lg:text-[20px] font-semibold text-[#0C1D38]"
                                style={{ fontFamily: 'Manrope, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                            >
                                Evaluation Overview
                            </h2>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-[10px] w-[100px] lg:w-[117px] h-[36px] lg:h-[40px] rounded-[32323px] px-[12px] lg:px-[16px] py-[8px] bg-[#F8F9FA] border border-[#D9D9D9] text-xs lg:text-sm text-[#0C1D38] opacity-100 rotate-0"
                            >
                                View All
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-y-auto pr-2 flex-1">
                        <PropertyList
                            properties={properties}
                            selectedProperty={selectedProperty}
                            onSelectProperty={setSelectedProperty}
                        />
                    </div>
                </div>

                {/* Right Column - Property Detail */}
                <div className="rounded-[16px] lg:rounded-[32px] opacity-100 rotate-0 overflow-y-auto h-full lg:h-[60vh]">
                    <PropertyDetail property={selectedProperty} />
                </div>
            </div>
        </div>
    )
}
