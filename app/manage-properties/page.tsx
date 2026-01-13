"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';
import { PropertyDetailPanel } from '@/components/manage-properties/detail';
import { AlertCircle, Loader2 } from 'lucide-react';
import { propertyAPI, processAPI, documentAPI, PropertyResponse, ProcessSummaryResponse, EngineResultResponse, MessageResponse, getCurrentUserId } from '@/lib/api';

// All possible process statuses from the workflow
type ProcessStatus = "pending" | "started" | "downloading" | "generating_messages" | "storing_messages" | "completed" | "failed";

// Display status for UI (simplified for badges)
type DisplayStatus = "Pending" | "Processing" | "Completed" | "Failed";

interface Property {
    id: string
    name: string
    location: string
    image?: string
    type?: string
    value?: string
    closingDate?: string
    status: DisplayStatus
    detailedStatus: string // Raw status from API
    statusColor: string
    statusMessage: string // User-friendly message
    clientName?: string
    processId?: string
    progress: number
    documentsSubmitted: number // Actual document count from API
}

interface PropertyDetail {
    id: string
    name: string
    address: string
    type: string
    value: string
    client: string
    closingDays: number
    status: "Pending" | "Completed"
    documentsSubmitted: number
    documentsTotal: number
    aiAnalysisProgress: number
    totalIssues: number
    criticalIssues: number
}

