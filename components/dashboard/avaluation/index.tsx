"use client"

import { useState, useEffect } from "react"
import { ChevronRight, X, AlertCircle } from "lucide-react"
import { PropertyList } from "../list"
import { PropertyDetail } from "../detail"
import { propertyAPI, PropertyResponse, getCurrentUserId } from "@/lib/api"
import Link from "next/link"

interface DashboardProperty {
    id: string
    name: string
    subtitle: string
    image?: string
    status: "Pending" | "Completed"
    statusColor: string
    clientName?: string
    closingDate?: string
}

export function PropertyEvaluationDashboard() {
    const [properties, setProperties] = useState<DashboardProperty[]>([])
    const [selectedProperty, setSelectedProperty] = useState<DashboardProperty | null>(null)
    const [showDetail, setShowDetail] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch ALL properties from API on mount
    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const userId = getCurrentUserId()
                console.log('Dashboard: Fetching properties for userId:', userId)

                if (!userId) {
                    console.log('Dashboard: No userId found, showing empty state')
                    setProperties([])
                    setIsLoading(false)
                    return
                }

                const apiProperties = await propertyAPI.getUserProperties(userId)
                console.log('Dashboard: Received', apiProperties.length, 'properties from API')

                // Transform ALL API properties to dashboard format (no filtering)
                const transformedProperties: DashboardProperty[] = apiProperties.map((prop: PropertyResponse) => ({
                    id: prop.property_id,
                    name: prop.property_name,
                    subtitle: prop.location,
                    image: undefined,
                    status: "Pending" as const,
                    statusColor: "bg-amber-100 text-amber-800",
                    clientName: prop.client_name,
                    closingDate: prop.property_closing_date || undefined,
                }))

                console.log('Dashboard: Displaying', transformedProperties.length, 'properties')
                setProperties(transformedProperties)

                if (transformedProperties.length > 0) {
                    setSelectedProperty(transformedProperties[0])
                }
            } catch (err) {
                console.error('Dashboard: Error fetching properties:', err)
                setError(err instanceof Error ? err.message : 'Failed to load properties')
            } finally {
                setIsLoading(false)
            }
        }

        fetchProperties()
    }, [])

    return (
        <div className="rounded-[32px] opacity-100 rotate-0">
            <div className="grid grid-cols-1 lg:grid-cols-[10fr_7fr] gap-4 lg:gap-[29px]">
                {/* Left Column - Property List */}
                <div className="bg-white w-full lg:h-[702px] rounded-[32px] p-[32px] flex flex-col opacity-100 rotate-0">
                    <div className="mb-[32px] flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2
                                className="text-[20px] font-semibold text-[#0C1D38]"
                                style={{ fontFamily: 'Manrope, sans-serif', lineHeight: '100%', letterSpacing: '0%' }}
                            >
                                Evaluation Overview
                                {properties.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        ({properties.length} {properties.length === 1 ? 'property' : 'properties'})
                                    </span>
                                )}
                            </h2>
                            <Link
                                href="/manage-properties"
                                className="flex items-center justify-center gap-[10px] w-[117px] h-[40px] rounded-[32323px] px-[16px] py-[8px] bg-[#F8F9FA] border border-[#D9D9D9] text-sm text-[#0C1D38] opacity-100 rotate-0 hover:bg-gray-100 transition-colors"
                            >
                                View All
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="overflow-y-auto pr-2 flex-1">
                        <PropertyList
                            properties={properties}
                            selectedProperty={selectedProperty}
                            onSelectProperty={setSelectedProperty}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Right Column - Property Detail */}
                <div className="hidden lg:block w-full lg:h-[702px] rounded-[32px] opacity-100 rotate-0 overflow-y-auto relative">
                    {showDetail && (
                        <>
                            {selectedProperty && (
                                <button
                                    type="button"
                                    onClick={() => setShowDetail(false)}
                                    className="absolute top-4 left-4 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                            <PropertyDetail property={selectedProperty} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
