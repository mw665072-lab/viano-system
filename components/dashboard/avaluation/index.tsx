"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight, X, AlertCircle, Plus } from "lucide-react"
import { PropertyList } from "../list"
import { PropertyDetail } from "../detail"
import { propertyAPI, processAPI, PropertyResponse, ProcessSummaryResponse, getCurrentUserId } from "@/lib/api"
import Link from "next/link"

// Display status for UI
type DisplayStatus = "Pending" | "Processing" | "Completed" | "Failed";

interface DashboardProperty {
    id: string
    name: string
    subtitle: string
    image?: string
    status: "Pending" | "Completed" | "In Progress" // For PropertyList component
    displayStatus: DisplayStatus
    detailedStatus: string
    statusColor: string
    statusMessage: string
    clientName?: string
    closingDate?: string
    progress: number
    processId?: string // Added for fetching messages
}

// Status configuration with colors and messages
const STATUS_CONFIG: Record<string, { displayStatus: DisplayStatus; color: string; message: string; listStatus: "Pending" | "Completed" | "In Progress"; progress: number }> = {
    pending: {
        displayStatus: "Pending",
        color: "bg-gray-100 text-gray-700",
        message: "Preparing to start...",
        listStatus: "Pending",
        progress: 0
    },
    started: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Process started",
        listStatus: "In Progress",
        progress: 5
    },
    downloading: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Downloading documents...",
        listStatus: "In Progress",
        progress: 10
    },
    generating_messages: {
        displayStatus: "Processing",
        color: "bg-purple-100 text-purple-700",
        message: "Analyzing documents...",
        listStatus: "In Progress",
        progress: 50
    },
    storing_messages: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Saving messages...",
        listStatus: "In Progress",
        progress: 90
    },
    completed: {
        displayStatus: "Completed",
        color: "bg-emerald-100 text-emerald-700",
        message: "Process completed!",
        listStatus: "Completed",
        progress: 100
    },
    failed: {
        displayStatus: "Failed",
        color: "bg-red-100 text-red-700",
        message: "Process failed",
        listStatus: "Pending",
        progress: 0
    }
};

// Helper function to get status config
function getStatusConfig(processStatus: string | undefined) {
    if (!processStatus) {
        return STATUS_CONFIG.pending;
    }
    const status = processStatus.toLowerCase();
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}

export function PropertyEvaluationDashboard() {
    const [properties, setProperties] = useState<DashboardProperty[]>([])
    const [selectedProperty, setSelectedProperty] = useState<DashboardProperty | null>(null)
    const [showDetail, setShowDetail] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    // Fetch ALL properties from API with their process statuses
    const fetchPropertiesWithStatus = useCallback(async () => {
        try {
            const userId = getCurrentUserId()
            console.log('Dashboard: Fetching properties for userId:', userId)

            if (!userId) {
                console.log('Dashboard: No userId found, showing empty state')
                setProperties([])
                return
            }

            const apiProperties = await propertyAPI.getUserProperties(userId)
            console.log('Dashboard: Received', apiProperties.length, 'properties from API')

            // Fetch all processes for the user to get status info
            let processes: ProcessSummaryResponse[] = [];
            try {
                processes = await processAPI.getUserProcesses(userId);
            } catch (err) {
                console.log('Could not fetch processes, using default status');
            }

            // Create a map of property_id to process info (most recent)
            const processMap = new Map<string, ProcessSummaryResponse>();
            processes.forEach(proc => {
                const existing = processMap.get(proc.property_id);
                if (!existing || (proc.process_start && existing.process_start &&
                    new Date(proc.process_start) > new Date(existing.process_start))) {
                    processMap.set(proc.property_id, proc);
                }
            });

            // Transform ALL API properties to dashboard format with dynamic status
            const transformedProperties: DashboardProperty[] = apiProperties.map((prop: PropertyResponse) => {
                const process = processMap.get(prop.property_id);
                const statusConfig = getStatusConfig(process?.status);
                const progress = process?.progress ?? statusConfig.progress;

                return {
                    id: prop.property_id,
                    name: prop.property_name,
                    subtitle: prop.location,
                    image: undefined,
                    status: statusConfig.listStatus,
                    displayStatus: statusConfig.displayStatus,
                    detailedStatus: process?.status || "pending",
                    statusColor: statusConfig.color,
                    statusMessage: statusConfig.message,
                    clientName: prop.client_name,
                    closingDate: prop.property_closing_date || undefined,
                    progress: progress,
                    processId: process?.process_id,
                };
            });

            console.log('Dashboard: Displaying', transformedProperties.length, 'properties')
            setProperties(transformedProperties)
            setLastRefresh(new Date())

            // Update selected property if it exists
            if (selectedProperty) {
                const updated = transformedProperties.find(p => p.id === selectedProperty.id);
                if (updated) {
                    setSelectedProperty(updated);
                }
            } else if (transformedProperties.length > 0) {
                setSelectedProperty(transformedProperties[0])
            }
        } catch (err) {
            console.error('Dashboard: Error fetching properties:', err)
            setError(err instanceof Error ? err.message : 'Failed to load properties')
        }
    }, [selectedProperty])

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            setError(null)
            await fetchPropertiesWithStatus()
            setIsLoading(false)
        }
        loadData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Smart refresh - only poll when there are active processes
    useEffect(() => {
        // Check if any properties have active processing
        const hasActiveProcessing = properties.some(p =>
            p.detailedStatus &&
            ['pending', 'started', 'downloading', 'generating_messages', 'storing_messages'].includes(p.detailedStatus)
        );

        // Only set up polling if there are active processes
        if (!hasActiveProcessing) {
            return; // No active processes, don't poll
        }

        // Poll every 10 seconds when there are active processes
        const refreshInterval = setInterval(async () => {
            await fetchPropertiesWithStatus();
        }, 10000);

        return () => clearInterval(refreshInterval);
    }, [fetchPropertiesWithStatus, properties]);

    // Handler for property selection from list
    const handleSelectProperty = (property: { id: string; status: "Pending" | "Completed" | "In Progress" }) => {
        const fullProperty = properties.find(p => p.id === property.id);
        if (fullProperty) {
            setSelectedProperty(fullProperty);
        }
    };

    return (
        <div className="rounded-[32px] opacity-100 rotate-0">
            <div className="grid grid-cols-1 lg:grid-cols-[10fr_7fr] gap-4 lg:gap-[29px]">
                {/* Left Column - Property List */}
                <div className="bg-white w-full lg:h-[702px] rounded-[32px] p-[32px] flex flex-col opacity-100 rotate-0">
                    <div className="mb-[32px] flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
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
                            </div>
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/manage-properties/add-properties"
                                    className="group flex items-center justify-center gap-2 h-[40px] px-5 rounded-full bg-gradient-to-r from-[#00346C] to-[#0052A3] text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-[#002752] hover:to-[#00346C] transition-all duration-300"
                                >
                                    <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                                    <span>Add Property</span>
                                </Link>
                                <Link
                                    href="/manage-properties"
                                    className="flex items-center justify-center gap-2 h-[40px] rounded-full px-4 py-2 bg-white border border-[#E5E7EB] text-sm text-[#0C1D38] font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                                >
                                    View All
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
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
                            onSelectProperty={handleSelectProperty}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Right Column - Property Detail */}
                <div className="hidden lg:block w-full lg:h-[702px] rounded-[32px] opacity-100 rotate-0 overflow-y-auto relative">
                    <PropertyDetail property={selectedProperty} />
                </div>
            </div>
        </div>
    )
}
