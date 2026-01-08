"use client";
import React from 'react'
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';
import { PropertyDetailPanel } from '@/components/manage-properties/detail';
import { X } from 'lucide-react';

interface Property {
    id: number
    name: string
    location: string
    image: string
    type: string
    value: string
    closingDate: string
    status: "Pending" | "Completed"
    statusColor: string
}

interface PropertyDetail {
    id: number
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
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
    const totalPages = 9;

    const properties: Property[] = [
        {
            id: 1,
            name: "Wayland Beach House",
            location: "Wayland, MA",
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop",
            type: "Beach House",
            value: "$850,000",
            closingDate: "2024-02-15",
            status: "Pending",
            statusColor: "bg-amber-100 text-amber-800",
        },
        {
            id: 2,
            name: "Lakeside Retreat",
            location: "Lake Tahoe, CA",
            image: "https://images.unsplash.com/photo-1535202712071-c1b9a9b1df60?w=200&h=120&fit=crop",
            type: "Cabin",
            value: "$1,200,000",
            closingDate: "2024-03-20",
            status: "Completed",
            statusColor: "bg-emerald-100 text-emerald-800",
        },
        {
            id: 3,
            name: "Mountain View Lodge",
            location: "Aspen, CO",
            image: "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=200&h=120&fit=crop",
            type: "Lodge",
            value: "$2,500,000",
            closingDate: "2024-04-05",
            status: "Completed",
            statusColor: "bg-emerald-100 text-emerald-800",
        },
        {
            id: 4,
            name: "Urban Oasis",
            location: "New York, NY",
            image: "https://images.unsplash.com/photo-1613228060223-461bfa1220a0?w=200&h=120&fit=crop",
            type: "Apartment",
            value: "$3,500,000",
            closingDate: "2024-02-25",
            status: "Completed",
            statusColor: "bg-emerald-100 text-emerald-800",
        },
        {
            id: 5,
            name: "Seaside Villa",
            location: "Miami, FL",
            image: "https://images.unsplash.com/photo-1512917774080-9b274b5ce7c0?w=200&h=120&fit=crop",
            type: "Villa",
            value: "$4,800,000",
            closingDate: "2024-05-10",
            status: "Completed",
            statusColor: "bg-emerald-100 text-emerald-800",
        },
        {
            id: 6,
            name: "Countryside Cottage",
            location: "Napa Valley, CA",
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop",
            type: "Cottage",
            value: "$650,000",
            closingDate: "2024-03-15",
            status: "Completed",
            statusColor: "bg-emerald-100 text-emerald-800",
        },
    ];

    // Extended property details (simulated data)
    const propertyDetails: Record<number, PropertyDetail> = {
        1: {
            id: 1,
            name: "Wayland Beach House",
            address: "123 Ocean Drive, Wayland, MA 02481",
            type: "Beach House",
            value: "$850,000",
            client: "Johnson Family Trust",
            closingDays: 12,
            status: "Completed",
            documentsSubmitted: 4,
            documentsTotal: 4,
            aiAnalysisProgress: 85,
            totalIssues: 5,
            criticalIssues: 2,
        },
        2: {
            id: 2,
            name: "Lakeside Retreat",
            address: "456 Lake Shore, Lake Tahoe, CA 96150",
            type: "Cabin",
            value: "$1,200,000",
            client: "Smith Holdings LLC",
            closingDays: 25,
            status: "Completed",
            documentsSubmitted: 4,
            documentsTotal: 4,
            aiAnalysisProgress: 100,
            totalIssues: 3,
            criticalIssues: 0,
        },
        3: {
            id: 3,
            name: "Mountain View Lodge",
            address: "789 Alpine Way, Aspen, CO 81611",
            type: "Lodge",
            value: "$2,500,000",
            client: "Alpine Ventures",
            closingDays: 45,
            status: "Completed",
            documentsSubmitted: 4,
            documentsTotal: 4,
            aiAnalysisProgress: 100,
            totalIssues: 1,
            criticalIssues: 0,
        },
        4: {
            id: 4,
            name: "Urban Oasis",
            address: "100 Park Avenue, New York, NY 10016",
            type: "Apartment",
            value: "$3,500,000",
            client: "Manhattan Realty Group",
            closingDays: 30,
            status: "Completed",
            documentsSubmitted: 4,
            documentsTotal: 4,
            aiAnalysisProgress: 100,
            totalIssues: 2,
            criticalIssues: 1,
        },
        5: {
            id: 5,
            name: "Seaside Villa",
            address: "200 Ocean Blvd, Miami, FL 33139",
            type: "Villa",
            value: "$4,800,000",
            client: "Coastal Properties Inc",
            closingDays: 60,
            status: "Completed",
            documentsSubmitted: 4,
            documentsTotal: 4,
            aiAnalysisProgress: 100,
            totalIssues: 4,
            criticalIssues: 0,
        },
        6: {
            id: 6,
            name: "Countryside Cottage",
            address: "300 Vineyard Lane, Napa Valley, CA 94558",
            type: "Cottage",
            value: "$650,000",
            client: "Wine Country Estates",
            closingDays: 18,
            status: "Completed",
            documentsSubmitted: 3,
            documentsTotal: 4,
            aiAnalysisProgress: 75,
            totalIssues: 6,
            criticalIssues: 1,
        },
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectProperty = (property: Property) => {
        setSelectedProperty(property);
    };

    const handleCloseDetail = () => {
        setSelectedProperty(null);
    };

    const selectedDetail = selectedProperty ? propertyDetails[selectedProperty.id] : null;

    return (
        <div className="flex flex-col h-full">
            <PropertyListHeader />

            {/* Split View Layout */}
            <div className="flex-1 mt-4 flex gap-4 lg:gap-0 overflow-hidden">
                {/* Left Panel - Property List */}
                <div className={`bg-white rounded-[32px] p-4 lg:p-6 flex flex-col transition-all duration-300 ${selectedProperty
                        ? "hidden lg:flex lg:flex-1 lg:rounded-r-none"
                        : "flex-1"
                    }`}>
                    <h2 className="text-xl font-semibold text-[#0C1D38] mb-4">Property List</h2>
                    <PropertyList
                        properties={properties}
                        selectedPropertyId={selectedProperty?.id}
                        onSelectProperty={handleSelectProperty}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
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
