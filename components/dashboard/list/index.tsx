"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Home } from "lucide-react"

interface Property {
  id: string
  name: string
  subtitle: string
  image?: string
  status: "Pending" | "Completed"
  statusColor: string
}

interface PropertyListProps {
  properties: Property[]
  selectedProperty: Property | null
  onSelectProperty: (property: Property) => void
  isLoading?: boolean
}

export function PropertyList({ properties, selectedProperty, onSelectProperty, isLoading = false }: PropertyListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#00346C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Home className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
        <p className="text-sm text-gray-500">Add a property to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <Card
          key={property.id}
          className={`cursor-pointer transition-all h-[100px] rounded-[16px] ${selectedProperty?.id === property.id
            ? "bg-[#007AFF0D] border border-[#F3F4F4] py-3 px-4"
            : "bg-white hover:bg-slate-50 p-3"
            }`}
          onClick={() => onSelectProperty(property)}
        >
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="relative w-[76px] h-[76px] flex-shrink-0 rounded-[12px] overflow-hidden bg-[#D9D9D9]">
              {property.image ? (
                <Image src={property.image} alt={property.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#1E1E1E] leading-none tracking-normal">
                {property.name}
              </h3>
              <p className="text-sm font-normal text-[#1E1E1E] leading-none tracking-normal truncate mt-1">
                {property.subtitle}
              </p>
            </div>
            <Badge
              className={`flex-shrink-0 ${property.statusColor} w-[97px] h-[33px] rounded-full gap-[10px] px-3 py-2 flex items-center justify-center`}
            >
              {property.status}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
