"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "lucide-react"

export function AddPropertyForm() {
  const [isDragActive, setIsDragActive] = useState(false)
  const [formData, setFormData] = useState({
    propertyName: "",
    address: "",
    city: "",
    state: "",
    closingDate: "",
  })
  const [files, setFiles] = useState<File[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", { formData, files })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-900">Add New Property</h1>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Name of the Property */}
        <Input
          type="text"
          name="propertyName"
          placeholder="Name of the Property"
          value={formData.propertyName}
          onChange={handleInputChange}
          className="border-gray-300 bg-white placeholder:text-gray-400"
        />

        {/* Address */}
        <Input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleInputChange}
          className="border-gray-300 bg-white placeholder:text-gray-400"
        />

        {/* City */}
        <Input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleInputChange}
          className="border-gray-300 bg-white placeholder:text-gray-400"
        />

        {/* State */}
        <Input
          type="text"
          name="state"
          placeholder="State"
          value={formData.state}
          onChange={handleInputChange}
          className="border-gray-300 bg-white placeholder:text-gray-400"
        />
      </div>

      {/* Closing Date with Calendar Icon */}
      <div className="relative">
        <Input
          type="date"
          name="closingDate"
          value={formData.closingDate}
          onChange={handleInputChange}
          className="border-gray-300 bg-white placeholder:text-gray-400 appearance-none pr-10"
          placeholder="Closing Date"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-gray-400 text-sm">Drag Your Audit Reports Here.</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-medium mb-2">{files.length} file(s) selected</p>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={index} className="text-xs text-gray-500">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-950 text-white font-medium py-2.5 rounded-full">
        Submit
      </Button>
    </form>
  )
}

export default AddPropertyForm
