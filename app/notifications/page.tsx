"use client";
import { PageHeader } from '@/common/header'
import React from 'react'
import { useRouter } from 'next/navigation';
import PropertyListHeader from '@/common/property-list-header';
import { PropertyList } from '@/components/manage-properties/list';
import Notifications from '@/components/notifications/list';

const Page = () => {
    const router = useRouter();
    return (
        <div className="flex flex-col h-full">
            <PropertyListHeader 
            title="Notifications List"
            />
            <div className=" p-4 lg:p-6 rounded-[16px] lg:rounded-[32px] flex-1 overflow-y-auto mt-4 flex flex-col">
          <Notifications />
            </div>

        </div>
    )
}

export default Page
