"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, X, FileText, AlertCircle, CheckCircle, ChevronDown, Trash2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { propertyAPI, BulkUploadQuotaResponse, BulkUploadResponse, BulkUploadItem, BulkUploadFailedItem, getCurrentUserId, documentAPI, ConfirmPropertyRequest } from '@/lib/api';
import NegotiatedWinsForm from '@/components/manage-properties/negotiated-wins-form';

interface SelectedFile {
    file: File;
    docType: '4point' | 'home_inspection';
}

interface DraftFormData {
    // Editable extracted fields
    clientName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    inspectionDate: string;
    negotiatedWins: string;
    secondDocFile: File | null;
    isConfirming: boolean;
    isConfirmed: boolean;
}

interface BulkUploadProps {
    onNavigateToDraft?: (draftId: string) => void;
    onReviewingChange?: (reviewing: boolean) => void;
}

type DocType = '4point' | 'home_inspection';

const DOC_TYPE_LABELS: Record<DocType, string> = {
    '4point': '4-Point Inspection',
    home_inspection: 'Home Inspection',
};

// Normalize whatever the backend returns into a known doc type (defaults to home inspection)
const normalizeDocType = (docType?: string | null): DocType =>
    docType === '4point' ? '4point' : 'home_inspection';

// The "missing" second document is the complement of the first/primary document
const getMissingDocType = (firstDocType?: string | null): DocType =>
    normalizeDocType(firstDocType) === '4point' ? 'home_inspection' : '4point';

// Convert an extracted date string into a value an <input type="date"> accepts (yyyy-MM-dd)
const toDateInputValue = (value?: string | null): string => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Format a date for display without timezone shifting (yyyy-MM-dd -> MM/DD/YYYY)
const formatDateDisplay = (value?: string | null): string => {
    if (!value) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return `${m[2]}/${m[3]}/${m[1]}`;
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString();
};

