"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Home, MapPin, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Property {
  id: string
  name: string
  location: string
  image?: string
  type?: string
  value?: string
  closingDate?: string
  status: "Pending" | "Completed" | "Processing" | "Failed"
  statusColor: string
  clientName?: string
}

interface PropertyListProps {
  properties: Property[]
  selectedPropertyId?: string | null
  onSelectProperty?: (property: Property) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

// Get status badge styles
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700"
    case "Processing":
      return "bg-blue-100 text-blue-700"
    case "Failed":
      return "bg-red-100 text-red-700"
    case "Pending":
    default:
      return "bg-amber-100 text-amber-700"
  }
}

export function PropertyList({
  properties,
  selectedPropertyId,
  onSelectProperty,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
}: PropertyListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 border-3 border-[#00346C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-gray-500">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
          <Home className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No properties found</h3>
        <p className="text-sm text-gray-500">Add a new property to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Property List - Compact Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {properties.map((property) => (
          <div
            key={property.id}
            onClick={() => onSelectProperty?.(property)}
            className={`cursor-pointer transition-all duration-150 rounded-xl p-2.5 border flex items-center gap-3 ${selectedPropertyId === property.id
              ? "bg-blue-50 border-blue-400 shadow-sm"
              : "bg-white hover:bg-gray-50 border-gray-100"
              }`}
          >
            {/* Compact Image */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              {property.image ? (
                <Image src={property.image} alt={property.name} fill className="object-cover" />
              ) : (
                <img
                  src="/property-default.png"
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {property.clientName || 'No Client'}
                </h3>
                <Badge className={`${getStatusBadgeStyle(property.status)} text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                  {property.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3" />
                  {property.location}
                </span>
              </div>
            </div>

            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedPropertyId === property.id ? "text-blue-500" : "text-gray-300"}`} />
          </div>
        ))}
      </div>

      {/* Compact Pagination */}
      <div className="flex items-center justify-between pt-4 pb-4 mt-auto border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-7 px-2 text-xs"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(pageNum => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange?.(pageNum)}
              className={`h-7 w-7 p-0 text-xs ${currentPage === pageNum ? "bg-[#1E3A8A]" : ""}`}
            >
              {pageNum}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-7 px-2 text-xs"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
