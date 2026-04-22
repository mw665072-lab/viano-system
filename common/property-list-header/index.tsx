"use client"

import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PropertyListHeaderProps {
  title?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

function PropertyListHeader({
  title,
  searchQuery = "",
  onSearchChange,
  statusFilter = "All Status",
  onStatusFilterChange,
}: PropertyListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-4 rounded-xl gap-3 sm:gap-0">
      <h1 className="text-lg sm:text-xl font-semibold text-foreground w-full sm:w-auto mb-2 sm:mb-0">{title || "Property List"}</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-[254px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pr-10 h-9 rounded-full py-2 px-3 sm:py-[9px] sm:px-[13px]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="rounded-xl h-9 px-3 py-2 flex items-center gap-2.5 font-normal w-full sm:w-auto"
            >
              {statusFilter}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusFilterChange?.("All Status")}>All Status</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange?.("Pending")}>Pending</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusFilterChange?.("Completed")}>Completed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


export default PropertyListHeader