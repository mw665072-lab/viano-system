"use client";

import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AddPropertyPage = () => {
    const [formData, setFormData] = useState({
        propertyName: '',
        address: '',
        city: '',
        state: '',
        closingDate: '',
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles(prev => [...prev, ...files]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData, uploadedFiles);
        // TODO: Implement actual form submission logic
    };

    return (
        <div className="flex flex-col h-full">
            {/* Page Title */}
            <div className="px-4 lg:px-[56px] pt-4 lg:pt-[41px]">
                <h2
                    className="text-[18px] lg:text-[20px] font-semibold leading-[30px] text-[#1E1E1E]"
                    style={{ fontFamily: 'Manrope' }}
                >
                    Add New Property
                </h2>
            </div>

            {/* Form Container */}
            <div className="flex-1 px-4 lg:px-[56px] py-4 lg:py-6">
                <form onSubmit={handleSubmit} className="w-full max-w-[838px]">
                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        {/* Row 1: Name and Address */}
                        <div className="col-span-1">
                            <Input
                                type="text"
                                name="propertyName"
                                placeholder="Name of the Property"
                                value={formData.propertyName}
                                onChange={handleInputChange}
                                className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C]"
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                type="text"
                                name="address"
                                placeholder="Address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C]"
                            />
                        </div>

                        {/* Row 2: City and State */}
                        <div className="col-span-1">
                            <Input
                                type="text"
                                name="city"
                                placeholder="City"
                                value={formData.city}
                                onChange={handleInputChange}
                                className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C]"
                            />
                        </div>
                        <div className="col-span-1">
                            <Input
                                type="text"
                                name="state"
                                placeholder="State"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C]"
                            />
                        </div>

                        {/* Row 3: Closing Date - Only in first column on desktop */}
                        <div className="col-span-1">
                            <Input
                                type="date"
                                name="closingDate"
                                placeholder="Closing Date"
                                value={formData.closingDate}
                                onChange={handleInputChange}
                                className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C]"
                            />
                        </div>
                        {/* Empty cell for alignment on desktop */}
                        <div className="hidden md:block col-span-1"></div>

                        {/* Row 4: Upload Container - Spans 2 columns */}
                        <div className="col-span-1 md:col-span-2">
                            <div
                                className={`w-full min-h-[200px] lg:min-h-[272px] rounded-[16px] border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragOver
                                        ? 'border-[#00346C] bg-[#ECF2FE]'
                                        : 'border-[#D9D9D9] bg-white hover:border-[#00346C] hover:bg-[#F8FAFC]'
                                    }`}
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%23${isDragOver ? '00346C' : 'D9D9D9'}' stroke-width='2' stroke-dasharray='7%2c 7' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e")`,
                                    border: 'none',
                                    borderRadius: '16px'
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-[#6B7280]" />
                                    <span className="text-sm text-[#6B7280]">
                                        Drag Your Audit Reports Here.
                                    </span>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-4 w-full">
                                        <div className="text-xs text-[#6B7280] mb-2">Uploaded files:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {uploadedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="text-xs bg-[#ECF2FE] text-[#00346C] px-2 py-1 rounded"
                                                >
                                                    {file.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 5: Submit Button - Spans 2 columns */}
                        <div className="col-span-1 md:col-span-2">
                            <Button
                                type="submit"
                                className="w-full h-[42px] rounded-full border border-[#D9D9D9] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                style={{
                                    background: '#00346C',
                                    fontFamily: 'Roboto',
                                    fontWeight: 500
                                }}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertyPage;