// Status configuration with colors and messages
const STATUS_CONFIG: Record<string, { displayStatus: DisplayStatus; color: string; message: string; progress: number }> = {
    pending: {
        displayStatus: "Pending",
        color: "bg-gray-100 text-gray-700",
        message: "Preparing to start...",
        progress: 0
    },
    started: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Process started",
        progress: 5
    },
    downloading: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Downloading documents...",
        progress: 10
    },
    generating_messages: {
        displayStatus: "Processing",
        color: "bg-purple-100 text-purple-700",
        message: "Analyzing documents...",
        progress: 50
    },
    storing_messages: {
        displayStatus: "Processing",
        color: "bg-blue-100 text-blue-700",
        message: "Saving messages...",
        progress: 90
    },
    completed: {
        displayStatus: "Completed",
        color: "bg-emerald-100 text-emerald-700",
        message: "Process completed!",
        progress: 100
    },
    failed: {
        displayStatus: "Failed",
        color: "bg-red-100 text-red-700",
        message: "Process failed",
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

// Helper function to map to display status for backward compatibility with PropertyList
function mapToListStatus(displayStatus: DisplayStatus): "Pending" | "Completed" | "In Progress" {
    switch (displayStatus) {
        case "Completed":
            return "Completed";
        case "Processing":
            return "In Progress";
        case "Failed":
            return "Pending"; // Show as pending in the list for failed
        case "Pending":
        default:
            return "Pending";
    }
}

const Page = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const itemsPerPage = 6;

    // Fetch properties and their process statuses from API
    const fetchPropertiesWithStatus = useCallback(async () => {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                setError('Please login to view your properties');
                setIsLoading(false);
                return;
            }

            // Fetch properties
            const apiProperties = await propertyAPI.getUserProperties(userId);

            // Fetch all processes for the user to get status info
            let processes: ProcessSummaryResponse[] = [];
            try {
                processes = await processAPI.getUserProcesses(userId);
            } catch (err) {
                console.log('Could not fetch processes, using default status');
            }

            // Create a map of property_id to process info (most recent process)
            const processMap = new Map<string, ProcessSummaryResponse>();
            processes.forEach(proc => {
                const existing = processMap.get(proc.property_id);
                if (!existing || (proc.process_start && existing.process_start &&
                    new Date(proc.process_start) > new Date(existing.process_start))) {
                    processMap.set(proc.property_id, proc);
                }
            });

            // Transform API response to component format with dynamic status
            // Also fetch document counts for each property
            const transformedProperties: Property[] = await Promise.all(
                apiProperties.map(async (prop: PropertyResponse) => {
                    const process = processMap.get(prop.property_id);
                    const statusConfig = getStatusConfig(process?.status);
                    const progress = process?.progress ?? statusConfig.progress;

                    // Fetch document count for this property
                    let documentsSubmitted = 0;
                    try {
                        const docs = await documentAPI.getPropertyDocuments(userId, prop.property_id);
                        // docs could be an array or object with documents
                        if (Array.isArray(docs)) {
                            documentsSubmitted = docs.length;
                        } else if (docs && typeof docs === 'object') {
                            // If it's an object with a documents array
                            documentsSubmitted = (docs as any).documents?.length || (docs as any).length || 0;
                        }
                    } catch (err) {
                        // If documents can't be fetched, check if process started (means docs were uploaded)
                        if (process && process.status !== 'pending') {
                            documentsSubmitted = 2; // Assume both docs uploaded if process started
                        }
                    }

                    return {
                        id: prop.property_id,
                        name: prop.property_name,
                        location: prop.location,
                        image: undefined,
                        type: undefined,
                        closingDate: prop.property_closing_date ? new Date(prop.property_closing_date).toLocaleDateString() : undefined,
                        status: statusConfig.displayStatus,
                        detailedStatus: process?.status || "pending",
                        statusColor: statusConfig.color,
                        statusMessage: statusConfig.message,
                        clientName: prop.client_name,
                        processId: process?.process_id,
                        progress: progress,
                        documentsSubmitted: documentsSubmitted,
                    };
                })
            );

            setProperties(transformedProperties);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('Error fetching properties:', err);
            setError(err instanceof Error ? err.message : 'Failed to load properties');
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            await fetchPropertiesWithStatus();
            setIsLoading(false);
        };
        loadData();
    }, [fetchPropertiesWithStatus]);

    // Auto-refresh every 1 minute (60000ms)
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            console.log('Auto-refreshing status at:', new Date().toISOString());
            await fetchPropertiesWithStatus();

            // Update selected property if it exists
            if (selectedProperty) {
                setSelectedProperty(prev => {
                    if (!prev) return null;
                    const updated = properties.find(p => p.id === prev.id);
                    return updated || prev;
                });
            }
        }, 60000); // Poll every 1 minute

        return () => clearInterval(refreshInterval);
    }, [fetchPropertiesWithStatus, selectedProperty, properties]);

    // Download AI-generated report for a property
    const handleDownload = useCallback(async (propertyId: string, processId?: string) => {
        const userId = getCurrentUserId();
        if (!userId) {
            setDownloadError('Please login to download reports');
            return;
        }

        setIsDownloading(true);
        setDownloadError(null);

        try {
            // Find the property to get process info
            const property = properties.find(p => p.id === propertyId);
            const propProcessId = processId || property?.processId;

            if (!propProcessId) {
                alert('No processing has been completed for this property yet. Please wait for the AI analysis to complete.');
                setIsDownloading(false);
                return;
            }

            // Check if process is completed
            if (property?.detailedStatus !== 'completed') {
                alert(`Processing is still ${property?.statusMessage || 'in progress'}. Please wait for the AI analysis to complete before downloading.`);
                setIsDownloading(false);
                return;
            }

            // Fetch engine results (AI analysis)
            let engineResults: EngineResultResponse[] = [];
            try {
                engineResults = await processAPI.getEngineResults(propProcessId);
            } catch (err) {
                console.log('Could not fetch engine results:', err);
            }

            // Fetch generated messages
            let messages: MessageResponse[] = [];
            try {
                messages = await processAPI.getMessages(propProcessId);
            } catch (err) {
                console.log('Could not fetch messages:', err);
            }

            // Get process status
            let processStatus = null;
            try {
                processStatus = await processAPI.getStatus(propProcessId);
            } catch (err) {
                console.log('Could not fetch process status:', err);
            }

            // Check if we have any results to download
            if (engineResults.length === 0 && messages.length === 0) {
                alert('No AI analysis results available yet. The processing may still be in progress.');
                setIsDownloading(false);
                return;
            }

            // Create the report object
            const report = {
                propertyName: property?.name || 'Unknown Property',
                propertyLocation: property?.location || 'Unknown Location',
                clientName: property?.clientName || 'N/A',
                generatedAt: new Date().toISOString(),
                processStatus: processStatus?.status || 'unknown',
                processProgress: processStatus?.progress || 0,
                engineResults: engineResults.map(result => ({
                    resultId: result.engine_result_id,
                    documentId: result.doc_id,
                    status: result.status,
                    analysisPreview: result.json_result_preview,
                })),
                messages: messages.map(msg => ({
                    messageId: msg.message_id,
                    text: msg.message_text,
                    status: msg.status,
                    scheduledFor: msg.scheduled_for,
                    createdAt: msg.created_at,
                })),
            };

            // Create a downloadable blob
            const reportJson = JSON.stringify(report, null, 2);
            const blob = new Blob([reportJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${property?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'property'}_report_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error downloading report:', err);
            setDownloadError(err instanceof Error ? err.message : 'Failed to download report');
            alert('Could not download report. Please try again later.');
        } finally {
            setIsDownloading(false);
        }
    }, [properties]);

    // Delete a property
    const handleDelete = useCallback(async (propertyId: string) => {
        const userId = getCurrentUserId();
        if (!userId) {
            setError('Please login to delete properties');
            return;
        }

        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
            return;
        }

        try {
            await propertyAPI.delete(userId, propertyId);

            // Remove from local state
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            setSelectedProperty(null);

        } catch (err) {
            console.error('Error deleting property:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete property');
        }
    }, []);

    // Filter properties based on search query and status
    const filteredProperties = useMemo(() => {
        return properties.filter(property => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === '' ||
                property.name.toLowerCase().includes(searchLower) ||
                property.location.toLowerCase().includes(searchLower) ||
                (property.clientName && property.clientName.toLowerCase().includes(searchLower));

            // Status filter - map display status to filter options
            let matchesStatus = statusFilter === 'All Status';
            if (!matchesStatus) {
                const listStatus = mapToListStatus(property.status);
                matchesStatus = listStatus === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });
    }, [properties, searchQuery, statusFilter]);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Transform properties for PropertyList component (needs specific status type)
    const listProperties = paginatedProperties.map(p => ({
        ...p,
        status: mapToListStatus(p.status),
    }));

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Generate property details for selected property
    const selectedDetail: PropertyDetail | null = selectedProperty ? {
        id: selectedProperty.id,
        name: selectedProperty.name,
        address: selectedProperty.location,
        type: selectedProperty.type || "Property",
        value: selectedProperty.value || "N/A",
        client: selectedProperty.clientName || "N/A",
        closingDays: selectedProperty.closingDate ? Math.max(0, Math.ceil((new Date(selectedProperty.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
        status: selectedProperty.status === "Completed" ? "Completed" : "Pending",
        documentsSubmitted: selectedProperty.documentsSubmitted,
        documentsTotal: 2,
        aiAnalysisProgress: selectedProperty.progress,
        totalIssues: 0,
        criticalIssues: 0,
    } : null;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectProperty = (property: Property | { id: string; status: "Pending" | "Completed" | "In Progress" }) => {
        // Find the full property from our state
        const fullProperty = properties.find(p => p.id === property.id);
        if (fullProperty) {
            setSelectedProperty(fullProperty);
        }
    };

    const handleCloseDetail = () => {
        setSelectedProperty(null);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
    };

    return (
        <div className="flex flex-col h-full">
            <PropertyListHeader
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={handleStatusFilterChange}
            />

            {/* Error Message */}
            {error && (
                <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {/* Download Error Message */}
            {downloadError && (
                <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-amber-700 text-sm">{downloadError}</p>
                    <button
                        onClick={() => setDownloadError(null)}
                        className="ml-auto text-amber-600 hover:text-amber-800"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Last Refresh Indicator */}
            <div className="mx-4 mt-1 text-[10px] text-gray-400 flex items-center gap-2">
                <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
                <span>• Auto-refreshes every minute</span>
            </div>

            {/* Split View Layout */}
            <div className="flex-1 mt-2 flex gap-4 lg:gap-0 min-h-0">
                {/* Left Panel - Property List */}
                <div className={`bg-white rounded-[24px] p-3 lg:p-4 flex flex-col transition-all duration-300 overflow-hidden ${selectedProperty
                    ? "hidden lg:flex lg:flex-1 lg:rounded-r-none"
                    : "flex-1"
                    }`}>
                    <h2 className="text-lg font-semibold text-[#0C1D38] mb-2 flex-shrink-0">
                        Property List
                        {filteredProperties.length > 0 && (
                            <span className="text-xs font-normal text-gray-500 ml-2">
                                ({filteredProperties.length})
                            </span>
                        )}
                    </h2>
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <PropertyList
                            properties={listProperties}
                            selectedPropertyId={selectedProperty?.id}
                            onSelectProperty={handleSelectProperty}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            isLoading={isLoading}
                        />
                    </div>
                </div>

                {/* Right Panel - Property Detail */}
                {selectedProperty && selectedDetail && (
                    <>
                        {/* Desktop Detail Panel */}
                        <div className="hidden lg:block w-[609px] flex-shrink-0">
                            <PropertyDetailPanel
                                property={selectedDetail}
                                onClose={handleCloseDetail}
                                onEdit={() => console.log("Edit clicked")}
                                onDownload={() => handleDownload(selectedProperty.id)}
                                onDelete={() => handleDelete(selectedProperty.id)}
                            />
                            {isDownloading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            )}
                        </div>

                        {/* Mobile Full-Screen Overlay */}
                        <div className="lg:hidden fixed inset-0 z-50 bg-white">
                            <div className="h-full">
                                <PropertyDetailPanel
                                    property={selectedDetail}
                                    onClose={handleCloseDetail}
                                    onEdit={() => console.log("Edit clicked")}
                                    onDownload={() => handleDownload(selectedProperty.id)}
                                    onDelete={() => handleDelete(selectedProperty.id)}
                                />
                                {isDownloading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Page
