"use client"

import { ChevronLeft, ChevronRight, Home, Loader2, Trash2 } from "lucide-react"

interface Property {
  id: string
  name: string
  location: string
  image?: string
  type?: string
  value?: string
  closingDate?: string
  status: string
  statusColor: string
  clientName?: string
  isDraft?: boolean
}

interface PropertyListProps {
  properties: Property[]
  selectedPropertyId?: string | null
  onSelectProperty?: (property: Property) => void
  onDeleteProperty?: (propertyId: string) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  clientCount?: number
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function PropertyList({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onDeleteProperty,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  clientCount = 0,
}: PropertyListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="flex flex-col h-full">
      {/* Client Count */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <span className="text-xs font-medium text-gray-500">Clients ({clientCount})</span>
      </div>

      {/* Property List - table style with bottom borders */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {properties.map((property, index) => {
          const isSelected = selectedPropertyId === property.id
          const isLast = index === properties.length - 1
          return (
            <div
              key={property.id}
              onClick={() => onSelectProperty?.(property)}
              className={`cursor-pointer transition-all duration-150 px-4 py-3 flex items-center gap-3 ${
                isSelected
                  ? "bg-orange-50/50 border-l-2 border-l-orange-400"
                  : "bg-white hover:bg-gray-50/50 border-l-2 border-l-transparent"
              } ${!isLast ? "border-b border-gray-200" : ""}`}
            >
              {/* Client Initials Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isSelected
                  ? "bg-gray-200 text-gray-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {getInitials(property.clientName || 'Unknown')}
              </div>

              {/* Client Name */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold truncate ${
                  isSelected ? "text-gray-900" : "text-gray-700"
                }`}>
                  {property.clientName || 'No Client'}
                </h3>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {property.isDraft && onDeleteProperty && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProperty(property.id);
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronRight className={`w-4 h-4 ${isSelected ? "text-gray-400" : "text-gray-300"}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination - always at bottom */}
      <div className="flex items-center justify-center gap-1 pt-3 pb-3 border-t border-gray-100 flex-shrink-0 mt-auto">
        <button
          onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pageNum => (
          <button
            key={pageNum}
            onClick={() => onPageChange?.(pageNum)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === pageNum
                ? "bg-orange-50 text-orange-600 border border-orange-200"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </button>
        ))}
        <button
          onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
