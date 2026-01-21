"use client";

import React, { useState } from 'react';
import { Upload, Loader2, X, AlertCircle, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { propertyAPI, documentAPI, processAPI, CreatePropertyRequest, getCurrentUserId } from '@/lib/api';

const AddPropertyPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        propertyName: '',
        address: '',
        city: '',
        state: '',
        closingDate: '',
        clientName: '',
    });

    // Separate state for each document type
    const [fourPointFile, setFourPointFile] = useState<File | null>(null);
    const [homeInspectionFile, setHomeInspectionFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Error modal state
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState('');
    const [errorModalMessage, setErrorModalMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError(null);
    };

    const handleFourPointSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFourPointFile(e.target.files[0]);
        }
    };

    const handleHomeInspectionSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setHomeInspectionFile(e.target.files[0]);
        }
    };

    const removeFourPointFile = () => {
        setFourPointFile(null);
    };

    const removeHomeInspectionFile = () => {
        setHomeInspectionFile(null);
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

            // Step 1: Create property
            setUploadProgress('Creating property...');

            const location = `${formData.city.trim()}, ${formData.state.trim()}`;

            const propertyData: CreatePropertyRequest = {
                user_id: userId,
                property_name: formData.propertyName.trim(),
                location: location,
                address: formData.address.trim(),
                client_name: formData.clientName.trim(),
                property_closing_date: formData.closingDate || null,
            };

            const createdProperty = await propertyAPI.create(propertyData);
            console.log('Property created:', createdProperty);

            // Step 2: Upload documents if any
            const filesToUpload: File[] = [];
            const docTypes: ('4point' | 'home_inspection')[] = [];

            if (fourPointFile) {
                filesToUpload.push(fourPointFile);
                docTypes.push('4point');
            }
            if (homeInspectionFile) {
                filesToUpload.push(homeInspectionFile);
                docTypes.push('home_inspection');
            }

            if (filesToUpload.length > 0) {
                setUploadProgress(`Uploading ${filesToUpload.length} document(s)...`);

                try {
                    await documentAPI.upload(userId, createdProperty.property_id, filesToUpload, docTypes);
                    console.log('Documents uploaded successfully');
                    setUploadProgress('Documents uploaded successfully!');
                } catch (uploadError) {
                    console.error('Failed to upload documents:', uploadError);
                    const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';

                    // Check for upload limit error
                    if (errorMessage.includes('Upload limit') || errorMessage.includes('limit exceeded')) {
                        setErrorModalTitle('Document Upload Limit Reached');
                        setErrorModalMessage('You have reached the maximum document storage limit (12 documents). Please delete some existing documents before uploading new ones.\n\nThe property was created successfully, but no documents were uploaded.');
                        setShowErrorModal(true);
                    } else {
                        setErrorModalTitle('Document Upload Failed');
                        setErrorModalMessage(errorMessage + '\n\nThe property was created successfully, but documents could not be uploaded.');
                        setShowErrorModal(true);
                    }

                    // Continue to redirect after showing error
                    setIsSubmitting(false);
                    return;
                }

                // Step 3: Start the processing pipeline
                setUploadProgress('Starting document processing...');

                try {
                    const processResult = await processAPI.start({
                        user_id: userId,
                        property_id: createdProperty.property_id,
                    });
                    console.log('Process started:', processResult);
                    setUploadProgress('Processing started successfully!');
                } catch (processError) {
                    console.error('Failed to start process:', processError);
                    // Continue even if process fails
                    setUploadProgress('Property created, but processing could not be started.');
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

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="w-full max-w-[838px]">
                        <div
                            className="grid grid-cols-2"
                            style={{
                                rowGap: '24px',
                                columnGap: '16px',
                            }}
                        >
                            {/* Row 1: Client Name and Address */}
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Client Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="clientName"
                                    placeholder="Enter client name"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Address <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="address"
                                    placeholder="Enter street address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>

                            {/* Row 2: City and State */}
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="city"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="state"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>

                            {/* Row 3: Property Name and Closing Date */}
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Property Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="propertyName"
                                    placeholder="Enter property name"
                                    value={formData.propertyName}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Property Closing Date
                                </label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        name="closingDate"
                                        value={formData.closingDate}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                        className={`h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50 cursor-pointer ${formData.closingDate ? 'text-[#1E1E1E]' : 'text-[#9CA3AF]'}`}
                                    />
                                </div>
                                <p className="text-xs text-[#9CA3AF] mt-1">Format: MM/DD/YYYY</p>
                            </div>

                            {/* Row 4: Upload Buttons - Two separate buttons */}
                            <div className="col-span-2">
                                <p className="text-sm text-[#6B7280] mb-3">Upload Documents (PDF only)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* 4-Point File Upload */}
                                    <div>
                                        <input
                                            id="fourpoint-upload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFourPointSelect}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />
                                        {!fourPointFile ? (
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('fourpoint-upload')?.click()}
                                                disabled={isSubmitting}
                                                className="w-full h-[120px] rounded-[16px] border-2 border-dashed border-[#00346C] bg-white hover:bg-[#F8FAFC] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Upload className="w-6 h-6 text-[#00346C]" />
                                                <span className="text-sm font-medium text-[#00346C]">Upload 4-Point File</span>
                                                <span className="text-xs text-[#9CA3AF]">PDF format only</span>
                                            </button>
                                        ) : (
                                            <div className="w-full h-[120px] rounded-[16px] border-2 border-solid border-[#10B981] bg-[#F0FDF4] flex flex-col items-center justify-center gap-2 relative">
                                                <button
                                                    type="button"
                                                    onClick={removeFourPointFile}
                                                    disabled={isSubmitting}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <FileText className="w-6 h-6 text-[#10B981]" />
                                                <span className="text-sm font-medium text-[#10B981]">4-Point File</span>
                                                <span className="text-xs text-[#6B7280] truncate max-w-[90%] px-2">{fourPointFile.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Home Inspection File Upload */}
                                    <div>
                                        <input
                                            id="homeinspection-upload"
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleHomeInspectionSelect}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />
                                        {!homeInspectionFile ? (
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('homeinspection-upload')?.click()}
                                                disabled={isSubmitting}
                                                className="w-full h-[120px] rounded-[16px] border-2 border-dashed border-[#00346C] bg-white hover:bg-[#F8FAFC] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Upload className="w-6 h-6 text-[#00346C]" />
                                                <span className="text-sm font-medium text-[#00346C]">Upload Home Inspection File</span>
                                                <span className="text-xs text-[#9CA3AF]">PDF format only</span>
                                            </button>
                                        ) : (
                                            <div className="w-full h-[120px] rounded-[16px] border-2 border-solid border-[#10B981] bg-[#F0FDF4] flex flex-col items-center justify-center gap-2 relative">
                                                <button
                                                    type="button"
                                                    onClick={removeHomeInspectionFile}
                                                    disabled={isSubmitting}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <FileText className="w-6 h-6 text-[#10B981]" />
                                                <span className="text-sm font-medium text-[#10B981]">Home Inspection File</span>
                                                <span className="text-xs text-[#6B7280] truncate max-w-[90%] px-2">{homeInspectionFile.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

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

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            {/* Icon */}
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
                                {errorModalTitle}
                            </h3>

                            {/* Message */}
                            <p className="text-gray-600 text-center whitespace-pre-line mb-6">
                                {errorModalMessage}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowErrorModal(false);
                                        router.push('/manage-properties');
                                    }}
                                    className="flex-1"
                                >
                                    Go to Properties
                                </Button>
                                <Button
                                    onClick={() => setShowErrorModal(false)}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    Stay Here
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddPropertyPage;
