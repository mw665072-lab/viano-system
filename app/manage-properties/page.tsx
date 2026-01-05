"use client";
import { PageHeader } from '@/common/header'
import React from 'react'
import { useRouter } from 'next/navigation';
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';

const Page = () => {
    const router = useRouter();
    const [currentPage, setCurrentPage] = React.useState(1);
    const totalPages = 3;
    
    const properties = [
    {
        id: 1,
        name: "Wayland Beach House",
        location: "Wayland, MA",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=120&fit=crop",
        type: "Beach House",
        value: "$850,000",
        lastInspection: "2024-01-15",
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
        lastInspection: "2024-02-20",
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
        lastInspection: "2024-03-05",
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
        lastInspection: "2024-01-25",
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
        lastInspection: "2024-04-10",
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
        lastInspection: "2024-02-15",
        status: "Blocked",
        statusColor: "bg-red-100 text-red-800",
    },
]
    const handleAddProperty = () => {
        // Logic to add a new property
        console.log("Add New Property clicked");
    }
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Add logic to fetch data for the new page
    };

    return (
        <div className="flex flex-col h-full">
            <PropertyListHeader />
            <div className="bg-white p-4 lg:p-6 rounded-[16px] lg:rounded-[32px] flex-1 overflow-y-auto mt-4 flex flex-col">
            <PropertyList 
                properties={properties}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
            </div>

        </div>
    )
}

export default Page
