"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';
import { PropertyDetailPanel } from '@/components/manage-properties/detail';
import { AlertCircle, Loader2, X, Upload, FileText, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { propertyAPI, processAPI, documentAPI, PropertyResponse, ProcessSummaryResponse, EngineResultResponse, MessageResponse, getCurrentUserId } from '@/lib/api';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import NegotiatedWinsForm from '@/components/manage-properties/negotiated-wins-form';

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
    closingDate?: string
    status: DisplayStatus
    detailedStatus: string // Raw status from API
    statusColor: string
    statusMessage: string // User-friendly message
    clientName?: string
    processId?: string
    progress: number
    documentsSubmitted: number // Actual document count from API
    createdAt?: string // Added
    yearBuilt?: number
    squareFootage?: number
    bedrooms?: number
    bathrooms?: number
    lotSize?: number
    propertyType?: string
    purchasePrice?: number
    purchaseDate?: string
    city?: string
    state?: string
    zipCode?: string
    negotiatedWins?: string
}

interface PropertyDetail {
    id: string
    name: string
    address: string
    location: string
    type: string
    client: string
    closingDays: number
    status: DisplayStatus
    documentsSubmitted: number
    documentsTotal: number
    aiAnalysisProgress: number
    totalIssues: number
    criticalIssues: number
    statusMessage?: string
    processId?: string
    createdAt?: string // Added
    yearBuilt?: number
    squareFootage?: number
    bedrooms?: number
    bathrooms?: number
    lotSize?: number
    propertyType?: string
    purchasePrice?: number
    purchaseDate?: string
    city?: string
    state?: string
    zipCode?: string
}

// Status configuration with colors and messages
const STATUS_CONFIG: Record<string, { displayStatus: DisplayStatus; color: string; message: string; progress: number }> = {
    pending: { displayStatus: "Pending", color: "bg-gray-100 text-gray-700", message: "Preparing to start...", progress: 0 },
    started: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Process started", progress: 5 },
    downloading: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Downloading documents...", progress: 10 },
    generating_messages: { displayStatus: "Processing", color: "bg-purple-100 text-purple-700", message: "Analyzing documents...", progress: 50 },
    storing_messages: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Saving messages...", progress: 90 },
    completed: { displayStatus: "Completed", color: "bg-emerald-100 text-emerald-700", message: "Process completed!", progress: 100 },
    failed: { displayStatus: "Failed", color: "bg-red-100 text-red-700", message: "Process failed", progress: 0 },
    insufficient_credits: { displayStatus: "Failed", color: "bg-amber-100 text-amber-700", message: "AI credits exhausted", progress: 50 },
    paused: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Process paused", progress: 50 },
    in_progress: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Processing documents...", progress: 30 },
    processing: { displayStatus: "Processing", color: "bg-blue-100 text-blue-700", message: "Processing documents...", progress: 30 },
    error: { displayStatus: "Failed", color: "bg-red-100 text-red-700", message: "Analysis error", progress: 0 },
};

