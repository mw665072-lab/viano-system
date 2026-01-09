"use client";
import React, { useEffect, useState, useMemo } from 'react'
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';
import { PropertyDetailPanel } from '@/components/manage-properties/detail';
import { AlertCircle } from 'lucide-react';
import { propertyAPI, PropertyResponse, getCurrentUserId } from '@/lib/api';

interface Property {
    id: string
    name: string
    location: string
    image?: string
    type?: string
    value?: string
    closingDate?: string
    status: "Pending" | "Completed"
    statusColor: string
    clientName?: string
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

const Page = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');

    const itemsPerPage = 6;

    // Fetch properties from API on mount
    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const userId = getCurrentUserId();
                if (!userId) {
                    setError('Please login to view your properties');
                    setIsLoading(false);
                    return;
                }

                const apiProperties = await propertyAPI.getUserProperties(userId);

                // Transform API response to component format
                const transformedProperties: Property[] = apiProperties.map((prop: PropertyResponse) => ({
                    id: prop.property_id,
                    name: prop.property_name,
                    location: prop.location,
                    image: undefined, // API doesn't provide images
                    type: undefined, // API doesn't provide type
                    closingDate: prop.property_closing_date ? new Date(prop.property_closing_date).toLocaleDateString() : undefined,
                    status: "Pending" as const, // Default status, can be updated based on process status
                    statusColor: "bg-amber-100 text-amber-800",
                    clientName: prop.client_name,
                }));

                setProperties(transformedProperties);
            } catch (err) {
                console.error('Error fetching properties:', err);
                setError(err instanceof Error ? err.message : 'Failed to load properties');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
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

            // Status filter
            const matchesStatus = statusFilter === 'All Status' ||
                property.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [properties, searchQuery, statusFilter]);

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredProperties.length / itemsPerPage));
    const paginatedProperties = filteredProperties.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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
        status: selectedProperty.status,
        documentsSubmitted: 0,
        documentsTotal: 4,
        aiAnalysisProgress: 0,
        totalIssues: 0,
        criticalIssues: 0,
    } : null;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectProperty = (property: Property) => {
        setSelectedProperty(property);
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

            {/* Split View Layout */}
            <div className="flex-1 mt-4 flex gap-4 lg:gap-0 overflow-hidden">
                {/* Left Panel - Property List */}
                <div className={`bg-white rounded-[32px] p-4 lg:p-6 flex flex-col transition-all duration-300 ${selectedProperty
                    ? "hidden lg:flex lg:flex-1 lg:rounded-r-none"
                    : "flex-1"
                    }`}>
                    <h2 className="text-xl font-semibold text-[#0C1D38] mb-4">
                        Property List
                        {filteredProperties.length > 0 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'})
                            </span>
                        )}
                    </h2>
                    <PropertyList
                        properties={paginatedProperties}
                        selectedPropertyId={selectedProperty?.id}
                        onSelectProperty={handleSelectProperty}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                    />
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
                                onDownload={() => console.log("Download clicked")}
                                onDelete={() => console.log("Delete clicked")}
                            />
                        </div>

                        {/* Mobile Full-Screen Overlay */}
                        <div className="lg:hidden fixed inset-0 z-50 bg-white">
                            <div className="h-full">
                                <PropertyDetailPanel
                                    property={selectedDetail}
                                    onClose={handleCloseDetail}
                                    onEdit={() => console.log("Edit clicked")}
                                    onDownload={() => console.log("Download clicked")}
                                    onDelete={() => console.log("Delete clicked")}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Page
