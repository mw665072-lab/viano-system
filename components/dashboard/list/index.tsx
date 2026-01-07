"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface Property {
  id: number
  name: string
  subtitle: string
  image: string
  status: string
  statusColor: string
}

interface PropertyListProps {
  properties: Property[]
  selectedProperty: Property
  onSelectProperty: (property: Property) => void
}

export function PropertyList({ properties, selectedProperty, onSelectProperty }: PropertyListProps) {
  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <Card
          key={property.id}
          className={`cursor-pointer transition-all h-[100px] rounded-[16px] ${selectedProperty.id === property.id
              ? "bg-[#007AFF0D] border border-[#F3F4F4] py-3 px-4"
              : "bg-white hover:bg-slate-50 p-3"
            }`}
          onClick={() => onSelectProperty(property)}
        >
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="relative w-[76px] h-[76px] flex-shrink-0 rounded-[12px] overflow-hidden bg-[#D9D9D9]">
              <Image src={property.image || "/placeholder.svg"} alt={property.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-[#1E1E1E] leading-none tracking-normal">
                {property.name}
              </h3>
              <p className="text-sm font-normal text-[#1E1E1E] leading-none tracking-normal truncate">
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