// Helper function to get status config
function getStatusConfig(processStatus: string | undefined) {
    if (!processStatus) {
        return STATUS_CONFIG.pending;
    }
    const status = processStatus.toLowerCase();
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
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

    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editFourPointFile, setEditFourPointFile] = useState<File | null>(null);
    const [editHomeInspectionFile, setEditHomeInspectionFile] = useState<File | null>(null);
    const [editNegotiatedWins, setEditNegotiatedWins] = useState<string>('');

    // Delete confirmation modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Show toast helper
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const itemsPerPage = 25;

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
            const apiProperties = await propertyAPI.getUserProperties();

            // Fetch all processes for the user to get status info
            let processes: ProcessSummaryResponse[] = [];
            try {
                processes = await processAPI.getUserProcesses();
            } catch (err) {
                console.log('Could not fetch processes, using default status');
            }

            // Create a map of property_id to process info (most recent process)
            const processMap = new Map();
            processes.forEach(proc => {
                const existing = processMap.get(proc.property_id);
                if (!existing || (proc.process_start && existing.process_start && new Date(proc.process_start) > new Date(existing.process_start))) {
                    processMap.set(proc.property_id, proc);
                }
            });

            // Transform API response to component format with dynamic status
            // Document count is inferred from process status to avoid N+1 API calls
            const transformedProperties: Property[] = apiProperties.map((prop: PropertyResponse) => {
                const process = processMap.get(prop.property_id);
                const statusConfig = getStatusConfig(process?.status);
                const progress = process?.progress ?? statusConfig.progress;

                // Infer document count from process presence
                // If a process record exists, it means the upload phase has completed
                let documentsSubmitted = 0;
                if (process) {
                    documentsSubmitted = 2; // Assume both uploaded if process exists
                }

                return {
                    id: prop.property_id,
                    name: prop.address || prop.property_name,
                    location: prop.location,
                    image: undefined,
                    type: undefined,
                    closingDate: prop.purchase_date ? new Date(prop.purchase_date).toLocaleDateString() : undefined,
                    createdAt: process?.process_start ? new Date(process.process_start).toLocaleDateString() : undefined, // Map from process_start
                    status: statusConfig.displayStatus,
                    detailedStatus: process?.status || "pending",
                    statusColor: statusConfig.color,
                    statusMessage: statusConfig.message,
                    clientName: prop.client_name,
                    processId: process?.process_id,
                    progress: progress,
                    documentsSubmitted: documentsSubmitted,
                    yearBuilt: prop.year_built ?? undefined,
                    squareFootage: prop.square_footage ?? undefined,
                    bedrooms: prop.bedrooms ?? undefined,
                    bathrooms: prop.bathrooms ?? undefined,
                    lotSize: prop.lot_size ?? undefined,
                    propertyType: prop.property_type ?? undefined,
                    purchasePrice: prop.purchase_price ?? undefined,
                    purchaseDate: prop.purchase_date ?? undefined,
                    city: prop.city ?? undefined,
                    state: prop.state ?? undefined,
                    zipCode: prop.zip_code ?? undefined,
                    negotiatedWins: prop.negotiated_wins ?? undefined,
                };
            });

            setProperties(transformedProperties);
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

    // Use ref to track if there are active processes (avoids stale closure)
    const hasActiveProcessRef = React.useRef(false);

    // All statuses that indicate an active/in-progress process (not completed or failed)
    const ACTIVE_STATUSES = ['pending', 'started', 'downloading', 'generating_messages', 'storing_messages', 'in_progress', 'processing'];

    // Update the ref whenever properties change
    useEffect(() => {
        const hasActive = properties.some(p =>
            p.detailedStatus && ACTIVE_STATUSES.includes(p.detailedStatus)
        );
        hasActiveProcessRef.current = hasActive;
        console.log('Active process check:', hasActive, 'statuses:', properties.map(p => p.detailedStatus));
    }, [properties]);

    // Always running polling - checks ref for active processes
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            // Check ref (not stale closure) for active processes
            if (hasActiveProcessRef.current) {
                console.log('Polling: Active process detected, fetching fresh data...');
                await fetchPropertiesWithStatus();
            }
        }, 30000); // 30 seconds - only polls when there are active processes

        return () => clearInterval(pollInterval);
    }, [fetchPropertiesWithStatus]);

    // Keep selectedProperty in sync with properties
    useEffect(() => {
        if (selectedProperty) {
            const updated = properties.find(p => p.id === selectedProperty.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProperty)) {
                console.log('Sync: Updating selectedProperty with latest data');
                setSelectedProperty(updated);
            }
        }
    }, [properties, selectedProperty]);

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

            // Fetch generated messages
            let messages: MessageResponse[] = [];
            try {
                messages = await processAPI.getMessages(propProcessId);
            } catch (err) {
                console.log('Could not fetch messages:', err);
            }

            // Check if we have any results to download
            if (messages.length === 0) {
                alert('No AI analysis results available yet. The processing may still be in progress.');
                setIsDownloading(false);
                return;
            }

            // 1. Sort messages by scheduled_for date
            const sortedMessages = [...messages].sort((a, b) => {
                const dateA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : 0;
                const dateB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : 0;
                return dateA - dateB;
            });

            // 2. Group messages by year
            const messagesByYear: Record<string, MessageResponse[]> = {};
            sortedMessages.forEach(msg => {
                const year = msg.scheduled_for ? new Date(msg.scheduled_for).getFullYear().toString() : 'Scheduled';
                if (!messagesByYear[year]) messagesByYear[year] = [];
                messagesByYear[year].push(msg);
            });

            const years = Object.keys(messagesByYear).sort();
            const startYear = years.length > 0 ? years[0] : new Date().getFullYear().toString();
            const endYear = years.length > 0 ? years[years.length - 1] : new Date().getFullYear().toString();

            // 3. Create DOCX structure
            const docSections: any[] = [];

            // Header Section
            docSections.push(
                new Paragraph({
                    text: "Realtor Alert",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Client Name: ", bold: true }),
                        new TextRun(property?.clientName || "N/A"),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Plan Duration: ", bold: true }),
                        new TextRun(`${startYear} – ${endYear}`),
                    ],
                    spacing: { after: 600 },
                })
            );

            // Yearly Sections
            years.forEach(year => {
                docSections.push(
                    new Paragraph({
                        text: `${year} Scheduled Touchpoints`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 300 },
                    })
                );

                // Touchpoint Items
                messagesByYear[year].forEach(msg => {
                    // Resolve priority from realtor_alert.priority (string) first
                    let priorityValue: number | null = null;
                    const alertPriority = msg.realtor_alert?.priority;
                    if (alertPriority && typeof alertPriority === 'string') {
                        const p = alertPriority.toLowerCase();
                        priorityValue = p === 'critical' ? 1 : p === 'high' ? 2 : p === 'medium' ? 3 : 4;
                    } else if (msg.priority_level != null) {
                        priorityValue = msg.priority_level;
                    }
                    priorityValue = priorityValue || 3;
                    const priority = (priorityValue === 1 || priorityValue === 2) ? "High" :
                        priorityValue === 3 ? "Medium" : "Low";

                    const dateStr = msg.scheduled_for
                        ? new Date(msg.scheduled_for).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : "N/A";

                    // Extract realtor_alert fields
                    const alertTitle = msg.realtor_alert?.title || `${priority} Maintenance Alert - ${dateStr}`;
                    const realtorContext = msg.realtor_alert?.body?.realtor_context || "AI-generated insights and recommendations for professional follow-up.";
                    const referrals = msg.realtor_alert?.body?.referrals;

                    const paragraphs: typeof docSections = [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Date: ", bold: true }),
                                new TextRun(dateStr),
                            ],
                            spacing: { before: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Title: ", bold: true }),
                                new TextRun(alertTitle),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Trigger: ", bold: true }),
                                new TextRun(msg.trigger || "N/A"),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Priority: ", bold: true }),
                                new TextRun(priority),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Realtor Context: ", bold: true }),
                                new TextRun(realtorContext),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Client Message: ", bold: true }),
                                new TextRun(msg.message_text),
                            ],
                            spacing: { after: referrals && referrals.trim() ? 100 : 400 },
                        }),
                    ];

                    // Add referrals section if not empty
                    if (referrals && referrals.trim()) {
                        paragraphs.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: "Referrals:", bold: true }),
                                ],
                                spacing: { before: 100 },
                            }),
                        );
                        // Split referrals by newline and add each as a separate paragraph
                        const referralLines = referrals.split('\n').filter((line: string) => line.trim());
                        referralLines.forEach((line: string) => {
                            paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: line.trim() }),
                                    ],
                                    spacing: { before: 40 },
                                }),
                            );
                        });
                        // Add spacing after the last referral line
                        paragraphs.push(
                            new Paragraph({
                                text: "",
                                spacing: { after: 300 },
                            }),
                        );
                    }

                    // Add separator
                    paragraphs.push(
                        new Paragraph({
                            text: "________________________________________________________________________________",
                            spacing: { after: 200 },
                        })
                    );

                    docSections.push(...paragraphs);
                });
            });

            // Create the document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docSections,
                }],
            });

            // Pack and download
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);

            // Create download link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${property?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'property'}_Realtor_Alert.docx`;
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

    // Open delete confirmation modal
    const openDeleteModal = (propertyId: string) => {
        setPropertyToDelete(propertyId);
        setIsDeleteModalOpen(true);
    };

    // Confirm and execute delete
    const confirmDelete = useCallback(async () => {
        if (!propertyToDelete) return;

        const userId = getCurrentUserId();
        if (!userId) {
            showToast('Please login to delete properties', 'error');
            setIsDeleteModalOpen(false);
            return;
        }

        setIsDeleting(true);

        try {
            // Delete from backend API
            await propertyAPI.delete(propertyToDelete);

            // Remove from local state after successful API delete
            setProperties(prev => prev.filter(p => p.id !== propertyToDelete));
            setSelectedProperty(null);
            showToast('Property deleted successfully!', 'success');
        } catch (err) {
            console.error('Error deleting property:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            showToast('Failed to delete property: ' + errorMessage, 'error');
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setPropertyToDelete(null);
        }
    }, [propertyToDelete]);

    // Open restart process modal
    const handleOpenEditModal = useCallback((property: Property) => {
        setEditFourPointFile(null);
        setEditHomeInspectionFile(null);
        // Find the full property data to get negotiated_wins
        const fullProperty = properties.find(p => p.id === property.id);
        setEditNegotiatedWins(fullProperty?.negotiatedWins || '');
        setIsEditModalOpen(true);
    }, [properties]);

    const handleSavePropertyEdit = useCallback(async () => {
        if (!selectedProperty) return;

        const userId = getCurrentUserId();
        if (!userId) {
            setError('Please login to edit properties');
            return;
        }

        setIsSavingEdit(true);

        try {
            // Update negotiated wins if changed
            if (editNegotiatedWins !== selectedProperty.negotiatedWins) {
                await propertyAPI.update(selectedProperty.id, {
                    negotiated_wins: editNegotiatedWins || null,
                });
            }

            // Check if any documents are being uploaded
            const filesToUpload: File[] = [];
            const docTypes: ('4point' | 'home_inspection')[] = [];

            if (editFourPointFile) {
                filesToUpload.push(editFourPointFile);
                docTypes.push('4point');
            }
            if (editHomeInspectionFile) {
                filesToUpload.push(editHomeInspectionFile);
                docTypes.push('home_inspection');
            }

            if (filesToUpload.length > 0) {
                // Use the new resetAndReprocess API which handles everything in one call:
                // - Deletes all existing documents
                // - Uploads new documents
                // - Starts processing pipeline
                await propertyAPI.resetAndReprocess(selectedProperty.id, filesToUpload, docTypes);
            }

            // Refresh properties list
            await fetchPropertiesWithStatus();

            setIsEditModalOpen(false);
            setEditFourPointFile(null);
            setEditHomeInspectionFile(null);
            setEditNegotiatedWins('');
            
            if (filesToUpload.length > 0) {
                showToast('Property updated and processing restarted!', 'success');
            } else {
                showToast('Property updated successfully!', 'success');
            }
        } catch (err) {
            console.error('Error updating property:', err);
            showToast(err instanceof Error ? err.message : 'Failed to update property. Please try again.', 'error');
        } finally {
            setIsSavingEdit(false);
        }
    }, [selectedProperty, editFourPointFile, editHomeInspectionFile, editNegotiatedWins, fetchPropertiesWithStatus]);

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
                matchesStatus = property.status === statusFilter;
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
    const listProperties = paginatedProperties;

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Generate property details for selected property
    // Note: documentsTotal is set to actual submitted count so 1/1 or 2/2 both show as complete
    const selectedDetail: PropertyDetail | null = selectedProperty ? {
        id: selectedProperty.id,
        name: selectedProperty.name,
        address: selectedProperty.name, // The user wants full address, which is property_name/name
        location: selectedProperty.location,
        type: selectedProperty.type || "Property",
        client: selectedProperty.clientName || "N/A",
        closingDays: selectedProperty.closingDate
            ? Math.max(0, Math.ceil((new Date(selectedProperty.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : 0,
        status: selectedProperty.status,
        documentsSubmitted: selectedProperty.documentsSubmitted,
        documentsTotal: 2, // Fixed: Always 2 (4-Point and Home Inspection)
        aiAnalysisProgress: selectedProperty.progress,
        totalIssues: 0,
        criticalIssues: 0,
        statusMessage: selectedProperty.statusMessage,
        processId: selectedProperty.processId,
        createdAt: selectedProperty.createdAt,
        yearBuilt: selectedProperty.yearBuilt,
        squareFootage: selectedProperty.squareFootage,
        bedrooms: selectedProperty.bedrooms,
        bathrooms: selectedProperty.bathrooms,
        lotSize: selectedProperty.lotSize,
        propertyType: selectedProperty.propertyType,
        purchasePrice: selectedProperty.purchasePrice,
        purchaseDate: selectedProperty.purchaseDate,
        city: selectedProperty.city,
        state: selectedProperty.state,
        zipCode: selectedProperty.zipCode,
    } : null;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectProperty = (property: { id: string }) => {
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
        <div className="h-full bg-gray-50">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Download Error Message */}
            {downloadError && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                        <p className="text-amber-700">{downloadError}</p>
                        <button
                            onClick={() => setDownloadError(null)}
                            className="ml-auto text-amber-600 hover:text-amber-800"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Split View Layout */}
            <div className="flex h-full overflow-hidden">
                {/* Left Panel - Property List */}
                <div className={`flex flex-col bg-white transition-all duration-300 ${selectedProperty
                    ? 'hidden lg:flex lg:w-1/2 border-r border-gray-200'
                    : 'w-full'
                    }`}>
                    <div className="p-4 md:p-6 border-b border-gray-200">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                            Property List
                            {filteredProperties.length > 0 && (
                                <span className="text-base font-normal text-gray-500 ml-2">
                                    ({filteredProperties.length})
                                </span>
                            )}
                        </h1>
                    </div>
                    <PropertyListHeader
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        statusFilter={statusFilter}
                        onStatusFilterChange={handleStatusFilterChange}
                    />
                    <PropertyList
                        properties={listProperties}
                        isLoading={isLoading}
                        onSelectProperty={handleSelectProperty}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>

                {/* Right Panel - Property Detail */}
                {selectedProperty && selectedDetail && (
                    <>
                        {/* Desktop Detail Panel - FIXED: Added overflow-y-auto */}
                        <div className="hidden lg:flex lg:flex-col w-1/2 bg-gray-50 overflow-y-auto">
                            <PropertyDetailPanel
                                property={selectedDetail}
                                onClose={handleCloseDetail}
                                onEdit={() => handleOpenEditModal(selectedProperty)}
                                onDownload={() => handleDownload(selectedProperty.id)}
                                onDelete={() => openDeleteModal(selectedProperty.id)}
                            />
                            {isDownloading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            )}
                        </div>

                        {/* Mobile Full-Screen Overlay - FIXED: Added overflow-y-auto */}
                        <div className="lg:hidden fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
                            <PropertyDetailPanel
                                property={selectedDetail}
                                onClose={handleCloseDetail}
                                onEdit={() => handleOpenEditModal(selectedProperty)}
                                onDownload={() => handleDownload(selectedProperty.id)}
                                onDelete={() => openDeleteModal(selectedProperty.id)}
                            />
                            {isDownloading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Edit Property Modal */}
            {isEditModalOpen && selectedProperty && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-900">Edit Property</h2>
                            <p className="text-sm text-gray-500">Upload new documents to update the property</p>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Property Info Display */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">{selectedProperty.name}</h3>
                                <p className="text-sm text-gray-600">{selectedProperty.location}</p>
                                {selectedProperty.clientName && (
                                    <p className="text-sm text-gray-600 mt-1">Client: {selectedProperty.clientName}</p>
                                )}
                            </div>

                            {/* Negotiated Wins Section */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Negotiated Wins</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Update the negotiated wins for this property
                                </p>
                                <NegotiatedWinsForm
                                    value={editNegotiatedWins}
                                    onChange={setEditNegotiatedWins}
                                    disabled={isSavingEdit}
                                />
                            </div>

                            {/* Document Upload Section */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Upload Documents (Optional)</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {(editFourPointFile ? 1 : 0) + (editHomeInspectionFile ? 1 : 0)} document(s) selected
                                </p>
                                <p className="text-xs text-amber-600 mb-4">
                                    Upload documents to restart the processing pipeline
                                </p>

                                {/* 4-Point File Upload */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        4-Point Inspection Report
                                    </label>
                                    <input
                                        type="file"
                                        id="edit-fourpoint-upload"
                                        accept=".pdf"
                                        onChange={(e) => e.target.files && setEditFourPointFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                    {!editFourPointFile ? (
                                        <button
                                            onClick={() => document.getElementById('edit-fourpoint-upload')?.click()}
                                            className="w-full h-[100px] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
                                        >
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <span className="text-sm text-gray-600">4-Point File</span>
                                        </button>
                                    ) : (
                                        <div className="relative p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <button
                                                onClick={() => setEditFourPointFile(null)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                            <FileText className="h-6 w-6 text-blue-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-900">{editFourPointFile.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Home Inspection File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Home Inspection Report
                                    </label>
                                    <input
                                        type="file"
                                        id="edit-homeinspection-upload"
                                        accept=".pdf"
                                        onChange={(e) => e.target.files && setEditHomeInspectionFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                    {!editHomeInspectionFile ? (
                                        <button
                                            onClick={() => document.getElementById('edit-homeinspection-upload')?.click()}
                                            className="w-full h-[100px] rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center gap-2"
                                        >
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <span className="text-sm text-gray-600">Home Inspection</span>
                                        </button>
                                    ) : (
                                        <div className="relative p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <button
                                                onClick={() => setEditHomeInspectionFile(null)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                            <FileText className="h-6 w-6 text-blue-600 mb-2" />
                                            <p className="text-sm font-medium text-gray-900">{editHomeInspectionFile.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1"
                                disabled={isSavingEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSavePropertyEdit}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isSavingEdit}
                            >
                                {isSavingEdit ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Property</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete this property? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setPropertyToDelete(null);
                                    }}
                                    className="flex-1"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmDelete}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </span>
                                    ) : (
                                        'Delete'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 ${toast.type === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? (
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <AlertCircle className="w-6 h-6" />
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    )
}

export default Page