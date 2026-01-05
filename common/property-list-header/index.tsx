import { Search, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

 function PropertyListHeader({title}: {title?: string}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-4 rounded-xl gap-3 sm:gap-0">
      <h1 className="text-lg sm:text-[20px] font-semibold leading-[30px] text-[#1E1E1E] w-full sm:w-auto mb-2 sm:mb-0" style={{ fontFamily: 'Manrope' }}>{title || "Property List"}</h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
        <div className="relative w-full sm:w-[254px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search properties..."
            className="pr-10 h-9 bg-white border border-[#D9D9D9] rounded-full focus-visible:ring-1 focus-visible:ring-slate-300 py-2 px-3 sm:py-[9px] sm:px-[13px]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-white border border-[#D9D9D9] rounded-xl h-9 px-3 py-2 flex items-center gap-2.5 font-normal text-slate-600 hover:bg-slate-50 w-full sm:w-auto"
            >
              All Status
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>All Status</DropdownMenuItem>
            <DropdownMenuItem>Active</DropdownMenuItem>
            <DropdownMenuItem>Inactive</DropdownMenuItem>
            <DropdownMenuItem>Pending</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}


export default PropertyListHeader