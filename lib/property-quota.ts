// lib/property-quota.ts - Plan-limit and upload-slot helpers
//
// Two numbers to keep apart:
// - `remaining`: properties the user can still CONFIRM (plan limit − active). Drafts don't count.
// - upload slots: `remaining − pending_drafts`. Drafts DO block new uploads, so a user can never
//   hold more unconfirmed drafts than they could confirm.
//
// Every reader falls back to the pre-quota-hardening fields so the UI works against either
// backend version.

import {
    ApiError,
    BillingError,
    billingAPI,
    type BillingStatusResponse,
    type BulkUploadQuotaResponse,
    type QuotaLimitDetail,
} from '@/lib/api';

/** Properties counted against the plan ("X of Y used"). Drafts and transferred rows are excluded. */
export const usedProperties = (b: BillingStatusResponse): number =>
    b.active_properties ?? b.total_properties;

/** How many files the user can upload right now. */
export const uploadSlots = (q: BulkUploadQuotaResponse): number =>
    q.upload_slots ?? q.remaining;

/** Unconfirmed drafts the user already has. */
export const pendingDrafts = (q: BulkUploadQuotaResponse): number =>
    q.pending_drafts ?? 0;

/** True when unconfirmed drafts (not the plan limit) are what's blocking new uploads. */
export const draftsBlockUploads = (q: BulkUploadQuotaResponse): boolean =>
    uploadSlots(q) === 0 && q.remaining > 0;

/** Where the drafts banner sends the user. */
export const DRAFTS_LIST_HREF = '/manage-properties?status=Draft';

/** Copy for the drafts banner. */
export function draftsBlockingMessage(drafts: number): string {
    if (drafts <= 0) return 'Confirm or delete your unconfirmed properties to upload more.';
    return `You have ${drafts} unconfirmed ${drafts === 1 ? 'property' : 'properties'}. Confirm or delete ${drafts === 1 ? 'it' : 'them'} to upload more.`;
}

/** Which button a limit case should show. */
export type LimitAction = 'subscribe' | 'upgrade' | 'update_payment' | 'review_drafts';

const PLAN_LIMIT_MESSAGES: Record<LimitAction, string> = {
    subscribe: "You've used all your free properties. Subscribe to add more.",
    upgrade: "You've reached your plan's property limit. Upgrade to add more.",
    update_payment: 'Your last payment failed. Update your payment method to add more properties.',
    review_drafts: draftsBlockingMessage(0),
};

/** Default copy for a limit case when there's no backend message to show. */
export const planLimitMessage = (action: LimitAction): string => PLAN_LIMIT_MESSAGES[action];

export interface UploadBlocker {
    action: LimitAction;
    message: string;
}

/**
 * Why uploads are blocked right now, or null when the user has upload slots.
 * `planAction` is the resolved button for `remaining === 0` (see resolvePlanLimitAction).
 */
export function getUploadBlocker(q: BulkUploadQuotaResponse, planAction: LimitAction | null): UploadBlocker | null {
    if (uploadSlots(q) > 0) return null;
    if (q.remaining > 0) {
        return { action: 'review_drafts', message: draftsBlockingMessage(pendingDrafts(q)) };
    }
    const action = planAction ?? 'upgrade';
    return { action, message: planLimitMessage(action) };
}

/** Payload for a 402 from any endpoint (BillingError from uploads, ApiError from confirm/create). */
export function getPlanLimitError(err: unknown): { message: string; requiresSubscription: boolean } | null {
    if (err instanceof BillingError) {
        return { message: err.message, requiresSubscription: err.requiresSubscription };
    }
    if (err instanceof ApiError && err.status === 402) {
        const detail = err.detail as Partial<QuotaLimitDetail> | null;
        return {
            message: err.message,
            requiresSubscription: !!(detail && typeof detail === 'object' && detail.requires_subscription),
        };
    }
    return null;
}

/** Pick the button for a billing status when the plan limit (not drafts) is the blocker. */
export function limitActionFromStatus(status: BillingStatusResponse | null): LimitAction {
    if (status?.subscription?.status === 'past_due') return 'update_payment';
    if (status && !status.has_subscription) return 'subscribe';
    return 'upgrade';
}

/**
 * Resolve the button for a 402. `requires_subscription: true` → Subscribe. Otherwise it's either a
 * subscriber at their plan limit or a failed payment; billing status tells those apart.
 * Pass `undefined` when there's no 402 to read (e.g. the quota already shows `remaining: 0`).
 */
export async function resolvePlanLimitAction(requiresSubscription?: boolean): Promise<LimitAction> {
    if (requiresSubscription === true) return 'subscribe';
    let status: BillingStatusResponse | null = null;
    try {
        status = await billingAPI.getStatus();
    } catch {
        // Fall through to the safest generic choice below.
    }
    if (status?.subscription?.status === 'past_due') return 'update_payment';
    if (requiresSubscription === undefined) return limitActionFromStatus(status);
    return 'upgrade';
}
