"use client";

import React, { useState } from 'react';
import { Upload, Loader2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { propertyAPI, documentAPI, CreatePropertyRequest, getCurrentUserId } from '@/lib/api';

const AddPropertyPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        propertyName: '',
        address: '',
        city: '',
        state: '',
        closingDate: '',
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; docType: '4point' | 'home_inspection' }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError(null);
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
        const newFiles = files.map(file => ({ file, docType: '4point' as const }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newFiles = files.map(file => ({ file, docType: '4point' as const }));
            setUploadedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        if (!formData.propertyName.trim()) {
            setError('Property name is required');
            return false;
        }
        if (!formData.address.trim()) {
            setError('Address is required');
            return false;
        }
        if (!formData.city.trim()) {
            setError('City is required');
            return false;
        }
        if (!formData.state.trim()) {
            setError('State is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);
        setUploadProgress('');

        try {
            const userId = getCurrentUserId();
            if (!userId) {
                throw new Error('User not logged in. Please login first.');
            }

            setUploadProgress('Creating property...');

            // Combine city and state for location field
            const location = `${formData.city.trim()}, ${formData.state.trim()}`;

            const propertyData: CreatePropertyRequest = {
                user_id: userId,
                property_name: formData.propertyName.trim(),
                location: location,
                address: formData.address.trim(),
                property_closing_date: formData.closingDate || null,
            };

            const createdProperty = await propertyAPI.create(propertyData);
            console.log('Property created:', createdProperty);

            if (uploadedFiles.length > 0) {
                setUploadProgress(`Uploading ${uploadedFiles.length} document(s)...`);

                let uploadedCount = 0;
                for (const { file, docType } of uploadedFiles) {
                    try {
                        await documentAPI.upload(userId, createdProperty.property_id, file, docType);
                        uploadedCount++;
                        setUploadProgress(`Uploaded ${uploadedCount}/${uploadedFiles.length} documents...`);
                    } catch (uploadError) {
                        console.error(`Failed to upload ${file.name}:`, uploadError);
                    }
                }
            }

            setSuccess(true);
            setUploadProgress('');

            setTimeout(() => {
                router.push('/manage-properties');
            }, 2000);

        } catch (err) {
            console.error('Error submitting form:', err);
            setError(err instanceof Error ? err.message : 'Failed to add property. Please try again.');
            setUploadProgress('');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (success) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Property Added Successfully!</h2>
                    <p className="text-gray-600">Redirecting to your properties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EBF0F7]">
            {/* Background Container with rounded top-left corner */}
            <div
                className="bg-white min-h-[924px]"
                style={{
                    borderTopLeftRadius: '32px',
                    marginTop: '0',
                }}
            >
                {/* Content Container */}
                <div className="pt-[41px] pl-[56px] pr-[56px]">
                    {/* Page Title */}
                    <h2
                        className="text-[20px] font-semibold leading-[30px] text-[#1E1E1E] mb-[24px]"
                        style={{ fontFamily: 'Manrope' }}
                    >
                        Add New Property
                    </h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 max-w-[838px]">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-red-700 text-sm">{error}</p>
                            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Form Container - 838px width, 5 rows, 2 columns */}
                    <form onSubmit={handleSubmit} className="w-full max-w-[838px]">
                        <div
                            className="grid grid-cols-2"
                            style={{
                                rowGap: '24px',
                                columnGap: '16px',
                            }}
                        >
                            {/* Row 1: Name of the Property and Address */}
                            <div>
                                <Input
                                    type="text"
                                    name="propertyName"
                                    placeholder="Name of the Property"
                                    value={formData.propertyName}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    name="address"
                                    placeholder="Address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>

                            {/* Row 2: City and State */}
                            <div>
                                <Input
                                    type="text"
                                    name="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    name="state"
                                    placeholder="State"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>

                            {/* Row 3: Closing Date (left column only) */}
                            <div>
                                <Input
                                    type="date"
                                    name="closingDate"
                                    placeholder="Closing Date"
                                    value={formData.closingDate}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>{/* Empty cell for alignment */}</div>

                            {/* Row 4: Upload Container - Spans 2 columns */}
                            <div className="col-span-2">
                                <div
                                    className={`w-full h-[200px] rounded-[16px] flex flex-col items-center justify-center cursor-pointer transition-colors ${isSubmitting
                                            ? 'opacity-50 cursor-not-allowed'
                                            : isDragOver
                                                ? 'bg-[#E8F0FE]'
                                                : 'bg-white hover:bg-[#FAFBFC]'
                                        }`}
                                    style={{
                                        border: '2px dashed #00346C',
                                    }}
                                    onDragOver={!isSubmitting ? handleDragOver : undefined}
                                    onDragLeave={!isSubmitting ? handleDragLeave : undefined}
                                    onDrop={!isSubmitting ? handleDrop : undefined}
                                    onClick={() => !isSubmitting && document.getElementById('file-upload')?.click()}
                                >
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex items-center gap-2 text-[#6B7280]">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-sm">Drag Your Audit Reports Here.</span>
                                    </div>
                                </div>

                                {/* Uploaded Files List */}
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {uploadedFiles.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-2 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]"
                                            >
                                                <span className="flex-1 text-sm text-[#1E1E1E] truncate">{item.file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                    disabled={isSubmitting}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {uploadProgress && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-[#00346C]">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{uploadProgress}</span>
                                    </div>
                                )}
                            </div>

                            {/* Row 5: Submit Button - Spans 2 columns */}
                            <div className="col-span-2">
                                <Button
                                    type="submit"
                                    className="w-full h-[48px] rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                    style={{
                                        background: '#00346C',
                                        fontFamily: 'Roboto',
                                        fontWeight: 500
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </span>
                                    ) : (
                                        'Submit'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddPropertyPage;
