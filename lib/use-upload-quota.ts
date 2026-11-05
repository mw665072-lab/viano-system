"use client";

import { useCallback, useEffect, useState } from 'react';
import { propertyAPI, getFriendlyErrorMessage, type BulkUploadQuotaResponse } from '@/lib/api';
import {
    getUploadBlocker,
    resolvePlanLimitAction,
    uploadSlots,
    type LimitAction,
    type UploadBlocker,
} from '@/lib/property-quota';

interface UseUploadQuotaResult {
    quota: BulkUploadQuotaResponse | null;
    isLoading: boolean;
    error: string | null;
    /** Files the user can upload now (0 until the quota loads). */
    slots: number;
    /** Why uploads are blocked, or null. Null while loading or if the quota couldn't load. */
    blocker: UploadBlocker | null;
    /** Refetch the quota (after an upload, a delete, or a 400/402). Resolves to the new quota or null. */
    refresh: () => Promise<BulkUploadQuotaResponse | null>;
}

const QUOTA_ERROR = "We couldn't check how many properties you can upload.";

/** Fetch the quota and, when it's exhausted, which limit button applies. */
async function fetchQuota(): Promise<{ quota: BulkUploadQuotaResponse; planAction: LimitAction | null }> {
    const quota = await propertyAPI.getBulkUploadQuota();
    // Resolve the button up front so the banner never flashes the wrong one.
    const planAction = quota.remaining === 0 ? await resolvePlanLimitAction() : null;
    return { quota, planAction };
}

/**
 * Loads the upload quota (GET /api/property/bulk-upload/quota) and works out which limit
 * button to show when it's exhausted. Pass `enabled: false` to skip the initial fetch.
 */
export function useUploadQuota(enabled = true): UseUploadQuotaResult {
    const [quota, setQuota] = useState<BulkUploadQuotaResponse | null>(null);
    const [planAction, setPlanAction] = useState<LimitAction | null>(null);
    const [isLoading, setIsLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const result = await fetchQuota();
            setPlanAction(result.planAction);
            setQuota(result.quota);
            setError(null);
            return result.quota;
        } catch (err) {
            setError(getFriendlyErrorMessage(err, QUOTA_ERROR));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        fetchQuota().then(
            (result) => {
                if (cancelled) return;
                setPlanAction(result.planAction);
                setQuota(result.quota);
                setError(null);
                setIsLoading(false);
            },
            (err) => {
                if (cancelled) return;
                setError(getFriendlyErrorMessage(err, QUOTA_ERROR));
                setIsLoading(false);
            },
        );
        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return {
        quota,
        isLoading,
        error,
        slots: quota ? uploadSlots(quota) : 0,
        blocker: quota ? getUploadBlocker(quota, planAction) : null,
        refresh,
    };
}
