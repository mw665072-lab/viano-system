"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, FileText, AlertCircle, CheckCircle, ChevronDown, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { propertyAPI, BulkUploadQuotaResponse, BulkUploadResponse, BulkUploadItem, BulkUploadFailedItem, getCurrentUserId, documentAPI, ConfirmPropertyRequest } from '@/lib/api';
import NegotiatedWinsForm from '@/components/manage-properties/negotiated-wins-form';

interface SelectedFile {
    file: File;
    docType: '4point' | 'home_inspection';
}

interface DraftFormData {
    negotiatedWins: string;
    secondDocFile: File | null;
    isConfirming: boolean;
    isConfirmed: boolean;
}

interface BulkUploadProps {
    onNavigateToDraft?: (draftId: string) => void;
}

const BulkUpload = ({ onNavigateToDraft }: BulkUploadProps) => {
    const [quota, setQuota] = useState<BulkUploadQuotaResponse | null>(null);
    const [isCheckingQuota, setIsCheckingQuota] = useState(true);
    const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Review section states
    const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
    const [draftFormData, setDraftFormData] = useState<Record<string, DraftFormData>>({});
    const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
    const [isBulkConfirming, setIsBulkConfirming] = useState(false);
    const [bulkConfirmError, setBulkConfirmError] = useState<string | null>(null);

    // Check quota on mount
    useEffect(() => {
        const checkQuota = async () => {
            const userId = getCurrentUserId();
            if (!userId) {
                setError('Please login to use bulk upload');
                setIsCheckingQuota(false);
                return;
            }

            try {
                const quotaData = await propertyAPI.getBulkUploadQuota();
                setQuota(quotaData);
            } catch (err) {
                console.error('Error checking quota:', err);
                setError(err instanceof Error ? err.message : 'Failed to check upload quota');
            } finally {
                setIsCheckingQuota(false);
            }
        };
        checkQuota();
    }, []);

    // Initialize form data for each draft when upload result changes
    useEffect(() => {
        if (uploadResult?.successful) {
            const initialFormData: Record<string, DraftFormData> = {};
            uploadResult.successful.forEach(item => {
                if (item.property_id) {
                    initialFormData[item.property_id] = {
                        negotiatedWins: '',
                        secondDocFile: null,
                        isConfirming: false,
                        isConfirmed: false,
                    };
                }
            });
            setDraftFormData(initialFormData);
        }
    }, [uploadResult]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles = Array.from(e.target.files);
        const validFiles: SelectedFile[] = [];

        for (const file of newFiles) {
            if (file.type !== 'application/pdf') {
                setError(`File "${file.name}" is not a PDF. Only PDF files are allowed.`);
                continue;
            }
            validFiles.push({ file, docType: 'home_inspection' });
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            setError(null);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateDocType = (index: number, docType: '4point' | 'home_inspection') => {
        setSelectedFiles(prev => prev.map((item, i) =>
            i === index ? { ...item, docType } : item
        ));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to upload');
            return;
        }

        if (quota && selectedFiles.length > quota.remaining) {
            setError(`You can only upload ${quota.remaining} more properties based on your current plan`);
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const result = await propertyAPI.bulkUploadAndExtract(selectedFiles);
            console.log('Bulk upload result:', JSON.stringify(result, null, 2));
            console.log('Successful items:', result.successful);
            setUploadResult(result);
            setSelectedFiles([]);

            const newQuota = await propertyAPI.getBulkUploadQuota();
            setQuota(newQuota);
        } catch (err) {
            console.error('Bulk upload error:', err);
            setError(err instanceof Error ? err.message : 'Bulk upload failed. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetUpload = () => {
        setUploadResult(null);
        setSelectedFiles([]);
        setError(null);
        setExpandedDraft(null);
        setDraftFormData({});
        setSelectedDrafts(new Set());
    };

    // Toggle draft selection
    const toggleDraftSelection = (propertyId: string) => {
        setSelectedDrafts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(propertyId)) {
                newSet.delete(propertyId);
            } else {
                newSet.add(propertyId);
            }
            return newSet;
        });
    };

    // Select all drafts
    const selectAllDrafts = () => {
        if (!uploadResult?.successful) return;
        const allIds = uploadResult.successful
            .filter(item => item.property_id && !draftFormData[item.property_id]?.isConfirmed)
            .map(item => item.property_id!);
        setSelectedDrafts(new Set(allIds));
    };

    // Deselect all drafts
    const deselectAllDrafts = () => {
        setSelectedDrafts(new Set());
    };

    // Update draft form data
    const updateDraftFormData = (propertyId: string, updates: Partial<DraftFormData>) => {
        setDraftFormData(prev => ({
            ...prev,
            [propertyId]: {
                ...prev[propertyId],
                ...updates,
            },
        }));
    };

    // Get display name for failed item
    const getFailedItemName = (item: BulkUploadFailedItem | BulkUploadItem): string => {
        return 'filename' in item ? item.filename : 'Unknown file';
    };

    // Confirm single draft
    const handleConfirmDraft = async (item: BulkUploadItem) => {
        if (!item.property_id || !item.extracted) return;

        updateDraftFormData(item.property_id, { isConfirming: true });

        try {
            const confirmData: ConfirmPropertyRequest = {
                client_name: item.extracted.client_name,
                address: item.extracted.address,
                city: item.extracted.city,
                state: item.extracted.state,
                zip_code: item.extracted.zip_code,
                inspection_date: item.extracted.inspection_date,
                negotiated_wins: draftFormData[item.property_id]?.negotiatedWins || null,
            };

            await propertyAPI.confirm(item.property_id, confirmData);

            // Upload second document if provided
            const secondDoc = draftFormData[item.property_id]?.secondDocFile;
            if (secondDoc) {
                try {
                    // Determine the opposite doc type for the second document
                    const firstDocType = 'home_inspection'; // Default assumption
                    const secondDocType: '4point' | 'home_inspection' = firstDocType === 'home_inspection' ? '4point' : 'home_inspection';
                    await documentAPI.upload(item.property_id, [secondDoc], [secondDocType]);
                } catch (uploadErr) {
                    console.error('Failed to upload second document:', uploadErr);
                }
            }

            updateDraftFormData(item.property_id, { isConfirming: false, isConfirmed: true });
            setSelectedDrafts(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.property_id!);
                return newSet;
            });
        } catch (err) {
            console.error('Error confirming draft:', err);
            updateDraftFormData(item.property_id, { isConfirming: false });
            setError(err instanceof Error ? err.message : 'Failed to confirm draft');
        }
    };

    // Bulk confirm selected drafts
    const handleBulkConfirm = async () => {
        if (selectedDrafts.size === 0) return;

        setIsBulkConfirming(true);
        setBulkConfirmError(null);

        const selectedItems = uploadResult?.successful.filter(
            item => item.property_id && selectedDrafts.has(item.property_id)
        ) || [];

        let successCount = 0;
        let failCount = 0;

        for (const item of selectedItems) {
            if (!item.property_id || !item.extracted) continue;

            try {
                const confirmData: ConfirmPropertyRequest = {
                    client_name: item.extracted.client_name,
                    address: item.extracted.address,
                    city: item.extracted.city,
                    state: item.extracted.state,
                    zip_code: item.extracted.zip_code,
                    inspection_date: item.extracted.inspection_date,
                    negotiated_wins: draftFormData[item.property_id]?.negotiatedWins || null,
                };

                await propertyAPI.confirm(item.property_id, confirmData);

                // Upload second document if provided
                const secondDoc = draftFormData[item.property_id]?.secondDocFile;
                if (secondDoc) {
                    try {
                        const firstDocType = 'home_inspection';
                        const secondDocType: '4point' | 'home_inspection' = firstDocType === 'home_inspection' ? '4point' : 'home_inspection';
                        await documentAPI.upload(item.property_id, [secondDoc], [secondDocType]);
                    } catch (uploadErr) {
                        console.error('Failed to upload second document:', uploadErr);
                    }
                }

                updateDraftFormData(item.property_id, { isConfirmed: true });
                successCount++;
            } catch (err) {
                console.error('Error confirming draft:', err);
                failCount++;
            }
        }

        setSelectedDrafts(new Set());
        setIsBulkConfirming(false);

        if (failCount > 0) {
            setBulkConfirmError(`${successCount} confirmed, ${failCount} failed`);
        }
    };

    // Remove selected drafts (just deselects from UI, actual deletion happens in backend)
    const handleRemoveSelected = () => {
        // For now, just deselect - actual deletion would require backend API call
        setSelectedDrafts(new Set());
    };

    // Loading state
    if (isCheckingQuota) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#E8730A] mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Checking upload quota...</p>
            </div>
        );
    }

    // Results view
    if (uploadResult) {
        const unconfirmedDrafts = uploadResult.successful.filter(
            item => item.property_id && !draftFormData[item.property_id]?.isConfirmed
        );
        const confirmedDrafts = uploadResult.successful.filter(
            item => item.property_id && draftFormData[item.property_id]?.isConfirmed
        );

        return (
            <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-2xl p-6 border border-blue-100 dark:border-white/10">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Complete</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 rounded-xl p-4 text-center">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadResult.successful.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Successful</p>
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 rounded-xl p-4 text-center">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{uploadResult.failed_extraction.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Extraction Failed</p>
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 rounded-xl p-4 text-center">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadResult.failed_draft_creation.length}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Draft Creation Failed</p>
                        </div>
                        <div className="bg-white dark:bg-[#1a1a1a] dark:border dark:border-white/10 rounded-xl p-4 text-center">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{uploadResult.failed_s3_upload?.length || 0}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Upload Failed</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 text-center">
                        {uploadResult.quota_remaining} uploads remaining in your quota
                    </p>
                </div>

                {/* Bulk Actions for Unconfirmed Drafts */}
                {unconfirmedDrafts.length > 0 && (
                    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={selectedDrafts.size === unconfirmedDrafts.length ? deselectAllDrafts : selectAllDrafts}
                                    className="text-sm text-[#E8730A] hover:underline"
                                >
                                    {selectedDrafts.size === unconfirmedDrafts.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedDrafts.size} of {unconfirmedDrafts.length} selected
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {selectedDrafts.size > 0 && (
                                    <>
                                        <Button
                                            onClick={handleRemoveSelected}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/15"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Remove Selected
                                        </Button>
                                        <Button
                                            onClick={handleBulkConfirm}
                                            disabled={isBulkConfirming}
                                            size="sm"
                                            className="bg-[#E8730A] hover:bg-[#C45F08] text-white"
                                        >
                                            {isBulkConfirming ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Confirming...
                                                </span>
                                            ) : (
                                                <>
                                                    <CheckSquare className="w-4 h-4 mr-1" />
                                                    Confirm Selected ({selectedDrafts.size})
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        {bulkConfirmError && (
                            <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                                {bulkConfirmError}
                            </div>
                        )}
                    </div>
                )}

                {/* Successfully Created Drafts */}
                {uploadResult.successful.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Draft Properties ({uploadResult.successful.length})
                        </h4>
                        <div className="space-y-3">
                            {uploadResult.successful.map((item, index) => {
                                const isExpanded = expandedDraft === item.property_id;
                                const isConfirmed = draftFormData[item.property_id!]?.isConfirmed;
                                const isSelected = item.property_id ? selectedDrafts.has(item.property_id) : false;
                                const formData = draftFormData[item.property_id!];

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-xl border transition-all ${
                                            isConfirmed
                                                ? 'bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30'
                                                : isExpanded
                                                ? 'bg-white dark:bg-[#1a1a1a] border-[#E8730A] shadow-md'
                                                : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                        }`}
                                    >
                                        {/* Header Row */}
                                        <div className="flex items-center gap-3 p-4">
                                            {/* Checkbox */}
                                            {!isConfirmed && (
                                                <button
                                                    onClick={() => item.property_id && toggleDraftSelection(item.property_id)}
                                                    className="flex-shrink-0"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-[#E8730A]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Status Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isConfirmed ? 'bg-green-100 dark:bg-green-500/15' : 'bg-blue-100 dark:bg-blue-500/15'
                                            }`}>
                                                {isConfirmed ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                )}
                                            </div>

                                            {/* Extracted Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                        {item.extracted?.address || item.filename}
                                                    </p>
                                                    {isConfirmed && (
                                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                                            Confirmed
                                                        </span>
                                                    )}
                                                </div>
                                                {item.extracted && (
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">Client:</span> {item.extracted.client_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">City:</span> {item.extracted.city}, {item.extracted.state}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">ZIP:</span> {item.extracted.zip_code}
                                                        </span>
                                                        {item.extracted.inspection_date && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Inspection:</span> {new Date(item.extracted.inspection_date).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Review Button */}
                                            {!isConfirmed && (
                                                <Button
                                                    onClick={() => setExpandedDraft(isExpanded ? null : item.property_id!)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#E8730A] hover:bg-[#E8730A]/10 flex-shrink-0"
                                                >
                                                    {isExpanded ? 'Collapse' : 'Review'}
                                                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </Button>
                                            )}
                                        </div>

                                        {/* Expanded Review Section */}
                                        {isExpanded && !isConfirmed && (
                                            <div className="border-t border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                                                <div className="space-y-4">
                                                    {/* Extracted Data Summary */}
                                                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-white/10">
                                                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                                                            Extracted Property Details
                                                        </h5>
                                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Address:</span>
                                                                <p className="font-medium">{item.extracted?.address}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Client Name:</span>
                                                                <p className="font-medium">{item.extracted?.client_name}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">City:</span>
                                                                <p className="font-medium">{item.extracted?.city}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">State:</span>
                                                                <p className="font-medium">{item.extracted?.state}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">ZIP Code:</span>
                                                                <p className="font-medium">{item.extracted?.zip_code}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Inspection Date:</span>
                                                                <p className="font-medium">
                                                                    {item.extracted?.inspection_date
                                                                        ? new Date(item.extracted.inspection_date).toLocaleDateString()
                                                                        : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Negotiated Wins */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Negotiated Wins (Optional)
                                                        </label>
                                                        <NegotiatedWinsForm
                                                            value={formData?.negotiatedWins || ''}
                                                            onChange={(value) => item.property_id && updateDraftFormData(item.property_id, { negotiatedWins: value })}
                                                            disabled={formData?.isConfirming}
                                                        />
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Document any specific wins achieved during negotiation.
                                                        </p>
                                                    </div>

                                                    {/* Second Document Upload */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Second Document (Optional)
                                                        </label>
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file && item.property_id) {
                                                                    updateDraftFormData(item.property_id, { secondDocFile: file });
                                                                }
                                                            }}
                                                            className="hidden"
                                                            id={`second-doc-${item.property_id}`}
                                                        />
                                                        {!formData?.secondDocFile ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => document.getElementById(`second-doc-${item.property_id}`)?.click()}
                                                                className="w-full h-[80px] rounded-lg border-2 border-dashed border-gray-300 dark:border-white/15 dark:bg-white/5 hover:border-[#E8730A] transition-colors flex flex-col items-center justify-center gap-1"
                                                            >
                                                                <Upload className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                                                                <span className="text-xs text-gray-600 dark:text-gray-300">Upload 4-Point or Home Inspection</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2 p-3 bg-[#E8730A]/10 rounded-lg border border-[#E8730A]/30">
                                                                <FileText className="w-5 h-5 text-[#E8730A]" />
                                                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                                                                    {formData.secondDocFile.name}
                                                                </span>
                                                                <button
                                                                    onClick={() => item.property_id && updateDraftFormData(item.property_id, { secondDocFile: null })}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Confirm Button */}
                                                    <Button
                                                        onClick={() => handleConfirmDraft(item)}
                                                        disabled={formData?.isConfirming}
                                                        className="w-full bg-[#E8730A] hover:bg-[#C45F08] text-white"
                                                    >
                                                        {formData?.isConfirming ? (
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
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Confirmed Drafts Summary */}
                {confirmedDrafts.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-500/15 rounded-xl p-4 border border-green-200 dark:border-green-500/30">
                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-400 mb-2">
                            Confirmed Properties ({confirmedDrafts.length})
                        </h4>
                        <p className="text-xs text-green-700 dark:text-green-400">
                            These properties have been confirmed and are being processed. You can view them in your properties list.
                        </p>
                    </div>
                )}

                {/* Failed Extraction Items */}
                {uploadResult.failed_extraction.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Extraction Failed ({uploadResult.failed_extraction.length})
                        </h4>
                        <div className="space-y-2">
                            {uploadResult.failed_extraction.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/15 rounded-xl border border-amber-100 dark:border-amber-500/30">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.filename}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">{item.error || 'Could not extract data'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Failed Draft Creation Items */}
                {uploadResult.failed_draft_creation.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Draft Creation Failed ({uploadResult.failed_draft_creation.length})
                        </h4>
                        <div className="space-y-2">
                            {uploadResult.failed_draft_creation.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/15 rounded-xl border border-red-100 dark:border-red-500/30">
                                    <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.filename}</p>
                                        <p className="text-xs text-red-600 dark:text-red-400">{item.error || 'Could not create draft'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Failed S3 Upload Items */}
                {uploadResult.failed_s3_upload && uploadResult.failed_s3_upload.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            Upload Failed ({uploadResult.failed_s3_upload.length})
                        </h4>
                        <div className="space-y-2">
                            {uploadResult.failed_s3_upload.map((item, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-500/15 rounded-xl border border-orange-100 dark:border-orange-500/30">
                                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.filename}</p>
                                        <p className="text-xs text-orange-600 dark:text-orange-400">{item.error || 'Could not upload to storage'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={resetUpload}
                        variant="outline"
                        className="flex-1"
                    >
                        Upload More Files
                    </Button>
                    {confirmedDrafts.length > 0 && (
                        <Button
                            onClick={() => window.location.href = '/manage-properties'}
                            className="flex-1 bg-[#E8730A] hover:bg-[#C45F08] text-white"
                        >
                            View Confirmed Properties
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Main upload view
    return (
        <div className="space-y-6">
            {/* Quota Display */}
            {quota && (
                <div className={`p-4 rounded-xl border ${quota.can_bulk_upload ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-100 dark:border-blue-500/30' : 'bg-amber-50 dark:bg-amber-500/15 border-amber-100 dark:border-amber-500/30'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${quota.can_bulk_upload ? 'bg-blue-100 dark:bg-blue-500/15' : 'bg-amber-100 dark:bg-amber-500/15'}`}>
                            {quota.can_bulk_upload ? (
                                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${quota.can_bulk_upload ? 'text-blue-900 dark:text-blue-400' : 'text-amber-900 dark:text-amber-400'}`}>
                                {quota.can_bulk_upload
                                    ? `You can upload ${quota.remaining} more ${quota.remaining === 1 ? 'property' : 'properties'}`
                                    : 'Upload quota exceeded'}
                            </p>
                            <p className={`text-xs ${quota.can_bulk_upload ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {quota.current_count} of {quota.max_allowed} properties used
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* File Selection Area */}
            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading || !quota?.can_bulk_upload}
                />

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || !quota?.can_bulk_upload}
                    className="w-full h-[180px] rounded-[16px] border-2 border-dashed border-[#E8730A] bg-white dark:bg-white/5 hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Upload className="w-10 h-10 text-[#E8730A]" />
                    <span className="text-base font-medium text-[#E8730A]">
                        Click to Upload Multiple PDFs
                    </span>
                    <span className="text-xs text-[#9CA3AF] dark:text-gray-400">
                        Select one or more PDF files for bulk upload
                    </span>
                </button>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Selected Files ({selectedFiles.length})
                        </h4>
                        <button
                            onClick={() => setSelectedFiles([])}
                            className="text-xs text-red-500 hover:text-red-700"
                            disabled={isUploading}
                        >
                            Clear All
                        </button>
                    </div>

                    {selectedFiles.length > quota?.remaining! && (
                        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Warning: You have selected {selectedFiles.length} files but can only upload {quota?.remaining} based on your quota.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {selectedFiles.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {item.file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <select
                                    value={item.docType}
                                    onChange={(e) => updateDocType(index, e.target.value as '4point' | 'home_inspection')}
                                    disabled={isUploading}
                                    className="h-8 px-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#E8730A]"
                                >
                                    <option value="home_inspection">Home Inspection</option>
                                    <option value="4point">4-Point</option>
                                </select>
                                <button
                                    onClick={() => removeFile(index)}
                                    disabled={isUploading}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Upload Button */}
            <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading || !quota?.can_bulk_upload || selectedFiles.length > quota?.remaining!}
                className="w-full h-[48px] rounded-full text-white text-sm font-medium hover:opacity-90 transition-all duration-300"
                style={{ background: '#E8730A', fontFamily: 'Roboto', fontWeight: 500 }}
            >
                {isUploading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}...
                    </span>
                ) : (
                    `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`
                )}
            </Button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Each PDF will be processed to create a draft property. You can review and confirm each draft individually after upload.
            </p>
        </div>
    );
};

export default BulkUpload;
