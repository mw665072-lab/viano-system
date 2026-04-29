"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { Upload, Loader2, X, AlertCircle, CheckCircle, FileText, AlertTriangle, ShieldAlert, FileUp, ArrowLeft, Eye, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { propertyAPI, documentAPI, processAPI, billingAPI, CreatePropertyRequest, getCurrentUserId, UploadAndExtractResponse } from '@/lib/api';
import NegotiatedWinsForm from '@/components/manage-properties/negotiated-wins-form';

type FlowType = 'pdf' | 'manual';
type PdfStep = 1 | 2;

const AddPropertyPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draft');

    // Flow selection
    const [activeFlow, setActiveFlow] = useState<FlowType>('pdf');
    const [pdfStep, setPdfStep] = useState<PdfStep>(1);

    // PDF-first flow state
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfDocType, setPdfDocType] = useState<'4point' | 'home_inspection'>('home_inspection');
    const [isExtracting, setIsExtracting] = useState(false);
    const [draftPropertyId, setDraftPropertyId] = useState<string | null>(draftId);
    const [extractedData, setExtractedData] = useState<UploadAndExtractResponse | null>(null);
    const [confirmProgress, setConfirmProgress] = useState<string>('');
    const [specsOpen, setSpecsOpen] = useState(false);

    // Second document upload for PDF flow (optional)
    const [secondDocFile, setSecondDocFile] = useState<File | null>(null);
    const secondDocInputRef = useRef<HTMLInputElement>(null);

    const pdfInputRef = useRef<HTMLInputElement>(null);

    // Manual flow form data (shared with PDF review step)
    const [formData, setFormData] = useState({
        address: '',
        city: '',
        state: '',
        zipCode: '',
        clientName: '',
        inspectionDate: '',
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

    // Separate state for each document type (manual flow only)
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

    // Check property limit on mount (skip if loading an existing draft)
    useEffect(() => {
        const checkLimit = async () => {
            // Skip limit check when confirming an existing draft
            if (draftId) {
                setIsCheckingLimit(false);
                return;
            }

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
    }, [draftId]);

    // Handle draft query param - load existing draft property
    useEffect(() => {
        if (draftId) {
            const loadDraft = async () => {
                try {
                    setIsExtracting(true);
                    setError(null);
                    const property = await propertyAPI.getProperty(draftId);

                    if (!property.is_draft) {
                        // Property is already confirmed, redirect
                        router.push('/manage-properties');
                        return;
                    }

                    setDraftPropertyId(draftId);
                    setActiveFlow('pdf');
                    setPdfStep(2);

                    // Pre-populate form with property data
                    setFormData({
                        address: property.address || '',
                        city: property.city || '',
                        state: property.state || '',
                        zipCode: property.zip_code || '',
                        clientName: property.client_name || '',
                        inspectionDate: property.inspection_date ? property.inspection_date.split('T')[0] : '',
                        yearBuilt: property.year_built ? String(property.year_built) : '',
                        squareFootage: property.square_footage ? String(property.square_footage) : '',
                        bedrooms: property.bedrooms ? String(property.bedrooms) : '',
                        bathrooms: property.bathrooms ? String(property.bathrooms) : '',
                        lotSize: property.lot_size ? String(property.lot_size) : '',
                        propertyType: property.property_type || '',
                        purchasePrice: property.purchase_price ? String(property.purchase_price) : '',
                        purchaseDate: property.purchase_date ? property.purchase_date.split('T')[0] : '',
                        negotiatedWins: property.negotiated_wins || '',
                    });
                } catch (err) {
                    console.error('Error loading draft property:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load draft property');
                } finally {
                    setIsExtracting(false);
                }
            };
            loadDraft();
        }
    }, [draftId, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError(null);
    };

    const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setError('Please upload a PDF file only');
                return;
            }
            setPdfFile(file);
            setError(null);
        }
    };

    const removePdfFile = () => {
        setPdfFile(null);
        if (pdfInputRef.current) {
            pdfInputRef.current.value = '';
        }
    };

    const handleSecondDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                setError('Please upload a PDF file only');
                return;
            }
            setSecondDocFile(file);
            setError(null);
        }
    };

    const removeSecondDocFile = () => {
        setSecondDocFile(null);
        if (secondDocInputRef.current) {
            secondDocInputRef.current.value = '';
        }
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

    // Step 1: Upload PDF and extract data
    const handlePdfUpload = async () => {
        if (!pdfFile) {
            setError('Please select a PDF file to upload');
            setIsFormShaking(true);
            setTimeout(() => setIsFormShaking(false), 500);
            return;
        }

        const userId = getCurrentUserId();
        if (!userId) {
            setError('User not logged in. Please login first.');
            return;
        }

        setIsExtracting(true);
        setError(null);

        try {
            const result = await propertyAPI.uploadAndExtract(pdfFile, pdfDocType);
            setExtractedData(result);
            setDraftPropertyId(result.property_id);

            // Pre-populate form with extracted data
            setFormData(prev => ({
                ...prev,
                clientName: result.extracted.client_name || '',
                address: result.extracted.address || '',
                city: result.extracted.city || '',
                state: result.extracted.state || '',
                zipCode: result.extracted.zip_code || '',
                inspectionDate: result.extracted.inspection_date ? result.extracted.inspection_date.split('T')[0] : '',
            }));

            setPdfStep(2);
        } catch (err) {
            console.error('Error uploading PDF:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload and extract PDF. Please try again.');
        } finally {
            setIsExtracting(false);
        }
    };

    // Step 2: Confirm draft property
    const handlePdfConfirm = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePdfReviewForm()) {
            setIsFormShaking(true);
            setTimeout(() => setIsFormShaking(false), 500);
            return;
        }

        if (!draftPropertyId) {
            setError('No draft property found. Please start over.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setConfirmProgress('Confirming property...');

        try {
            const confirmData = {
                client_name: formData.clientName.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zip_code: formData.zipCode.trim(),
                inspection_date: formData.inspectionDate || '',
                negotiated_wins: formData.negotiatedWins.trim() || null,
                year_built: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
                square_footage: formData.squareFootage ? parseFloat(formData.squareFootage) : null,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
                lot_size: formData.lotSize ? parseFloat(formData.lotSize) : null,
                property_type: formData.propertyType || null,
                purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
                purchase_date: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : null,
            };

            const result = await propertyAPI.confirm(draftPropertyId, confirmData);
            console.log('Property confirmed:', result);

            // Upload second document if provided
            if (secondDocFile && draftPropertyId) {
                setConfirmProgress('Uploading second document...');
                try {
                    const secondDocType: '4point' | 'home_inspection' =
                        extractedData?.document.doc_type === 'home_inspection' ? '4point' : 'home_inspection';
                    await documentAPI.upload(draftPropertyId, [secondDocFile], [secondDocType]);
                    console.log('Second document uploaded successfully');
                } catch (uploadErr) {
                    console.error('Failed to upload second document:', uploadErr);
                    // Don't fail the whole flow if second doc upload fails
                }
            }

            setConfirmProgress('');
            setSuccess(true);
            setIsSubmitting(false);

            setTimeout(() => {
                router.push('/manage-properties');
            }, 2000);
        } catch (err) {
            console.error('Error confirming property:', err);
            setError(err instanceof Error ? err.message : 'Failed to confirm property. Please try again.');
            setConfirmProgress('');
            setIsSubmitting(false);
        }
    };



    const validatePdfReviewForm = (): boolean => {
        if (!formData.clientName.trim()) {
            setError('Client Name is required');
            return false;
        }
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
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
            setError('Please enter a valid Zip Code (e.g., 12345 or 12345-6789)');
            return false;
        }
        return true;
    };

    const validateManualForm = (): boolean => {
        if (!formData.clientName.trim()) {
            setError('Client Name is required');
            return false;
        }
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
        if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
            setError('Please enter a valid Zip Code (e.g., 12345 or 12345-6789)');
            return false;
        }
        if (!fourPointFile && !homeInspectionFile) {
            setError('At least one document is required. Please upload a 4-Point or Home Inspection file.');
            return false;
        }
        return true;
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateManualForm()) {
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

            setUploadProgress('Creating property...');

            const location = `${formData.city.trim()}, ${formData.state.trim()}`;

            const propertyData: CreatePropertyRequest = {
                property_name: formData.address.trim(),
                location: location,
                address: formData.address.trim(),
                zip_code: formData.zipCode.trim(),
                client_name: formData.clientName.trim(),
                inspection_date: formData.inspectionDate ? new Date(formData.inspectionDate).toISOString() : null,
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

                    setErrorModalTitle('Document Upload Failed');
                    setErrorModalMessage(errorMessage + '\n\nThe property was created successfully, but documents could not be uploaded.');
                    setShowErrorModal(true);

                    setIsSubmitting(false);
                    return;
                }

                setUploadProgress('Starting document processing...');

                try {
                    const processResult = await processAPI.start({
                        property_id: createdProperty.property_id,
                    });
                    console.log('Process started:', processResult);
                    setUploadProgress('Processing started successfully!');
                } catch (processError) {
                    console.error('Failed to start process:', processError);
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
                        )}
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

    // PDF Step 1: Upload
    const renderPdfUploadStep = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileUp className="w-8 h-8 text-[#00346C]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Property Document</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Select the document type and upload a PDF. We will automatically extract the property details for you.
                </p>
            </div>

            {/* Document Type Selector */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setPdfDocType('4point')}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        pdfDocType === '4point'
                            ? 'border-[#00346C] bg-blue-50 text-[#00346C]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                >
                    4-Point Inspection
                </button>
                <button
                    type="button"
                    onClick={() => setPdfDocType('home_inspection')}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        pdfDocType === 'home_inspection'
                            ? 'border-[#00346C] bg-blue-50 text-[#00346C]'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                >
                    Home Inspection
                </button>
            </div>

            <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfSelect}
                className="hidden"
                disabled={isExtracting}
            />

            {!pdfFile ? (
                <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isExtracting}
                    className={`w-full h-[200px] rounded-[16px] border-2 border-dashed border-[#00346C] bg-white hover:bg-[#F8FAFC] transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${isFormShaking ? 'animate-shake' : ''}`}
                >
                    <Upload className="w-10 h-10 text-[#00346C]" />
                    <span className="text-base font-medium text-[#00346C]">Click to Upload PDF</span>
                    <span className="text-xs text-[#9CA3AF]">
                        {pdfDocType === '4point' ? '4-Point Inspection report' : 'Home Inspection report'}
                    </span>
                </button>
            ) : (
                <div className="w-full rounded-[16px] border-2 border-solid border-[#10B981] bg-[#F0FDF4] p-6 relative">
                    <button
                        type="button"
                        onClick={removePdfFile}
                        disabled={isExtracting}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <FileText className="w-10 h-10 text-[#10B981]" />
                        <div>
                            <p className="text-sm font-medium text-[#10B981]">{pdfFile.name}</p>
                            <p className="text-xs text-gray-500">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                </div>
            )}

            {isExtracting && (
                <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#00346C]" />
                    <span className="text-sm text-[#00346C]">Extracting data from PDF...</span>
                </div>
            )}

            <Button
                type="button"
                onClick={handlePdfUpload}
                disabled={!pdfFile || isExtracting}
                className="w-full h-[48px] rounded-full text-white text-sm font-medium hover:opacity-90 transition-all duration-300"
                style={{ background: '#00346C', fontFamily: 'Roboto', fontWeight: 500 }}
            >
                {isExtracting ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting...
                    </span>
                ) : (
                    'Extract Data'
                )}
            </Button>
        </div>
    );

    // Shared property form fields (used by both PDF review and manual flow)
    const renderPropertyFormFields = (isPdfReview: boolean = false) => (
        <>
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

            {/* Row 3: Zip Code and Inspection Date */}
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
            <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                    Inspection Date
                </label>
                <Input
                    type="date"
                    name="inspectionDate"
                    value={formData.inspectionDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#00346C] focus-visible:border-[#00346C] disabled:opacity-50"
                />
            </div>

            {/* Additional CMA Fields - Accordion */}
            <div className="col-span-1 md:col-span-2 mt-4">
                <button
                    type="button"
                    onClick={() => setSpecsOpen(!specsOpen)}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors disabled:opacity-50"
                >
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#1E1E1E]">Property Specifications</h3>
                        <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${specsOpen ? 'rotate-180' : ''}`} />
                </button>

                {specsOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-white rounded-xl border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">Property Type</label>
                        <select
                            name="propertyType"
                            value={formData.propertyType}
                            onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm text-[#1E1E1E] focus:outline-none focus:ring-1 focus:ring-[#00346C] disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
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
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#374151] mb-2">Purchase Date</label>
                        <Input
                            type="date"
                            name="purchaseDate"
                            value={formData.purchaseDate}
                            onChange={handleInputChange}
                            disabled={isSubmitting}
                            className="h-[48px] w-full rounded-[8px] border border-[#D9D9D9] bg-white px-4 text-sm disabled:opacity-50"
                        />
                    </div>
                </div>
                )}
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
        </>
    );

    // PDF Step 2: Review & Confirm
    const renderPdfReviewStep = () => (
        <form onSubmit={handlePdfConfirm} className="w-full pb-10">
            {/* Back button */}
            <button
                type="button"
                onClick={() => {
                    setPdfStep(1);
                    setPdfFile(null);
                    setPdfDocType('home_inspection');
                    setSecondDocFile(null);
                    setExtractedData(null);
                    setDraftPropertyId(null);
                    setFormData({
                        address: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        clientName: '',
                        inspectionDate: '',
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
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 text-sm text-[#00346C] hover:text-[#002a56] mb-4 disabled:opacity-50"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Upload
            </button>

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Extracted Data</h3>
                <p className="text-sm text-gray-500">
                    We have extracted the following information from your PDF. Please review and edit as needed before confirming.
                </p>
            </div>

            {extractedData && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-[#00346C]" />
                        <span className="text-sm font-medium text-[#00346C]">{extractedData.document.doc_name}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {extractedData.document.doc_type.replace('_', ' ')}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-4 md:gap-y-6">
                {renderPropertyFormFields(true)}

                {/* Second Document Upload */}
                <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-[#6B7280] mb-3">Upload Second Document (Optional)</p>
                    <input
                        ref={secondDocInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleSecondDocSelect}
                        className="hidden"
                        disabled={isSubmitting}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Already uploaded document */}
                        {extractedData && (
                            <div className="h-[120px] rounded-[16px] border-2 border-solid border-[#10B981] bg-[#F0FDF4] flex flex-col items-center justify-center gap-2 relative">
                                <FileText className="w-6 h-6 text-[#10B981]" />
                                <span className="text-sm font-medium text-[#10B981] capitalize">
                                    {extractedData.document.doc_type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-[#6B7280] truncate max-w-[90%] px-2">{extractedData.document.doc_name}</span>
                            </div>
                        )}
                        {/* Second document upload slot */}
                        {!secondDocFile ? (
                            <button
                                type="button"
                                onClick={() => secondDocInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="w-full h-[120px] rounded-[16px] border-2 border-dashed border-[#00346C] bg-white hover:bg-[#F8FAFC] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Upload className="w-6 h-6 text-[#00346C]" />
                                <span className="text-sm font-medium text-[#00346C]">
                                    {extractedData?.document.doc_type === 'home_inspection' ? 'Upload 4-Point File' : 'Upload Home Inspection'}
                                </span>
                                <span className="text-xs text-[#9CA3AF]">PDF format only</span>
                            </button>
                        ) : (
                            <div className="w-full h-[120px] rounded-[16px] border-2 border-solid border-[#10B981] bg-[#F0FDF4] flex flex-col items-center justify-center gap-2 relative">
                                <button
                                    type="button"
                                    onClick={removeSecondDocFile}
                                    disabled={isSubmitting}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <FileText className="w-6 h-6 text-[#10B981]" />
                                <span className="text-sm font-medium text-[#10B981]">
                                    {extractedData?.document.doc_type === 'home_inspection' ? '4-Point File' : 'Home Inspection'}
                                </span>
                                <span className="text-xs text-[#6B7280] truncate max-w-[90%] px-2">{secondDocFile.name}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress */}
                {confirmProgress && (
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 text-sm text-[#00346C]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{confirmProgress}</span>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
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
                                Confirming...
                            </span>
                        ) : (
                            'Confirm Property'
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );

    // Manual Entry Form
    const renderManualForm = () => (
        <form onSubmit={handleManualSubmit} className="w-full pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-4 md:gap-y-6">
                {renderPropertyFormFields(false)}

                {/* Document Upload Section */}
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

                    {uploadProgress && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#00346C]">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{uploadProgress}</span>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
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
    );

    return (
        <div className="min-h-full bg-[#EBF0F7]">
            <div
                className="bg-white min-h-full rounded-t-[24px] md:rounded-tl-[32px] md:rounded-tr-none"
                style={{ marginTop: '0' }}
            >
                <div className="p-4 md:pt-[41px] md:px-[56px]">
                    {/* Page Title */}
                    <h2 className="text-lg md:text-[20px] font-semibold leading-tight md:leading-[30px] text-foreground mb-4 md:mb-[24px]">
                        Add New Property
                    </h2>

                    {/* Flow Selector Tabs */}
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl max-w-md">
                        <button
                            type="button"
                            onClick={() => setActiveFlow('pdf')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeFlow === 'pdf'
                                    ? 'bg-white text-[#00346C] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <FileUp className="w-4 h-4" />
                            Upload PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFlow('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                                activeFlow === 'manual'
                                    ? 'bg-white text-[#00346C] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Eye className="w-4 h-4" />
                            Manual Entry
                        </button>
                    </div>

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

                    {/* Form Content */}
                    {activeFlow === 'pdf' ? (
                        pdfStep === 1 ? renderPdfUploadStep() : renderPdfReviewStep()
                    ) : (
                        renderManualForm()
                    )}
                </div>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                            </div>

                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">
                                {errorModalTitle}
                            </h3>

                            <p className="text-gray-600 text-center whitespace-pre-line mb-6">
                                {errorModalMessage}
                            </p>

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

const AddPropertyPageWrapper = () => {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00346C]" />
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        }>
            <AddPropertyPage />
        </Suspense>
    );
};

export default AddPropertyPageWrapper;
