"use client"

import { Eye, EyeOff, Home, Loader2, Trash2, Search, ChevronDown, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  onCloseDetails?: () => void
  onDeleteProperty?: (propertyId: string) => void
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  clientCount?: number
  searchQuery?: string
  onSearchChange?: (query: string) => void
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  /** When true (detail panel closed / full width), rows render as a table with columns. */
  expanded?: boolean
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Build a compact list of page items with ellipses, e.g. [1, 2, 3, 'ellipsis', 9] */
function getPageItems(current: number, total: number): (number | 'ellipsis')[] {
  const items: (number | 'ellipsis')[] = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 2 && p <= current + 2)) {
      items.push(p)
    } else if (items[items.length - 1] !== 'ellipsis') {
      items.push('ellipsis')
    }
  }
  return items
}

export function PropertyList({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onCloseDetails,
  onDeleteProperty,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'All Status',
  onStatusFilterChange,
  expanded = false,
}: PropertyListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header: title + search + status */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-base font-semibold text-gray-900">Clients</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search clients"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 h-10 rounded-lg border-gray-200 bg-white w-full"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0">
                <span className="whitespace-nowrap">{statusFilter}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusFilterChange?.('All Status')}>All Status</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange?.('Pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusFilterChange?.('Completed')}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* List area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {expanded && !isLoading && properties.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50/60 sticky top-0 z-10">
            <div className="w-10 flex-shrink-0" />
            <div className="flex-1 min-w-0 grid grid-cols-3 gap-4">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Address</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">City / State</span>
            </div>
            <div className="w-[112px] flex-shrink-0" />
          </div>
        )}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-gray-500">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <Home className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No properties found</h3>
            <p className="text-sm text-gray-500">Add a new property to get started</p>
          </div>
        ) : (
          properties.map((property, index) => {
            const isSelected = selectedPropertyId === property.id
            const isLast = index === properties.length - 1
            return (
              <div
                key={property.id}
                onClick={() => onSelectProperty?.(property)}
                className={`cursor-pointer transition-all duration-150 px-4 py-3 flex items-center gap-3 ${
                  isSelected ? "bg-orange-50/50" : "bg-white hover:bg-gray-50/50"
                } ${!isLast ? "border-b border-gray-100" : ""}`}
              >
                {/* Client Initials Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isSelected ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {getInitials(property.clientName || 'Unknown')}
                </div>

                {/* Client Name + Address */}
                {expanded ? (
                  <div className="hidden lg:grid flex-1 min-w-0 grid-cols-3 gap-4 items-center">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {property.clientName || 'No Client'}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">{property.name || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{property.location || '—'}</p>
                  </div>
                ) : null}
                {/* Stacked layout (narrow panel, and mobile when expanded) */}
                <div className={`flex-1 min-w-0 ${expanded ? "lg:hidden" : ""}`}>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {property.clientName || 'No Client'}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">{property.name || property.location}</p>
                  {property.location && property.location !== property.name && (
                    <p className="text-xs text-gray-400 truncate">{property.location}</p>
                  )}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        onCloseDetails?.();
                      } else {
                        onSelectProperty?.(property);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? "border-[#E8730A] text-[#E8730A] bg-[#E8730A]/5 hover:bg-[#E8730A]/10"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {isSelected ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {isSelected ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination - always at bottom */}
      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-2 gap-y-2 px-4 py-3 border-t border-gray-100 flex-shrink-0 mt-auto">
        <div className="flex items-center gap-1">
          {getPageItems(currentPage, totalPages).map((item, i) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
            ) : (
              <button
                key={item}
                onClick={() => onPageChange?.(item)}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  currentPage === item ? "bg-[#E8730A] text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="text-sm font-medium text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="text-sm font-medium text-white bg-[#E8730A] px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
