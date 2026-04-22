"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, X, AlertCircle, CheckCircle, FileText, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { propertyAPI, documentAPI, processAPI, billingAPI, CreatePropertyRequest, getCurrentUserId } from '@/lib/api';
import NegotiatedWinsForm from '@/components/manage-properties/negotiated-wins-form';

const AddPropertyPage = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        state: '',
        zipCode: '',
        clientName: '',
        yearBuilt: '',
        squareFootage: '',
        bedrooms: '',
        bathrooms: '',
        lotSize: '',
        propertyType: '',
        purchasePrice: '',
        purchaseDate: '',
        negotiatedWins: '',
    });

    // Separate state for each document type
    const [fourPointFile, setFourPointFile] = useState<File | null>(null);
    const [homeInspectionFile, setHomeInspectionFile] = useState<File | null>(null);

    // Refs for file inputs
    const fourPointInputRef = useRef<HTMLInputElement>(null);
    const homeInspectionInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    // Error modal state
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState('');
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [isFormShaking, setIsFormShaking] = useState(false);

    const [canAddProperty, setCanAddProperty] = useState<{ allowed: boolean; reason: string; requires_subscription: boolean } | null>(null);
    const [isCheckingLimit, setIsCheckingLimit] = useState(true);
    const [isBillingLoading, setIsBillingLoading] = useState(false);

    // Check property limit on mount
    useEffect(() => {
        const checkLimit = async () => {
            const userId = getCurrentUserId();
            if (!userId) return;

            try {
                const limit = await billingAPI.canAddProperty();
                setCanAddProperty(limit);
            } catch (err) {
                console.error('Error checking property limit:', err);
            } finally {
                setIsCheckingLimit(false);
            }
        };
        checkLimit();
    }, []);

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
        if (fourPointInputRef.current) {
            fourPointInputRef.current.value = '';
        }
    };

    const removeHomeInspectionFile = () => {
        setHomeInspectionFile(null);
        if (homeInspectionInputRef.current) {
            homeInspectionInputRef.current.value = '';
        }
    };

    const validateForm = (): boolean => {
        if (!formData.clientName.trim()) {
            setError('Client Name is required');
            return false;
        }
        // Prevent purely numeric client names
        if (/^\d+$/.test(formData.clientName.trim())) {
            setError('Client Name cannot be purely numeric');
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
        // Prevent purely numeric cities
        if (/^\d+$/.test(formData.city.trim())) {
            setError('City cannot be purely numeric');
            return false;
        }

        if (!formData.state.trim()) {
            setError('State is required');
            return false;
        }

        if (!formData.zipCode.trim()) {
            setError('Zip Code is required');
            return false;
        }

        // Basic zip code validation (5-10 chars, typically 5 or 5+4)
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
            setError('Please enter a valid Zip Code (e.g., 12345 or 12345-6789)');
            return false;
        }

        // At least one document must be provided
        if (!fourPointFile && !homeInspectionFile) {
            setError('At least one document is required. Please upload a 4-Point or Home Inspection file.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            setIsFormShaking(true);
            setTimeout(() => setIsFormShaking(false), 500);
            return;
        }

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
                property_name: formData.address.trim(),
                location: location,
                address: formData.address.trim(),
                zip_code: formData.zipCode.trim(),
                client_name: formData.clientName.trim(),
                inspection_date: null,
                negotiated_wins: formData.negotiatedWins.trim() || null,
                city: formData.city.trim(),
                state: formData.state.trim(),
                year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
                square_footage: formData.squareFootage ? parseFloat(formData.squareFootage) : null,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
                lot_size: formData.lotSize ? parseFloat(formData.lotSize) : null,
                property_type: formData.propertyType || null,
                purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchase_date: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
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
                    await documentAPI.upload(createdProperty.property_id, filesToUpload, docTypes);
                    console.log('Documents uploaded successfully');
                    setUploadProgress('Documents uploaded successfully!');
                } catch (uploadError) {
                    console.error('Failed to upload documents:', uploadError);
                    const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';

                    // Show error modal with the error message
                    setErrorModalTitle('Document Upload Failed');
                    setErrorModalMessage(errorMessage + '\n\nThe property was created successfully, but documents could not be uploaded.');
                    setShowErrorModal(true);

                    // Continue to redirect after showing error
                    setIsSubmitting(false);
                    return;
                }

                // Step 3: Start the processing pipeline
                setUploadProgress('Starting document processing...');

                try {
                    const processResult = await processAPI.start({
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

    // Loading state while checking limit
    if (isCheckingLimit) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00346C]" />
                    <p className="text-gray-500 text-sm">Verifying subscription status...</p>
                </div>
            </div>
        );
    }

    const handleUpgrade = async () => {
        const userId = getCurrentUserId();
        if (!userId) return;

        setIsBillingLoading(true);
        try {
            const { checkout_url } = await billingAPI.createCheckoutSession();
            window.location.href = checkout_url;
        } catch (err) {
            console.error('Failed to create checkout session:', err);
            alert('Failed to initiate upgrade. Please try again.');
            setIsBillingLoading(false);
        }
    };

    // Limit reached state
    if (canAddProperty && !canAddProperty.allowed) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <Card className="max-w-md w-full p-8 rounded-[32px] border-0 shadow-xl text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Limit Reached</h2>
                    <p className="text-gray-600 mb-8 whitespace-pre-wrap">
                        {canAddProperty.reason || "You have reached the limit of properties for your current plan."}
                    </p>
                    
                    <div className="space-y-3">
                        {canAddProperty.requires_subscription && (
                            <Button
                                onClick={handleUpgrade}
                                disabled={isBillingLoading}
                                className="w-full rounded-full h-12 font-bold"
                            >
                                {isBillingLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Connecting to Stripe...
                                    </span>
                                ) : (
                                    "Upgrade to Pro"
                                )}
                            </Button>
                        ) }
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/manage-properties')}
                            className="w-full text-gray-500 hover:text-gray-700 rounded-full h-12"
                        >
                            Back to Properties
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

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
        <div className="min-h-full bg-[#EBF0F7]">
            {/* Background Container with rounded top-left corner */}
            <div
                className="bg-white min-h-full rounded-t-[24px] md:rounded-tl-[32px] md:rounded-tr-none"
                style={{
                    marginTop: '0',
                }}
            >
                {/* Content Container */}
                <div className="p-4 md:pt-[41px] md:px-[56px]">
                    {/* Page Title */}
                    <h2
                        className="text-lg md:text-[20px] font-semibold leading-tight md:leading-[30px] text-foreground mb-4 md:mb-[24px]"
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
                    <form onSubmit={handleSubmit} className="w-full pb-10">
                        <div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-4 md:gap-y-6"
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

                            {/* Row 3: Zip Code and Closing Date */}
                            <div>
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Zip Code <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    name="zipCode"
                                    placeholder="Enter zip code"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    disabled={isSubmitting}
                                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                                />
                            </div>

                            {/* Additional CMA Fields */}
                            <div className="col-span-1 md:col-span-2 mt-4">
                                <h3 className="text-md font-semibold text-[#1E1E1E] mb-3">Property Specifications</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Property Type</label>
                                        <select
                                            name="propertyType"
                                            value={formData.propertyType}
                                            onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] focus:outline-none focus:ring-1 focus:ring-[#00346C]"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="single_family">Single Family</option>
                                            <option value="condo">Condo</option>
                                            <option value="townhouse">Townhouse</option>
                                            <option value="multi_family">Multi-Family</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Year Built</label>
                                        <Input
                                            type="number"
                                            name="yearBuilt"
                                            placeholder="e.g. 1995"
                                            value={formData.yearBuilt}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Square Footage</label>
                                        <Input
                                            type="number"
                                            name="squareFootage"
                                            placeholder="Total sq ft"
                                            value={formData.squareFootage}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Lot Size (Acres)</label>
                                        <Input
                                            type="number"
                                            name="lotSize"
                                            placeholder="e.g. 0.25"
                                            step="0.01"
                                            value={formData.lotSize}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Bedrooms</label>
                                        <Input
                                            type="number"
                                            name="bedrooms"
                                            placeholder="Number of bedrooms"
                                            value={formData.bedrooms}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Bathrooms</label>
                                        <Input
                                            type="number"
                                            name="bathrooms"
                                            placeholder="Number of bathrooms"
                                            step="0.5"
                                            value={formData.bathrooms}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Purchase Price</label>
                                        <Input
                                            type="number"
                                            name="purchasePrice"
                                            placeholder="Last purchase price"
                                            value={formData.purchasePrice}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#374151] mb-2">Purchase Date</label>
                                        <Input
                                            type="date"
                                            name="purchaseDate"
                                            value={formData.purchaseDate}
                                            onChange={handleInputChange}
                                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Negotiated Wins */}
                            <div className="col-span-1 md:col-span-2 mt-4">
                                <label className="block text-sm font-medium text-[#374151] mb-2">
                                    Negotiated Wins
                                </label>
                                <NegotiatedWinsForm
                                    value={formData.negotiatedWins}
                                    onChange={(value) => setFormData(prev => ({ ...prev, negotiatedWins: value }))}
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-[#9CA3AF] mt-1">Document any specific wins achieved during negotiation.</p>
                            </div>

                            {/* Row 4: Upload Buttons - Two separate buttons */}
                            <div className="col-span-1 md:col-span-2">
                                <p className="text-sm text-[#6B7280] mb-3">Upload Documents (PDF only)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 4-Point File Upload */}
                                    <div>
                                        <input
                                            id="fourpoint-upload"
                                            ref={fourPointInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFourPointSelect}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />
                                        {!fourPointFile ? (
                                            <button
                                                type="button"
                                                onClick={() => fourPointInputRef.current?.click()}
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
                                            ref={homeInspectionInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleHomeInspectionSelect}
                                            className="hidden"
                                            disabled={isSubmitting}
                                        />
                                        {!homeInspectionFile ? (
                                            <button
                                                type="button"
                                                onClick={() => homeInspectionInputRef.current?.click()}
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
                            <div className="col-span-1 md:col-span-2">
                                <Button
                                    type="submit"
                                    className={`w-full h-[48px] rounded-full text-white text-sm font-medium hover:opacity-90 transition-all duration-300 ${isFormShaking ? 'animate-shake error-state' : ''}`}
                                    style={{
                                        background: isFormShaking ? undefined : '#00346C',
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
