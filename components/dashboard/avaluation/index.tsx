"use client"

import { useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { PropertyList } from "../list"
import { PropertyDetail } from "../detail"


const properties = [
    {
        id: 1,
        name: "Wayland Beach house",
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
        name: "Seaside Villa",
        subtitle: "Seaside Villa",
        image: "https://images.unsplash.com/photo-1613228060223-461bfa1220a0?w=200&h=120&fit=crop",
        status: "Pending",
        statusColor: "bg-amber-100 text-amber-800",
    },
    {
        id: 4,
        name: "Urban Penthouse",
        subtitle: "Urban Penthouse",
        image: "https://images.unsplash.com/photo-1512917774080-9b274b5ce7c0?w=200&h=120&fit=crop",
        status: "Completed",
        statusColor: "bg-emerald-100 text-emerald-800",
    },
]

export function PropertyEvaluationDashboard() {
    const [selectedProperty, setSelectedProperty] = useState(properties[0])
    const [showDetail, setShowDetail] = useState(true)

    return (
        <div className="rounded-[32px] opacity-100 rotate-0">
            <div className="grid grid-cols-1 lg:grid-cols-[10fr_7fr] gap-4 lg:gap-[29px]">
                {/* Left Column - Property List (Frame 11) */}
                <div className="bg-white w-full lg:h-[702px] rounded-[32px] p-[32px] flex flex-col opacity-100 rotate-0">
                    <div className="mb-[32px] flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2
                                className="text-[20px] font-semibold text-[#0C1D38]"
                                style={{ fontFamily: 'Manrope, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                            >
                                Evaluation Overview
                            </h2>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-[10px] w-[117px] h-[40px] rounded-[32323px] px-[16px] py-[8px] bg-[#F8F9FA] border border-[#D9D9D9] text-sm text-[#0C1D38] opacity-100 rotate-0"
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

                {/* Right Column - Property Detail (Frame 162) */}
                <div className="hidden lg:block w-full lg:h-[702px] rounded-[32px] opacity-100 rotate-0 overflow-y-auto relative">
                    {showDetail && (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowDetail(false)}
                                className="absolute top-4 left-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                            <PropertyDetail property={selectedProperty} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
