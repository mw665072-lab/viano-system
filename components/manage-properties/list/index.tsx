"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface PropertyListProps {
  properties: Property[]
  selectedPropertyId?: string | null
  onSelectProperty?: (property: Property) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
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
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#00346C] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">Loading properties...</p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Home className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
        <p className="text-sm text-gray-500">Add a new property to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 flex-1 overflow-y-auto">
        {properties.map((property) => (
          <Card
            key={property.id}
            onClick={() => onSelectProperty?.(property)}
            className={`cursor-pointer transition-all rounded-[16px] p-4 border ${selectedPropertyId === property.id
              ? "bg-[#007AFF0D] border-[#007AFF] shadow-sm"
              : "bg-white hover:bg-slate-50 border-transparent"
              }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              <div className="relative w-20 h-20 sm:w-[80px] sm:h-[80px] flex-shrink-0 rounded-[12px] overflow-hidden bg-[#D9D9D9]">
                {property.image ? (
                  <Image src={property.image} alt={property.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[#1E1E1E] mb-1">
                  {property.name}
                </h3>
                <p className="text-sm text-[#6B7280] mb-3">
                  {property.location}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#374151]">
                  {property.type && (
                    <span>
                      <span className="font-medium">TYPE:</span> {property.type}
                    </span>
                  )}
                  {property.clientName && (
                    <span>
                      <span className="font-medium">CLIENT:</span> {property.clientName}
                    </span>
                  )}
                  {property.closingDate && (
                    <span>
                      <span className="font-medium">CLOSING:</span> {property.closingDate}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 sm:mt-0 flex items-center gap-2 sm:flex-shrink-0">
                <Badge
                  className={`${property.statusColor} h-[32px] rounded-full px-4 py-1 text-xs font-medium`}
                >
                  {property.status}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6 mt-auto gap-3">
        {/* Desktop pagination (sm+) */}
        <div className="hidden sm:flex items-center gap-2">
          {/* First page */}
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange?.(1)}
            className={`h-9 w-9 p-0 rounded-full ${currentPage === 1
              ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 border-0"
              : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
          >
            1
          </Button>

          {/* Second page */}
          {totalPages >= 2 && (
            <Button
              variant={currentPage === 2 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange?.(2)}
              className={`h-9 w-9 p-0 rounded-full ${currentPage === 2
                ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 border-0"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
            >
              2
            </Button>
          )}

          {/* Third page */}
          {totalPages >= 3 && (
            <Button
              variant={currentPage === 3 ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange?.(3)}
              className={`h-9 w-9 p-0 rounded-full ${currentPage === 3
                ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 border-0"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
            >
              3
            </Button>
          )}

          {/* Ellipsis */}
          {totalPages > 4 && (
            <span className="px-2 text-gray-500">...</span>
          )}

          {/* Last page */}
          {totalPages > 3 && (
            <Button
              variant={currentPage === totalPages ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange?.(totalPages)}
              className={`h-9 w-9 p-0 rounded-full ${currentPage === totalPages
                ? "bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 border-0"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
            >
              {totalPages}
            </Button>
          )}
        </div>

        {/* Mobile compact pagination */}
        <div className="flex sm:hidden items-center gap-2 justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="h-9 px-3 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-700">
            Page <span className="font-medium">{currentPage}</span> of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="h-9 px-3 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Desktop Next button (hidden on mobile) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-9 px-4 rounded-full border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 hidden sm:inline-flex"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