const BulkUpload = ({ onNavigateToDraft, onReviewingChange }: BulkUploadProps) => {
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

    // Notify parent when entering/leaving the review (results) state
    useEffect(() => {
        onReviewingChange?.(!!uploadResult);
    }, [uploadResult, onReviewingChange]);

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
                        clientName: item.extracted?.client_name || '',
                        address: item.extracted?.address || '',
                        city: item.extracted?.city || '',
                        state: item.extracted?.state || '',
                        zipCode: item.extracted?.zip_code || '',
                        inspectionDate: toDateInputValue(item.extracted?.inspection_date),
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

    // Build the confirm payload from the user-edited fields, falling back to extracted values
    const buildConfirmData = (item: BulkUploadItem): ConfirmPropertyRequest => {
        const fd = item.property_id ? draftFormData[item.property_id] : undefined;
        return {
            client_name: fd?.clientName ?? item.extracted?.client_name,
            address: fd?.address ?? item.extracted?.address,
            city: fd?.city ?? item.extracted?.city,
            state: fd?.state ?? item.extracted?.state,
            zip_code: fd?.zipCode ?? item.extracted?.zip_code,
            inspection_date: fd?.inspectionDate || item.extracted?.inspection_date,
            negotiated_wins: fd?.negotiatedWins || null,
        };
    };

    // Confirm single draft
    const handleConfirmDraft = async (item: BulkUploadItem) => {
        if (!item.property_id || !item.extracted) return;

        updateDraftFormData(item.property_id, { isConfirming: true });

        try {
            const confirmData = buildConfirmData(item);

            await propertyAPI.confirm(item.property_id, confirmData);

            // Upload second document if provided (the complement of the primary doc type)
            const secondDoc = draftFormData[item.property_id]?.secondDocFile;
            if (secondDoc) {
                try {
                    const secondDocType = getMissingDocType(item.doc_type);
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
                const confirmData = buildConfirmData(item);

                await propertyAPI.confirm(item.property_id, confirmData);

                // Upload second document if provided (the complement of the primary doc type)
                const secondDoc = draftFormData[item.property_id]?.secondDocFile;
                if (secondDoc) {
                    try {
                        const secondDocType = getMissingDocType(item.doc_type);
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
            <div className="space-y-6">
                {/* Quota banner skeleton */}
                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-56" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </div>

                {/* Dropzone skeleton */}
                <Skeleton className="w-full h-[180px] rounded-[16px]" />
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
            <div className="space-y-5">
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
                        <div className="space-y-3">
                            {uploadResult.successful.map((item, index) => {
                                const isExpanded = expandedDraft === item.property_id;
                                const isConfirmed = draftFormData[item.property_id!]?.isConfirmed;
                                const isSelected = item.property_id ? selectedDrafts.has(item.property_id) : false;
                                const formData = draftFormData[item.property_id!];
                                const primaryDocLabel = DOC_TYPE_LABELS[normalizeDocType(item.doc_type)];
                                const missingDocLabel = DOC_TYPE_LABELS[getMissingDocType(item.doc_type)];

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
                                                        {formData?.address || item.extracted?.address || item.filename}
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
                                                            <span className="font-medium">Client:</span> {formData?.clientName || item.extracted.client_name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">City:</span> {formData?.city || item.extracted.city}, {formData?.state || item.extracted.state}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-medium">ZIP:</span> {formData?.zipCode || item.extracted.zip_code}
                                                        </span>
                                                        {(formData?.inspectionDate || item.extracted.inspection_date) && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                <span className="font-medium">Inspection:</span> {formatDateDisplay(formData?.inspectionDate || item.extracted.inspection_date)}
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
                                                    {/* Editable Property Details */}
                                                    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-gray-200 dark:border-white/10">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                                                Property Details
                                                            </h5>
                                                            <span className="text-[11px] text-gray-400 dark:text-gray-500">Review &amp; edit before confirming</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="col-span-2">
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Address</label>
                                                                <Input
                                                                    value={formData?.address ?? item.extracted?.address ?? ''}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { address: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                    placeholder="Street address"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Client Name</label>
                                                                <Input
                                                                    value={formData?.clientName ?? item.extracted?.client_name ?? ''}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { clientName: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                    placeholder="Client name"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">City</label>
                                                                <Input
                                                                    value={formData?.city ?? item.extracted?.city ?? ''}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { city: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                    placeholder="City"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">State</label>
                                                                <Input
                                                                    value={formData?.state ?? item.extracted?.state ?? ''}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { state: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                    placeholder="State"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ZIP Code</label>
                                                                <Input
                                                                    value={formData?.zipCode ?? item.extracted?.zip_code ?? ''}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { zipCode: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                    placeholder="ZIP code"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Inspection Date</label>
                                                                <Input
                                                                    type="date"
                                                                    value={formData?.inspectionDate ?? toDateInputValue(item.extracted?.inspection_date)}
                                                                    onChange={(e) => item.property_id && updateDraftFormData(item.property_id, { inspectionDate: e.target.value })}
                                                                    disabled={formData?.isConfirming}
                                                                />
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

                                                    {/* Second Document Upload — the document type missing from this property */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Missing Document — {missingDocLabel} (Optional)
                                                        </label>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                            We detected a {primaryDocLabel}. Add the matching {missingDocLabel} to complete this property.
                                                        </p>
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
                                                                className="w-full min-h-[80px] py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/15 dark:bg-white/5 hover:border-[#E8730A] transition-colors flex flex-col items-center justify-center gap-1"
                                                            >
                                                                <Upload className="w-5 h-5 text-gray-400 dark:text-gray-400" />
                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Upload {missingDocLabel}</span>
                                                                <span className="text-[11px] text-gray-400 dark:text-gray-500">PDF only</span>
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-3 p-3 bg-[#E8730A]/10 rounded-lg border border-[#E8730A]/30">
                                                                <div className="w-9 h-9 rounded-lg bg-[#E8730A]/15 flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="w-5 h-5 text-[#E8730A]" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                                                        {formData.secondDocFile.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {missingDocLabel} · {(formData.secondDocFile.size / 1024 / 1024).toFixed(2)} MB
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => item.property_id && updateDraftFormData(item.property_id, { secondDocFile: null })}
                                                                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                                                                    aria-label="Remove document"
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
