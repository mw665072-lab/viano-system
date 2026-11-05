// lib/api.ts - API Service Layer for VianoSystems
// Updated to match exact backend OpenAPI schemas
// Includes JWT refresh token handling and 401 interceptor

// Base API URL - Uses environment variable
// Note: NEXT_PUBLIC_ variables are bundled at build time in Next.js
function getApiBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
        const errorMsg = 
            'NEXT_PUBLIC_API_URL environment variable is not set. ' +
            'Please configure it in your Vercel environment variables and redeploy.';
        
        if (typeof window !== 'undefined') {
            console.error('❌', errorMsg);
        }
        throw new Error(errorMsg);
    }
    
    // Ensure the URL doesn't end with a slash
    return apiUrl.replace(/\/$/, '');
}

const API_BASE_URL = getApiBaseUrl();

// ngrok free tier serves an HTML interstitial without CORS headers unless this is sent
const NGROK_HEADERS: HeadersInit =
    API_BASE_URL.includes('ngrok') ? { 'ngrok-skip-browser-warning': 'true' } : {};

function buildFetchHeaders(overrides: HeadersInit = {}, withJson = true): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    return {
        ...(withJson ? { 'Content-Type': 'application/json' } : {}),
        ...NGROK_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...overrides,
    };
}

// Mutex and state for token refreshing
let isRefreshing = false;
let failedQueue: { resolve: (value: string | null) => void; reject: (reason?: any) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

/**
 * Error thrown by apiRequest for any non-OK response.
 * Extends Error (so existing `instanceof Error` / `.message` handling keeps working)
 * while also carrying the HTTP `status` and the parsed `detail` payload, so callers
 * can react to structured responses such as the 409 property-conflict body.
 */
export class ApiError extends Error {
    status: number;
    detail: unknown;
    constructor(message: string, status: number, detail: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

/**
 * Pull a human-readable message out of a parsed error body without ever producing
 * "[object Object]". Handles FastAPI's string `detail`, validation-error arrays of
 * `{ msg }`, and object `detail` payloads (e.g. the conflict body, which carries the
 * prompt under `message`/`prompt`).
 */
function extractApiErrorMessage(body: unknown): string | undefined {
    if (body == null) return undefined;
    if (typeof body === 'string') return body;
    if (typeof body !== 'object') return String(body);

    const obj = body as Record<string, unknown>;
    const detail = obj.detail;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        // FastAPI validation errors: [{ msg, loc, type }, ...]
        const msgs = detail
            .map(d => (d && typeof d === 'object' && typeof (d as Record<string, unknown>).msg === 'string')
                ? String((d as Record<string, unknown>).msg)
                : null)
            .filter((m): m is string => Boolean(m));
        if (msgs.length) return msgs.join(', ');
    }

    if (detail && typeof detail === 'object') {
        const d = detail as Record<string, unknown>;
        for (const key of ['message', 'prompt', 'detail', 'error']) {
            if (typeof d[key] === 'string') return d[key] as string;
        }
    }

    for (const key of ['message', 'error']) {
        if (typeof obj[key] === 'string') return obj[key] as string;
    }

    return undefined;
}

/**
 * Turn a failed multipart upload response into a typed error. A 402 (plan limit) becomes a
 * BillingError carrying `requires_subscription`; anything else becomes an ApiError so callers
 * can branch on `status` (e.g. the 400 returned when unconfirmed drafts fill the upload slots).
 */
async function throwUploadError(response: Response, fallback: string): Promise<never> {
    let body: unknown = null;
    try {
        body = await response.json();
    } catch {
        // Non-JSON (or empty) error body
    }
    const message = extractApiErrorMessage(body) ?? fallback;
    const detail = (body && typeof body === 'object' && 'detail' in (body as Record<string, unknown>))
        ? (body as Record<string, unknown>).detail
        : body;

    if (response.status === 402) {
        const requiresSubscription = !!(detail && typeof detail === 'object'
            && (detail as Partial<QuotaLimitDetail>).requires_subscription);
        throw new BillingError(message, requiresSubscription, detail);
    }
    throw new ApiError(message, response.status, detail);
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = buildFetchHeaders();

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    let response = await fetch(url, config);

    // Initial 401 interceptor
    if (response.status === 401 && endpoint !== '/api/auth/login' && endpoint !== '/api/auth/signup' && endpoint !== '/api/auth/refresh') {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        if (!refreshToken) {
            // No refresh token, force logout (and come back here after logging in)
            if (typeof window !== 'undefined') {
                clearAuth();
                window.location.href = loginUrlForCurrentPage();
            }
            throw new Error('Authentication required');
        }

        if (isRefreshing) {
            // If already refreshing, wait in queue for the new token
            try {
                const newToken = await new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });

                if (newToken) {
                    // Token refreshed successfully by another request, retry this one with new token
                    const retryConfig: RequestInit = {
                        ...config,
                        headers: {
                            ...config.headers,
                            'Authorization': `Bearer ${newToken}`,
                        },
                    };
                    response = await fetch(url, retryConfig);
                }
            } catch (err) {
                throw new Error('Token refresh failed queue');
            }
        } else {
            // We are the first one to hit 401, start the refresh process
            isRefreshing = true;

            try {
                const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: buildFetchHeaders(),
                    body: JSON.stringify({ refresh_token: refreshToken }),
                });

                if (!refreshResponse.ok) {
                    throw new Error('Refresh token invalid or expired');
                }

                const refreshData = await refreshResponse.json();
                const newAccessToken = refreshData.access_token;

                if (typeof window !== 'undefined' && newAccessToken) {
                    localStorage.setItem('authToken', newAccessToken);
                }

                // Process the queue and let other requests know
                processQueue(null, newAccessToken);

                // Retry original request
                const retryConfig: RequestInit = {
                    ...config,
                    headers: {
                        ...config.headers,
                        'Authorization': `Bearer ${newAccessToken}`,
                    },
                };
                response = await fetch(url, retryConfig);

            } catch (err) {
                // Refresh failed completely
                processQueue(err as Error, null);
                if (typeof window !== 'undefined') {
                    clearAuth();
                    window.location.href = loginUrlForCurrentPage();
                }
                throw new Error('Session expired. Please log in again.');
            } finally {
                isRefreshing = false;
            }
        }
    }

    if (!response.ok) {
        let body: unknown = null;
        try {
            body = await response.json();
        } catch {
            // Non-JSON (or empty) error body
        }
        const message = extractApiErrorMessage(body) ?? `HTTP Error: ${response.status}`;
        // Preserve the structured payload so callers can read e.g. the 409 conflict fields.
        const detail = (body && typeof body === 'object' && 'detail' in (body as Record<string, unknown>))
            ? (body as Record<string, unknown>).detail
            : body;
        throw new ApiError(message, response.status, detail);
    }

    return response.json();
}

// ============ AUTHENTICATION APIs =============
export const authAPI = {
    /**
     * Register a new user
     * - Create user in Clerk
     * - Store user data in AWS RDS
     */
    signup: (data: SignUpRequest) =>
        apiRequest<SignUpResponse>('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Authenticate user
     * - Verify credentials with Clerk
     * - Fetch user data from RDS
     * - Update last_login timestamp
     */
    login: (data: LoginRequest) =>
        apiRequest<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Fetch user data from RDS (JWT-based)
     */
    getUser: () =>
        apiRequest<UserResponse>('/api/auth/user/me'),

    /**
     * Update user profile (JWT-based)
     */
    updateUser: (data: UpdateUserRequest) =>
        apiRequest<UpdateUserResponse>('/api/auth/user/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Refresh the access token
     */
    refresh: (refreshToken: string) =>
        apiRequest<{ access_token: string }>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        }),

    /**
     * Send OTP to email or phone before registration (no auth required)
     */
    sendPreRegisterOTP: (data: PreRegisterSendOTPRequest) =>
        apiRequest<PreRegisterSendOTPResponse>('/api/auth/otp/preregister/send', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Send email OTP for post-login verification (Bearer auth)
     */
    sendEmailOTP: () =>
        apiRequest<PreRegisterSendOTPResponse>('/api/auth/otp/email/send', {
            method: 'POST',
        }),

    /**
     * Verify email OTP (Bearer auth)
     */
    verifyEmailOTP: (data: VerifyEmailOTPRequest) =>
        apiRequest<VerifyEmailOTPResponse>('/api/auth/otp/email/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Send phone OTP for post-login verification (Bearer auth)
     */
    sendPhoneOTP: () =>
        apiRequest<PreRegisterSendOTPResponse>('/api/auth/otp/phone/send', {
            method: 'POST',
        }),

    /**
     * Verify phone OTP (Bearer auth)
     */
    verifyPhoneOTP: (data: VerifyPhoneOTPRequest) =>
        apiRequest<VerifyPhoneOTPResponse>('/api/auth/otp/phone/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Request OTP for phone number update (Bearer auth)
     */
    requestPhoneUpdateOTP: (data: UpdatePhoneRequest) =>
        apiRequest<PreRegisterSendOTPResponse>('/api/auth/user/me/phone/update/request-otp', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Confirm phone number update with OTP (Bearer auth)
     */
    confirmPhoneUpdate: (data: UpdatePhoneRequest) =>
        apiRequest<UpdatePhoneResponse>('/api/auth/user/me/phone/update', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Record or revoke the agent's TCPA consent to receive automated SMS alerts (Bearer auth).
     * Until consent is `true`, the backend dispatches no property-alert texts to this agent.
     * Always pass `consent_text` (use SMS_CONSENT_TEXT) on an affirmative opt-in so the exact
     * disclosure the user saw is stored for the audit trail.
     */
    setSmsConsent: (data: SmsConsentRequest) =>
        apiRequest<SmsConsentResponse>('/api/auth/user/me/sms-consent', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============ PROPERTY APIs ============
export const propertyAPI = {
    /**
     * Create a new property for a user
     * Stores data in RDS according to Property schema
     */
    create: (data: CreatePropertyRequest) =>
        apiRequest<PropertyResponse>('/api/property/create', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Get all properties for the current user (JWT-based)
     */
    getUserProperties: () =>
        apiRequest<PropertyResponse[]>('/api/property/my-properties'),

    /**
     * Get a specific property for the current user by ID (JWT-based)
     */
    getProperty: (propertyId: string) =>
        apiRequest<PropertyResponse>(`/api/property/my-properties/${propertyId}`),

    /**
     * Delete a property for the current user (JWT-based)
     * Only the owner can delete their property
     * Cascades deletion to related documents, processes, and messages
     */
    delete: (propertyId: string) =>
        apiRequest<string>(`/api/property/my-properties/${propertyId}`, {
            method: 'DELETE',
        }),

    /**
     * Update property details (JWT-based)
     * Allows updating property fields including negotiated_wins
     */
    update: (propertyId: string, data: Partial<CreatePropertyRequest>) =>
        apiRequest<PropertyResponse>(`/api/property/my-properties/${propertyId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    /**
     * Reset and reprocess a property (JWT-based)
     * This endpoint:
     * - Deletes all existing documents (from S3 and RDS)
     * - Deletes all related processes, messages, and engine results
     * - Uploads new documents to S3 and stores metadata in RDS
     * - Starts a new processing pipeline
     * Returns immediately with process_id for tracking.
     */
    resetAndReprocess: async (
        propertyId: string,
        files: File[],
        docTypes: ('4point' | 'home_inspection')[]
    ): Promise<{ process_id: string }> => {
        const formData = new FormData();

        // Add files
        files.forEach(file => formData.append('files', file));

        // Build query params for doc_types
        const params = new URLSearchParams();
        docTypes.forEach(dt => params.append('doc_types', dt));

        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/property/my-properties/${propertyId}/reset-and-reprocess${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: buildFetchHeaders({}, false),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to reset and reprocess' }));
            throw new Error(error.detail || 'Failed to reset and reprocess');
        }

        return response.json();
    },

    /**
     * Upload a PDF and extract property data (PDF-first flow)
     * Creates a draft property with extracted data
     *
     * Errors (checked before the upload is accepted):
     * - 402 → BillingError: no confirmable slots left (plan limit / past_due)
     * - 400 → ApiError: unconfirmed drafts fill the remaining slots, OR a bad file / doc_type.
     *   Don't parse the text — refetch the quota to tell them apart.
     */
    uploadAndExtract: async (file: File, docType: '4point' | 'home_inspection' = 'home_inspection'): Promise<UploadAndExtractResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${API_BASE_URL}/api/property/upload-and-extract?doc_type=${encodeURIComponent(docType)}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: buildFetchHeaders({}, false),
        });

        // Accept 202 Accepted as success (async processing)
        if (response.status !== 202 && !response.ok) {
            await throwUploadError(response, 'Failed to upload and extract PDF');
        }

        return response.json();
    },

    /**
     * Poll /my-properties until a new draft property appears.
     * Returns the most recently created draft, or null if none found within maxAttempts.
     */
    pollForNewDraft: async (maxAttempts = 30, intervalMs = 2000): Promise<PropertyResponse | null> => {
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, intervalMs));

            try {
                const properties = await propertyAPI.getUserProperties();
                const drafts = properties
                    .filter(p => p.is_draft)
                    .sort((a, b) => {
                        if (a.created_at && b.created_at) {
                            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                        }
                        return 0;
                    });

                if (drafts.length > 0) {
                    return drafts[0];
                }
            } catch (err) {
                console.error('Polling error:', err);
                // Continue polling on transient errors
            }
        }
        return null;
    },

    /**
     * Confirm a draft property with edited data and optional negotiated wins
     * Starts the processing pipeline automatically
     */
    confirm: (propertyId: string, data: ConfirmPropertyRequest) =>
        apiRequest<ConfirmPropertyResponse>(`/api/property/my-properties/${propertyId}/confirm`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Edit property documents (legacy - use resetAndReprocess for better handling) (JWT-based)
     * - Remove existing documents by providing document IDs
     * - Upload new documents with their types
     */
    editDocuments: async (
        propertyId: string,
        options: {
            documentsToRemove?: string[];
            files?: File[];
            docTypes?: ('4point' | 'home_inspection')[];
        }
    ): Promise<string> => {
        const formData = new FormData();

        // Add files if provided
        if (options.files) {
            options.files.forEach(file => formData.append('files', file));
        }

        // Build query params
        const params = new URLSearchParams();
        if (options.documentsToRemove) {
            options.documentsToRemove.forEach(id => params.append('documents_to_remove', id));
        }
        if (options.docTypes) {
            options.docTypes.forEach(dt => params.append('doc_types', dt));
        }

        const queryString = params.toString();
        const url = `${API_BASE_URL}/api/property/my-properties/${propertyId}/documents${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'PUT',
            body: formData,
            headers: buildFetchHeaders({}, false),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to edit documents' }));
            throw new Error(error.detail || 'Failed to edit documents');
        }

        return response.json();
    },

    /**
     * Batch-read every active property's stored CMA in a single call.
     * This is the primary list/dashboard call: it reads from the DB only (no external API),
     * so it's fast and free to call on every page load. `comps` is omitted (always null) to
     * keep the payload small — use getCMA for comparables. Properties that could not be valued
     * at all are omitted from the array, so map by `property_id` and treat a missing entry as
     * "valuation pending / unavailable".
     */
    getCMABatch: () =>
        apiRequest<CMAResponse[]>('/api/property/cma'),

    /**
     * Get the stored CMA for a single property.
     * Reads from the DB; only does a live fetch if the property has never been valued.
     * - 404 if the property is not found or not owned by the user
     * - 503 if there is no stored valuation and the live fetch fails
     */
    getCMA: (propertyId: string) =>
        apiRequest<CMAResponse>(`/api/property/my-properties/${propertyId}/cma`),

    /**
     * Force a live valuation fetch ("Get latest value"), store it, and return the fresh CMA
     * (with comps). This is the only user-facing call that hits the external API, so it's
     * slower (~1–3s — show a spinner) and costs an API credit. Wire it to an explicit button,
     * never an automatic refresh.
     * - 404 if the property is not found or not owned
     * - 503 if the live fetch failed
     */
    refreshCMA: (propertyId: string) =>
        apiRequest<CMAResponse>(`/api/property/my-properties/${propertyId}/cma/refresh`, {
            method: 'POST',
        }),

    /**
     * Get the upload quota for the current user. Call before opening any upload (single or
     * bulk). Read slots via `uploadSlots()` from lib/property-quota — drafts count against
     * uploads even though they don't count against the plan limit.
     */
    getBulkUploadQuota: () =>
        apiRequest<BulkUploadQuotaResponse>('/api/property/bulk-upload/quota'),

    /**
     * Bulk upload and extract multiple PDFs
     * Creates draft properties for each successfully extracted PDF.
     * Rejected up front when there are more files than upload slots: same 402 (BillingError) /
     * 400 (ApiError) as uploadAndExtract.
     */
    bulkUploadAndExtract: async (
        items: Array<{ file: File; docType: '4point' | 'home_inspection' }>
    ): Promise<BulkUploadResponse> => {
        const formData = new FormData();
        items.forEach(item => formData.append('files', item.file));

        // Send doc_types as comma-separated string (e.g., "4point,home_inspection")
        const docTypes = items.map(i => i.docType);
        formData.append('doc_types', docTypes.join(','));

        const url = `${API_BASE_URL}/api/property/bulk-upload-and-extract`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: buildFetchHeaders({}, false),
        });

        if (!response.ok) {
            await throwUploadError(response, 'Bulk upload failed');
        }

        return response.json();
    },

    /**
     * Get all properties with systems requiring action (critical/budgeting window)
     */
    getRequiringAction: () =>
        apiRequest<RequiringActionProperty[]>('/api/property/requiring-action'),

    /**
     * Dismiss a flagged system so it no longer appears in requiring-action
     */
    dismissSystem: (systemId: string) =>
        apiRequest<DismissSystemResponse>(`/api/property/systems/${systemId}/dismiss`, {
            method: 'POST',
        }),

    /**
     * Restore a previously dismissed system
     */
    restoreSystem: (systemId: string) =>
        apiRequest<RestoreSystemResponse>(`/api/property/systems/${systemId}/restore`, {
            method: 'POST',
        }),

    /**
     * Get all scheduled alerts (messages with status scheduled_twilio)
     * Returns alerts sorted by scheduled_for descending (most recent first)
     */
    getScheduledAlerts: () =>
        apiRequest<ScheduledAlert[]>('/api/property/scheduled-alerts'),

    /**
     * Get upcoming touchpoints count and list for the next N days (default 180)
     */
    getUpcomingTouchpoints: (days = 180) =>
        apiRequest<UpcomingTouchpointsResponse>(`/api/property/upcoming-touchpoints?days=${days}`),

    /**
     * Get the full detail for a single touchpoint / scheduled alert.
     * Includes the complete client message, realtor context, best-effort CMA,
     * and top local contractor referrals — powers the alert detail modal.
     */
    getTouchpointDetail: (messageId: string) =>
        apiRequest<TouchpointDetailResponse>(`/api/property/touchpoints/${messageId}`),

    /**
     * Generate (or reuse) the personalized anniversary card for a card-eligible
     * anniversary touchpoint. Image generation can take a few seconds on first
     * view; the result is cached in S3 per message for fast repeat views.
     */
    getAnniversaryCard: (messageId: string) =>
        apiRequest<AnniversaryCardResponse>(`/api/property/touchpoints/${messageId}/anniversary-card`),

    /**
     * Get property opportunities with appreciation data
     * Returns properties where current price > last sale price, sorted by highest gain first
     */
    getOpportunities: () =>
        apiRequest<PropertyOpportunitiesResponse>('/api/property/opportunities'),
};

// ============ OUTREACH (MONTHLY MESSAGE QUEUE) APIs ============
// The list endpoints and getCard are pure database reads. prepare() may look up a local event
// once per draft version. getRecommendations() is a paid Google Places call on every request.
export const outreachAPI = {
    /** Month summary. Omit `month` for the current month (America/New_York). */
    getMonth: (month?: string) =>
        apiRequest<OutreachMonthResponse>(`/api/outreach${month ? `?month=${encodeURIComponent(month)}` : ''}`),

    /** One property's updates for the month, in date order. 404 if it isn't yours or was transferred. */
    getPropertyMonth: (propertyId: string, month?: string) =>
        apiRequest<OutreachPropertyMonthResponse>(
            `/api/outreach/properties/${encodeURIComponent(propertyId)}${month ? `?month=${encodeURIComponent(month)}` : ''}`),

    /** The card. Never paid; works in any month, before or after contact. */
    getCard: (itemId: string) =>
        apiRequest<OutreachCard>(`/api/outreach/items/${encodeURIComponent(itemId)}`),

    /** Renders and saves the homeowner draft only if it's missing or stale. Idempotent. 409 `withdrawn`. */
    prepare: (itemId: string) =>
        apiRequest<OutreachCard>(`/api/outreach/items/${encodeURIComponent(itemId)}/prepare`, { method: 'POST' }),

    /** The saved draft text for copying. Records nothing. 409 `withdrawn` | `draft_not_ready` | `draft_stale`. */
    copy: (itemId: string) =>
        apiRequest<OutreachCopyResponse>(`/api/outreach/items/${encodeURIComponent(itemId)}/copy`, { method: 'POST' }),

    /**
     * Mark contacted. `contactedOn` is "YYYY-MM-DD" (defaults to today, Eastern). Idempotent for the
     * same date. 409 `already_contacted` | `withdrawn`; 422 `future_date`.
     */
    complete: (itemId: string, contactedOn?: string) =>
        apiRequest<OutreachCompleteResponse>(`/api/outreach/items/${encodeURIComponent(itemId)}/complete`, {
            method: 'POST',
            body: JSON.stringify(contactedOn ? { contacted_on: contactedOn } : {}),
        }),

    /** Paid Google Places call on every request: call on an explicit tap only, never prefetch or store. */
    getRecommendations: (itemId: string) =>
        apiRequest<OutreachRecommendations>(`/api/outreach/items/${encodeURIComponent(itemId)}/recommendations`),

    /** Recently contacted, newest first, across months. `limit` is 1–200. */
    getContacted: (limit = 50) =>
        apiRequest<OutreachContactedResponse>(`/api/outreach/contacted?limit=${limit}`),
};

// ============ SYSTEMS APIs ============
export const systemsAPI = {
    /**
     * Get all systems for a property with ages and alert tiers
     */
    getSystems: (propertyId: string) =>
        apiRequest<SystemResponse[]>(`/api/property/my-properties/${propertyId}/systems`),

    /**
     * Reset a system's age after replacement
     */
    resetSystemAge: (propertyId: string, systemId: string, data: ResetSystemRequest) =>
        apiRequest<ResetSystemResponse>(`/api/property/my-properties/${propertyId}/systems/${systemId}/reset`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Get replacement history for a system
     */
    getReplacementHistory: (propertyId: string, systemId: string) =>
        apiRequest<ReplacementEventResponse[]>(`/api/property/my-properties/${propertyId}/systems/${systemId}/history`),

    /**
     * Update system age (MFG year or direct age)
     */
    updateSystemAge: (propertyId: string, systemId: string, data: UpdateSystemAgeRequest) =>
        apiRequest<UpdateSystemAgeResponse>(`/api/property/my-properties/${propertyId}/systems/${systemId}/age`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Undo an age reset
     */
    undoReset: (propertyId: string, systemId: string, data: UndoResetRequest) =>
        apiRequest<UndoResetResponse>(`/api/property/my-properties/${propertyId}/systems/${systemId}/undo-reset`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Add a manual system
     */
    addManualSystem: (propertyId: string, data: AddManualSystemRequest) =>
        apiRequest<SystemResponse>(`/api/property/my-properties/${propertyId}/systems/add-manual`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Add default systems (Water Heater + A/C + Roof)
     */
    addDefaultSystems: (propertyId: string, data: AddDefaultSystemsRequest) =>
        apiRequest<AddDefaultSystemsResponse>(`/api/property/my-properties/${propertyId}/systems/add-defaults`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Edit a system's descriptive fields (partial update).
     * Only send the fields you want to change. Use "" for name/brand to clear them.
     * The response is a summary — refetch getSystems() for the full row.
     */
    editSystem: (propertyId: string, systemId: string, data: EditSystemRequest) =>
        apiRequest<EditSystemResponse>(`/api/property/my-properties/${propertyId}/systems/${systemId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Delete a system (cascades to replacement history and pending alerts).
     */
    deleteSystem: (propertyId: string, systemId: string) =>
        apiRequest<DeleteSystemResponse>(`/api/property/my-properties/${propertyId}/systems/${systemId}`, {
            method: 'DELETE',
        }),
};

// ============ BILLING APIs ============
export const billingAPI = {
    /**
     * Get full billing overview for the current user (JWT-based)
     */
    getStatus: () =>
        apiRequest<BillingStatusResponse>('/api/billing/status'),

    /**
     * Check if the current user is allowed to add another property (JWT-based)
     */
    canAddProperty: () =>
        apiRequest<CanAddPropertyResponse>('/api/billing/can-add-property'),

    /**
     * Create a Stripe Checkout Session for a new subscription on the given
     * individual plan (JWT-based)
     */
    createCheckoutSession: (plan: PlanSlug = 'core') =>
        apiRequest<{ checkout_url: string }>('/api/billing/create-checkout-session', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),

    /**
     * Preview proration for switching plans (existing subscription only).
     */
    previewPlanChange: (plan: PlanSlug) =>
        apiRequest<PlanChangePreviewResponse>('/api/billing/preview-plan-change', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),

    /**
     * Switch an existing subscription to a different individual plan (JWT-based).
     * Pass proration_date from previewPlanChange so the charge matches the preview.
     */
    changePlan: (plan: PlanSlug, prorationDate: number) =>
        apiRequest<ChangePlanResponse>('/api/billing/change-plan', {
            method: 'POST',
            body: JSON.stringify({ plan, proration_date: prorationDate }),
        }),

    /**
     * Public individual-plan catalog (pricing metadata for the upgrade UI)
     */
    getPlans: () =>
        apiRequest<{ plans: PlanInfo[] }>('/api/billing/plans'),

    /**
     * Cancel subscription at the end of the current billing period (JWT-based)
     */
    cancel: () =>
        apiRequest<any>('/api/billing/cancel', {
            method: 'POST',
        }),

    /**
     * Get a Stripe Customer Portal URL (JWT-based)
     */
    getPortalLink: () =>
        apiRequest<{ portal_url: string }>('/api/billing/portal'),
};

// ============ DOCUMENT APIs ============
export const documentAPI = {
    /**
     * Upload one or more PDF documents (JWT-based)
     * - Validate file types and doc_types
     * - Verify property exists and belongs to user
     * - Upload to S3 with structure: {user_id}/{property_id}/{filename}
     * - Store metadata in RDS
     * 
     * @param files - Array of files to upload
     * @param docTypes - Array of document types matching each file: '4point' or 'home_inspection'
     * 
     * Example usage:
     * Upload both 4point and home_inspection at once by providing:
     * files: [4point.pdf, home_inspection.pdf]
     * docTypes: ["4point", "home_inspection"]
     */
    upload: async (
        propertyId: string,
        files: File[],
        docTypes: ('4point' | 'home_inspection')[]
    ) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const docTypesParam = docTypes.map(dt => `doc_types=${encodeURIComponent(dt)}`).join('&');
        const url = `${API_BASE_URL}/api/documents/upload/${propertyId}?${docTypesParam}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: buildFetchHeaders({}, false),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail || 'Failed to upload document');
        }

        return response.json();
    },

    /**
     * Get all documents for a property (JWT-based)
     */
    getPropertyDocuments: (propertyId: string) =>
        apiRequest<DocumentResponse[]>(`/api/documents/property/${propertyId}`),

    /**
     * Delete a document from S3 and RDS (JWT-based)
     */
    delete: (propertyId: string, documentId: string) =>
        apiRequest<string>(`/api/documents/${propertyId}/${documentId}`, {
            method: 'DELETE',
        }),
};

// ============ PROCESS APIs ============
export const processAPI = {
    /**
     * Start the processing pipeline for a property
     * Returns immediately with process_id. The actual processing runs in the background.
     * 
     * Flow:
     * 1. Creates process record (returns immediately with process_id)
     * 2. Background: Downloads documents from S3 (10%)
     * 3. Background: Parses with 4-Point and Home Inspection engines (50%)
     * 4. Background: Generates personalized messages (90%)
     * 5. Background: Stores results in database (100%)
     */
    start: (data: StartProcessRequest) =>
        apiRequest<string>('/api/process/start', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Get the current status and progress of a process
     */
    getStatus: (processId: string) =>
        apiRequest<ProcessStatusResponse>(`/api/process/status/${processId}`),

    /**
     * Get all messages generated by a process
     */
    getMessages: (processId: string) =>
        apiRequest<MessageResponse[]>(`/api/process/messages/${processId}`),

    /**
     * Get all engine results for a process
     */
    getEngineResults: (processId: string) =>
        apiRequest<EngineResultResponse[]>(`/api/process/engine-results/${processId}`),

    /**
     * Get all processes for the current user (JWT-based)
     */
    getUserProcesses: () =>
        apiRequest<ProcessSummaryResponse[]>('/api/process/my-processes'),

    /**
     * Delete a specific message by ID
     */
    deleteMessage: (messageId: string) =>
        apiRequest<string>(`/api/process/messages/${messageId}`, {
            method: 'DELETE',
        }),

    /**
     * SSE endpoint for real-time process status updates
     * Keeps the connection open and pushes updates every second until:
     * - Process reaches 100% progress, or
     * - Process status becomes 'completed' or 'error'
     * 
     * Returns an EventSource. Use like:
     * const eventSource = processAPI.statusStream(processId);
     * eventSource.onmessage = (event) => {
     *   const data = JSON.parse(event.data);
     *   console.log(data.progress, data.status);
     * };
     * eventSource.onerror = () => eventSource.close();
     */
    statusStream: (processId: string): EventSource => {
        const url = `${API_BASE_URL}/api/process/status-stream/${processId}`;
        return new EventSource(url);
    },
};

// ============ TWILIO APIs ============
export const twilioAPI = {
    /**
     * Manually trigger the daily scheduling job
     * Triggers the logic that looks for today's messages and schedules them.
     * Useful for testing or recovering from missed runs.
     */
    triggerSchedule: () =>
        apiRequest<string>('/twilio/trigger-schedule', {
            method: 'POST',
        }),
};

// ============ UTILITY APIs ============
export const utilityAPI = {
    /**
     * Check if server is running
     */
    health: () => apiRequest<string>('/health'),

    /**
     * Home endpoint
     */
    home: () => apiRequest<string>('/'),
};

// ============ TYPE DEFINITIONS ============
// Matching exact OpenAPI schemas

// Auth Types
export interface SignUpRequest {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    phone_otp: string;
    email_otp?: string;
}

export interface SignUpResponse {
    success: boolean;
    user_id: string;
    message: string;
    access_token?: string; // JWT token returned after signup
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    access_token: string; // JWT token required for future requests
    refresh_token?: string; // JWT token required for refreshing access_token
}

export interface UserResponse {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    last_login: string | null;
    role: string;
    stripe_customer_id?: string | null;
    email_verified?: boolean;
    phone_verified?: boolean;
    /** Whether the agent has given express consent to receive automated property-alert SMS. */
    sms_consent?: boolean;
}

export interface UpdateUserRequest {
    first_name?: string;
    last_name?: string;
    mobile_number?: string;
}

export interface UpdateUserResponse {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    role: string;
}

// OTP Types
export interface PreRegisterSendOTPRequest {
    email?: string;
    phone?: string;
}

export interface PreRegisterSendOTPResponse {
    success: boolean;
    message: string;
}

export interface VerifyEmailOTPRequest {
    code: string;
}

export interface VerifyEmailOTPResponse {
    success: boolean;
    message: string;
    email_verified: boolean;
}

export interface VerifyPhoneOTPRequest {
    code: string;
}

export interface VerifyPhoneOTPResponse {
    success: boolean;
    message: string;
    phone_verified: boolean;
}

export interface UpdatePhoneRequest {
    new_phone: string;
    otp: string;
}

export interface UpdatePhoneResponse {
    success: boolean;
    message: string;
    user: UserResponse;
}

// TCPA SMS Consent Types
export interface SmsConsentRequest {
    /** TCPA express opt-in (true) or revocation (false). */
    consent: boolean;
    /**
     * The exact disclosure text shown to the user, stored for the audit trail.
     * Pass `null`/omit to keep any previously stored text (the backend won't overwrite it).
     */
    consent_text?: string | null;
}

export interface SmsConsentResponse {
    success: boolean;
    message: string;
    sms_consent: boolean;
}

// Property Types
export interface CreatePropertyRequest {
    property_name: string;
    location: string;
    address: string;
    zip_code?: string | null;
    client_name: string;
    negotiated_wins?: string | null;
    city?: string | null;
    state?: string | null;
    /** Last recorded sale price; drives appreciation. Optional — may be entered manually. */
    last_sale_price?: number | null;
    /** ISO date of the last sale, e.g. "2010-04-16". */
    last_sale_date?: string | null;
}

export interface PropertyResponse {
    property_id: string;
    property_name: string;
    location: string;
    address: string;
    zip_code: string | null;
    client_name: string;
    inspection_date: string | null;
    negotiated_wins: string | null;
    city: string | null;
    state: string | null;
    user_id: string;
    is_draft?: boolean;
    created_at?: string;
    /** Lifecycle of the registration. "transferred" means another agent took it over. */
    status?: 'active' | 'transferred';
    /** ISO datetime of the handoff, or null while active. */
    transferred_at?: string | null;
    /** Last recorded sale price (captured at extraction, editable at review). Drives appreciation. */
    last_sale_price?: number | null;
    /** ISO date of the last sale, e.g. "2010-04-16". May be empty when the provider has no history. */
    last_sale_date?: string | null;
}

// PDF-First Flow Types
export interface ExtractedPropertyData {
    client_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    inspection_date: string;
    /** Last sale price from v3 Comps — may be empty (no provider history); editable at review. */
    last_sale_price?: number | null;
    /** Last sale date (ISO) from v3 Comps — may be empty; editable at review. */
    last_sale_date?: string | null;
}

export interface UploadedDocument {
    document_id: string;
    doc_name: string;
    doc_type: string;
    s3_path: string;
}

export interface UploadAndExtractResponse {
    upload_id: string;
    message: string;
    filename: string;
    doc_type: string;
}

export interface ConfirmPropertyRequest {
    client_name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    inspection_date?: string;
    negotiated_wins?: string | null;
    /** Reviewed last sale price. Optional — omit to keep what was extracted. */
    last_sale_price?: number | null;
    /** Reviewed last sale date (ISO). Optional — omit to keep what was extracted. */
    last_sale_date?: string | null;
    /**
     * Set true to override an existing agent's active plan for the same address.
     * Only succeeds when this inspection date is strictly newer than the existing one;
     * otherwise the backend re-rejects with 409.
     */
    confirm_conflict?: boolean;
}

/**
 * Shape of the `detail` payload returned by POST /confirm with a 409 status when the
 * address is already registered to another agent's active plan.
 * (FastAPI nests this under `detail`.)
 */
export interface PropertyConflict {
    conflict?: boolean;
    requires_confirmation?: boolean;
    /** true → safe to show the takeover confirmation; false → inspection isn't newer. */
    can_override?: boolean;
    /** Verbatim wording to show the agent. */
    message?: string;
    existing_inspection_date?: string | null;
    new_inspection_date?: string | null;
}

/** A previous-agent plan that was terminated by a successful takeover. */
export interface TerminatedProperty {
    property_id: string;
    terminated_pending_messages?: number;
    /** Messages already handed to Twilio that cannot be recalled and may still send. */
    scheduled_twilio_count?: number;
}

export interface ConfirmPropertyResponse {
    success: boolean;
    process_id: string;
    status: string;
    property_id: string;
    /** Present and true only when a takeover (confirm_conflict: true) succeeded. */
    ownership_transferred?: boolean;
    terminated_properties?: TerminatedProperty[];
    /** Non-recallable Twilio messages from the previous plan; surface to the agent if present. */
    warning?: string;
}

// Document Types
export interface DocumentResponse {
    doc_id: string;
    user_id: string;
    property_id: string;
    doc_type: string;
    doc_url: string;
    created_at: string | null;
}

// Process Types
export interface StartProcessRequest {
    property_id: string;
}

export interface ProcessStatusResponse {
    process_id: string;
    status: string;
    progress: number | null;
    process_start: string | null;
    process_end: string | null;
}

export interface ProcessSummaryResponse {
    process_id: string;
    property_id: string;
    status: string;
    progress: number | null;
    process_start: string | null;
    process_end: string | null;
}

export interface MessageResponse {
    message_id: string;
    message_text: string;
    status: string;
    scheduled_for: string | null;
    created_at: string | null;
    priority_level: number | null;
    priority: any;
    trigger?: string | null;
    trigger_date?: string | null;
    realtor_alert?: {
        title?: string;
        body?: {
            realtor_context?: string;
            client_sample_message?: string;
            referrals?: string;
        };
        priority?: string;
    } | null;
}

export interface EngineResultResponse {
    engine_result_id: string;
    doc_id: string;
    status: string;
    json_result_preview: string;
}

// Systems Types
export interface ReplacementEventResponse {
    event_id: string;
    replacement_date: string;
    previous_age_at_inspection: number;
    new_age_at_inspection: number;
    event_type: 'full_replacement' | 'age_adjustment';
    notes: string | null;
    created_at: string;
    undone_at: string | null;
}

export interface SystemResponse {
    system_id: string;
    system_type: string;
    name: string | null;
    brand: string | null;
    age_at_inspection: number | null;
    current_age: number | null;
    lifespan_min: number;
    lifespan_max: number;
    alert_tier: string | null;
    percentage_used: number | null;
    mfg_year: number | null;
    age_unknown: boolean;
    replacement_history: ReplacementEventResponse[];
}

export interface ResetSystemRequest {
    replacement_date?: string;
    notes?: string;
    event_type?: 'full_replacement' | 'age_adjustment';
    adjusted_age?: number;
}

export interface ResetSystemResponse {
    success: boolean;
    system_id: string;
    new_age_at_inspection: number;
    previous_age_at_inspection: number;
    replacement_date: string;
    new_alert_count: number;
    process_id: string;
}

export interface UpdateSystemAgeRequest {
    mfg_year?: number;
    age?: number;
}

export interface UpdateSystemAgeResponse {
    success: boolean;
    system_id: string;
    age_at_inspection: number;
    previous_age_at_inspection: number | null;
    mfg_year: number;
    current_age: number;
    new_alert_count: number;
    process_id: string;
}

export interface UndoResetRequest {
    event_id: string;
}

export interface UndoResetResponse {
    success: boolean;
    event_id: string;
    system_id: string;
    restored_age_at_inspection: number;
    previous_age_at_inspection: number;
    deleted_alert_count: number;
}

export interface AddManualSystemRequest {
    system_type: string;
    name?: string;
    mfg_year?: number | null;
    age?: number | null;
    brand?: string;
}

export interface AddDefaultSystemsRequest {
    water_heater_mfg_year?: number;
    water_heater_age?: number | null;
    water_heater_brand?: string;
    hvac_units?: Array<{ name: string; mfg_year: number; brand: string }>;
    roof_type: 'shingle' | 'tile' | 'metal';
    roof_mfg_year?: number;
    roof_age?: number | null;
}

export interface AddDefaultSystemsResponse {
    success: boolean;
    created: Array<{ system_type: string; name?: string; system_id: string }>;
    skipped: Array<{ system_type: string; reason: string }>;
    message: string;
}

export interface EditSystemRequest {
    system_type?: string;
    /** Send "" to clear; omit/null to leave unchanged. */
    name?: string | null;
    /** Send "" to clear; omit/null to leave unchanged. */
    brand?: string | null;
    /** Water-heater tankless flag. Toggling changes lifespan (8 → 20 yrs). */
    is_tankless?: boolean;
}

export interface EditSystemResponse {
    success: boolean;
    system_id: string;
    system_type: string;
    name: string | null;
    brand: string | null;
    is_tankless: boolean;
    lifespan_min: number;
    lifespan_max: number;
    alert_tier: string | null;
    percentage_used: number | null;
    /** Informational: alert touchpoints regenerated; null if no completed schedule yet. */
    new_alert_count: number | null;
    process_id: string | null;
}

export interface DeleteSystemResponse {
    success: boolean;
    system_id: string;
    system_type: string;
    deleted_alert_count: number;
    /** Alerts already handed to Twilio — may still send (same-day window). */
    superseded_alert_count: number;
}

// Requiring Action Types
export interface FlaggedSystem {
    system_id: string;
    system_type: string;
    name: string | null;
    alert_tier: string;
    current_age: number;
    lifespan_min: number;
    percentage_used: number;
    action_label: string;
    timeframe: string;
}

export interface RequiringActionProperty {
    property_id: string;
    property_name: string;
    address: string;
    location: string;
    client_name: string;
    flagged_systems: FlaggedSystem[];
}

export interface DismissSystemResponse {
    success: boolean;
    system_id: string;
    dismissed_at: string;
}

export interface RestoreSystemResponse {
    success: boolean;
    system_id: string;
    restored: boolean;
}

// Scheduled Alerts Types
export interface ScheduledAlert {
    message_id: string;
    property_id: string;
    property_address: string;
    client_name: string;
    alert_type: string;
    priority: number;
    scheduled_for: string;
    status: string;
    trigger: string;
}

export interface UpcomingTouchpointItem {
    message_id: string;
    property_id: string;
    property_address: string;
    client_name: string;
    alert_type: string;
    priority: number;
    scheduled_for: string;
    trigger: string;
    viano_year: number;
    days_from_upload: number;
}

export interface UpcomingTouchpointsResponse {
    count: number;
    days: number;
    touchpoints: UpcomingTouchpointItem[];
}

export interface ContractorReferral {
    name: string;
    rating: number | null;
    phone: string | null;
    address: string | null;
    website: string | null;
}

export interface TouchpointDetailResponse {
    message_id: string;
    property_id: string;
    property_address: string;
    client_name: string;
    alert_type: string;
    trigger: string | null;
    priority: number | null;
    status: string;
    scheduled_for: string | null;
    viano_year: number | null;
    days_from_upload: number | null;
    /** The finished, send-ready client message (placeholders resolved). Prefer this. */
    client_message: string;
    /** The raw stored SMS template (may contain unresolved placeholders). */
    message_text: string;
    /** Why-this-matters context written for the agent (not sent to the client). */
    realtor_context: string | null;
    /** The exact suggested message to send the client. */
    client_sample_message: string | null;
    /** Legacy/embedded referral text stored on the alert, if any. */
    referrals: string | null;
    requires_cma: boolean;
    requires_community_event: boolean;
    /** Best-effort property valuation (may be null if unavailable). */
    cma: CMAResponse | null;
    /** Top local contractors for this alert (empty when not applicable). */
    contractors: ContractorReferral[];
    /** Milestone year (1/3/5/7/10) if this is a card-eligible anniversary message, else null. */
    anniversary_year: number | null;
}

export interface AnniversaryCardResponse {
    message_id: string;
    eligible: boolean;
    milestone_year: number | null;
    /** Short-lived URL to the generated card image, or null if unavailable. */
    card_url: string | null;
}

// ---- Outreach (monthly message queue) ----

/** check_in | system_alert | anniversary | insurance | home_value | maintenance | negotiated_win | intro | other */
export type OutreachKind =
    | 'check_in' | 'system_alert' | 'anniversary' | 'insurance' | 'home_value'
    | 'maintenance' | 'negotiated_win' | 'intro' | 'other';

/** Dates are "YYYY-MM-DD" (date only). Timestamps are ISO-8601 with a timezone. */
export interface OutreachPropertyRow {
    property_id: string;
    address: string;
    homeowner: string;
    /** Includes overdue carry-over. */
    pending_count: number;
    overdue_count: number;
    new_count: number;
    next_outreach_on: string;
}

export interface OutreachMonthResponse {
    month: string;                  // "YYYY-MM"
    pending_update_count: number;   // includes overdue carry-over
    overdue_update_count: number;   // carried over from earlier months (current month only)
    new_update_count: number;       // added after this month's text was sent
    property_count: number;
    properties: OutreachPropertyRow[];
}

export interface OutreachListItem {
    item_id: string;
    outreach_on: string;
    kind: OutreachKind;
    title: string;
    trigger: string | null;
    priority: number | null;
    homeowner: string;
    /** Why it's due (Realtor-facing context). */
    reason: string | null;
    overdue: boolean;
    new: boolean;
}

export interface OutreachPropertyMonthResponse {
    month: string;
    property_id: string;
    address: string;
    homeowner: string;
    pending_count: number;
    overdue_count: number;
    new_count: number;
    items: OutreachListItem[];
}

export type OutreachDraftStatus = 'ready' | 'not_prepared' | 'stale';

export interface OutreachContact {
    contacted_on: string;
    recorded_at: string;
}

export interface OutreachCard {
    item_id: string;
    property_id: string;
    address: string;
    homeowner: string;
    month: string | null;
    outreach_on: string | null;
    kind: OutreachKind;
    title: string;
    trigger: string | null;
    priority: number | null;
    reason: string | null;
    /** Ended by a property transfer, replaced by a system reset, or on billing hold. */
    withdrawn: boolean;
    /** `text` is only present when status is 'ready'. */
    draft: { status: OutreachDraftStatus; text: string | null; rendered_at: string | null };
    /** Whether contractor recommendations apply (fetch them with getRecommendations). */
    recommendations_available: boolean;
    anniversary_year: number | null;
    /** Set once marked contacted. */
    contact: OutreachContact | null;
}

export interface OutreachCopyResponse { item_id: string; text: string; draft_rendered_at: string; }

export interface OutreachCompleteResponse {
    item_id: string;
    contact_event_id: string;
    contacted_on: string;
    recorded_at: string;
    /** True when this repeated an earlier "Mark contacted" with the same date. */
    already_recorded: boolean;
}

export interface OutreachRecommendations {
    item_id: string;
    available: boolean;                 // false: no relevant trade (e.g. a check-in)
    trade: string | null;               // e.g. "HVAC contractor"
    contractors: ContractorReferral[];  // same shape as the existing ContractorReferral
    copy_text: string | null;           // ready-to-copy list; null when there are no results
}

export interface OutreachContactedItem {
    /** null when a later schedule change removed the update: show it, but don't make it clickable. */
    item_id: string | null;
    property_id: string;
    address: string;
    homeowner: string;
    title: string;
    kind: OutreachKind;
    outreach_on: string | null;
    month: string | null;
    contacted_on: string;
    recorded_at: string;
}

export interface OutreachContactedResponse { count: number; items: OutreachContactedItem[]; }

/** Codes carried in ApiError.detail.code for 409/422 responses from the outreach endpoints. */
export type OutreachErrorCode =
    | 'withdrawn' | 'draft_not_ready' | 'draft_stale' | 'already_contacted' | 'future_date';

export interface PropertyOpportunityItem {
    property_id: string;
    property_name: string;
    address: string;
    location: string;
    client_name: string;
    current_price: number;
    last_sale_price: number;
    last_sale_date: string;
    appreciation_amount: number;
    appreciation_percentage: number;
    formatted_gain: string;
}

export interface PropertyOpportunitiesResponse {
    total_opportunities: number;
    properties: PropertyOpportunityItem[];
}

// Billing Types
export type PlanSlug = 'core' | 'pro' | 'elite';

export interface PlanInfo {
    slug: PlanSlug;
    name: string;
    monthly_price: number;
    property_limit: number;
}

export interface PlanChangeLineItem {
    description: string;
    amount: number;
    currency: string;
    proration: boolean;
}

export interface PlanChangePreviewResponse {
    plan: PlanSlug;
    plan_name: string;
    current_plan: PlanSlug;
    current_plan_name: string;
    currency: string;
    /** Proration total charged today (not the next full billing period). */
    amount_due: number;
    subtotal: number;
    total: number;
    proration_date: number;
    lines: PlanChangeLineItem[];
    next_renewal_amount?: number | null;
    next_renewal_description?: string | null;
    next_billing_date?: string | null;
}

export interface ChangePlanResponse {
    changed: boolean;
    plan: PlanSlug;
    plan_name?: string;
    monthly_cost?: number;
    property_limit?: number;
    reason?: string;
}

/** Billing hold reason on a subscription (drives message suspension). */
export type BillingHold = 'past_due' | 'canceled' | null;

export interface SubscriptionResponse {
    subscription_id: string;
    stripe_subscription_id: string;
    status: string;
    /** True when the subscription is set to cancel at the end of the current period. */
    cancel_at_period_end: boolean;
    /** Why scheduled messages are on hold, or null when none. */
    billing_hold: BillingHold;
    current_period_start: string | null;
    current_period_end: string | null;
    monthly_cost: number;
    plan: PlanSlug;
    plan_name: string;
}

export interface BillingStatusResponse {
    user_id: string;
    /** Every property row, drafts and transferred included. Not the plan usage — see active_properties. */
    total_properties: number;
    /**
     * Live properties: the count the plan limit uses. Optional until the quota-hardening
     * backend deploys; read it via `usedProperties()` (falls back to total_properties).
     */
    active_properties?: number;
    free_property_limit?: number;
    has_subscription: boolean;
    subscription: SubscriptionResponse | null;
    monthly_cost: number;
    plan: PlanSlug | 'free';
    plan_name: string;
    property_limit: number;
    /** Count of scheduled messages currently paused for billing reasons. */
    suspended_message_count: number;
}

/** Response from GET /api/billing/can-add-property. */
export interface CanAddPropertyResponse {
    allowed: boolean;
    reason: string;
    requires_subscription: boolean;
    /** Present and true when the block is due to a failed payment (past_due). */
    past_due?: boolean;
}

/**
 * 409 detail returned by preview-plan-change / change-plan when a downgrade would
 * leave the user over the target plan's property limit.
 */
export interface DowngradeBlocked {
    allowed: false;
    current_property_count: number;
    target_property_limit: number;
    properties_to_delete: number;
}

// CMA Types
export interface CMAResponse {
    /** Subject property id — use as the list/map key. */
    property_id: string;
    /** The AVM (estimated value). Display this as the headline number. */
    price: number;
    /** AVM range bounds. */
    low: number;
    high: number;
    /** Pre-formatted range, e.g. "$735.3K–$974.7K". Prefer this for display. */
    formatted: string;
    /** The property's street address (as stored). */
    address: string;
    /** The full address the AVM actually matched (audit/QA), or null. */
    matched_address: string | null;
    /** 0–100, from the AVM. Usually present now, but still guard for null. */
    confidence_score: number | null;
    /** From the property (captured at extraction, editable at review). */
    last_sale_price: number | null;
    /** ISO date, e.g. "2010-04-16". */
    last_sale_date: string | null;
    /** ISO datetime the AVM was captured. Show as "as of {date}". */
    valued_at: string | null;
    /** "avm" (created/lazy), "monthly" (auto-refreshed), or "manual" (user-refreshed). */
    source: string | null;
}

// Bulk Upload Types
export interface BulkUploadQuotaResponse {
    /** Properties the user can still confirm (plan limit minus active). Always 0 when past_due. */
    remaining: number;
    /** Active (confirmed, live) properties. */
    current_count: number;
    max_allowed: number;
    /** Unconfirmed drafts. Optional until the quota-hardening backend deploys. */
    pending_drafts?: number;
    /** `remaining - pending_drafts`, min 0: files the user can upload now. Read via `uploadSlots()`. */
    upload_slots?: number;
    /** `upload_slots > 0` on the new backend (`remaining > 0` on the old one). */
    can_bulk_upload: boolean;
}

/** `detail` of a 402 from upload, bulk upload, confirm, or create. */
export interface QuotaLimitDetail {
    message: string;
    requires_subscription: boolean;
}

export interface BulkUploadItem {
    filename: string;  // Backend returns 'filename' not 'file_name'
    property_id: string | null;
    extracted: {  // Backend returns 'extracted' not 'extracted_data'
        client_name: string;
        address: string;
        city: string;
        state: string;
        zip_code: string;
        inspection_date: string;
        /** Last sale price from v3 Comps — may be empty; editable at review. */
        last_sale_price?: number | null;
        /** Last sale date (ISO) from v3 Comps — may be empty; editable at review. */
        last_sale_date?: string | null;
    } | null;
    doc_type?: string;
    document_id?: string | null;
    error?: string | null;
}

export interface BulkUploadFailedItem {
    filename: string;
    error: string;
}

export interface BulkUploadResponse {
    success: boolean;
    /** Upload slots left after this upload (matches the quota endpoint's upload_slots). */
    quota_remaining: number;
    successful: BulkUploadItem[];
    failed_extraction: BulkUploadFailedItem[];
    failed_draft_creation: BulkUploadFailedItem[];
    failed_s3_upload?: BulkUploadFailedItem[];
}

/**
 * Plan-limit error (402) from the multipart upload endpoints. `requiresSubscription` is true
 * for a free user at the free limit; false covers both a subscriber at their plan limit and a
 * past_due subscription (check billing status to tell those apart).
 */
export class BillingError extends ApiError {
    requiresSubscription: boolean;
    constructor(message: string, requiresSubscription = false, detail: unknown = null) {
        super(message, 402, detail);
        this.name = 'BillingError';
        this.requiresSubscription = requiresSubscription;
    }
}

// Validation Error (from API)
export interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
}

export interface HTTPValidationError {
    detail: ValidationError[];
}

// ============ HELPER FUNCTIONS ============

/**
 * Heuristic: does this string still look like raw/technical output that a normal user
 * would not understand? (HTTP codes, Twilio/Clerk internals, raw JSON, stack frames, etc.)
 */
function looksTechnical(message: string): boolean {
    return (
        /\bhttp\b|status\s*code|status\s*\d{3}|\b[45]\d{2}\b/i.test(message) ||
        /unable to create record|invalid parameter|traceback|exception|stacktrace|\bnull\b|\bundefined\b/i.test(message) ||
        /[{}\[\]]|=>|\bat\s+[\w.$]+\s*\(/.test(message) ||
        message.length > 160
    );
}

/**
 * Convert any backend/network error into a short, human-readable message that is safe to
 * show end users. It strips technical noise (HTTP codes, Twilio's "Invalid parameter `To`",
 * raw JSON, stack frames) and maps well-known failure shapes to friendly copy. When the
 * underlying text still looks technical, the generic `fallback` is returned instead so we
 * never surface something the user can't act on.
 */
export function getFriendlyErrorMessage(
    error: unknown,
    fallback = "Something went wrong. Please try again."
): string {
    const raw = (error instanceof Error ? error.message : typeof error === "string" ? error : "").trim();
    if (!raw) return fallback;
    const lower = raw.toLowerCase();

    // Invalid phone number — e.g. Twilio "Invalid parameter `To`" (missing country/area code).
    if (
        /invalid parameter\s*['"`]?\s*to/.test(lower) ||
        (lower.includes("unable to create record") && /\bto\b/.test(lower)) ||
        /not a valid phone number/.test(lower) ||
        /invalid.*(phone|mobile|number)/.test(lower) ||
        /(phone|mobile)\s*number.*invalid/.test(lower)
    ) {
        return "That mobile number doesn't look valid. Please check the number and country code, then try again.";
    }

    // Verification code problems.
    if (lower.includes("otp") || lower.includes("verification code") || /\bcode\b/.test(lower)) {
        if (/expired/.test(lower)) return "Your verification code has expired. Please request a new one.";
        if (/invalid|incorrect|wrong|mismatch|does not match|doesn't match/.test(lower)) {
            return "That verification code is incorrect. Please double-check it and try again.";
        }
    }

    // Account uniqueness.
    if (/email/.test(lower) && /(already|exists|taken|registered|in use)/.test(lower)) {
        return "An account with this email already exists. Try logging in instead.";
    }
    if (/username/.test(lower) && /(already|exists|taken|in use)/.test(lower)) {
        return "This username is already taken. Please choose another one.";
    }

    // Credentials.
    if (/(invalid|incorrect)\s+(password|credentials?)|wrong password|password.*incorrect/.test(lower)) {
        return "The email or password you entered is incorrect.";
    }

    // Rate limiting.
    if (/too many|rate.?limit|throttl|\b429\b/.test(lower)) {
        return "Too many attempts. Please wait a minute and try again.";
    }

    // Connectivity.
    if (/failed to fetch|network\s*error|networkerror|connection|timed out|timeout|econn|err_internet/.test(lower)) {
        return "Couldn't reach the server. Please check your internet connection and try again.";
    }

    // Auth / session.
    if (/session expired|please log in again|authentication required/.test(lower)) {
        return "Your session has expired. Please log in again.";
    }

    // Billing / Stripe configuration.
    if (/similar object exists in live mode.*test mode key|stripe price mismatch.*live mode/.test(lower)) {
        return "Plan prices aren't configured for test mode yet. Ask your admin to add test Stripe price IDs for Pro and Elite.";
    }

    // Server errors.
    if (/internal server|server error|\b5\d{2}\b/.test(lower)) {
        return "Our servers ran into a problem. Please try again in a moment.";
    }

    // If what's left still looks technical, hide it behind the generic fallback.
    if (looksTechnical(raw)) return fallback;

    return raw;
}

/** The `code` from an outreach 409/422 error, if any. Branch on this, never on the message text. */
export function getOutreachErrorCode(err: unknown): OutreachErrorCode | undefined {
    if (err instanceof ApiError && err.detail && typeof err.detail === 'object') {
        const code = (err.detail as Record<string, unknown>).code;
        if (typeof code === 'string') return code as OutreachErrorCode;
    }
    return undefined;
}

/**
 * A same-site relative path that's safe to redirect to after login, or null.
 * Rejects absolute and protocol-relative URLs (`//evil.com`, `/\evil.com`), control
 * characters (browsers strip tabs/newlines, so `/\t/evil.com` would become `//evil.com`),
 * and the auth pages themselves. Prevents open redirects through `?next=`.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('://') || raw.includes('\\')) return null;
    for (let i = 0; i < raw.length; i++) {
        const c = raw.charCodeAt(i);
        if (c < 0x20 || c === 0x7f) return null;
    }
    if (raw.startsWith('/login') || raw.startsWith('/signup')) return null;
    // Belt and braces: it must resolve to the same origin.
    try {
        const base = 'https://same-origin.invalid';
        if (new URL(raw, base).origin !== base) return null;
    } catch {
        return null;
    }
    return raw;
}

/** `/login`, carrying `path` as `?next=` when it's safe to return to. */
export function loginUrlFor(path: string): string {
    const next = safeNextPath(path);
    return next ? `/login?next=${encodeURIComponent(next)}` : '/login';
}

/** The current page as a `/login?next=…` URL (browser only). */
function loginUrlForCurrentPage(): string {
    return loginUrlFor(window.location.pathname + window.location.search);
}

/**
 * Verbatim TCPA disclosure shown next to every SMS-consent control and sent as
 * `consent_text` on opt-in. Keep this the single source of truth so the copy the user
 * sees and the copy stored for the audit trail can never drift apart.
 * (Confirm final wording with legal/compliance before launch.)
 */
export const SMS_CONSENT_TEXT =
    "I agree to receive automated property-alert text messages from Viano at the " +
    "number provided. Consent is not a condition of any purchase. Message frequency " +
    "varies.";

// Survives the signup→login boundary: /sms-consent needs a JWT, but signup may not return
// one (the user logs in afterward). We stash the opt-in here, tagged with the signup email,
// and flush it on the next successful login.
const PENDING_SMS_CONSENT_KEY = 'pendingSmsConsent';

/**
 * Remember that the user opted into SMS alerts during signup, so it can be sent once a token
 * exists. Tagged with the (normalized) email so it only ever applies to that account.
 */
export function setPendingSmsConsent(email: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PENDING_SMS_CONSENT_KEY, email.trim().toLowerCase());
}

export function clearPendingSmsConsent(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PENDING_SMS_CONSENT_KEY);
}

/**
 * If an SMS opt-in was captured at signup but couldn't be sent yet (no token until login),
 * send it now. Call right after a successful login/signup (once saveAuth has stored the token).
 * Email-matched so a pending opt-in only applies to the account it was made for. Best-effort
 * and idempotent; the flag is cleared only on success so a transient failure retries next login.
 */
export async function flushPendingSmsConsent(loggedInEmail: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const pending = localStorage.getItem(PENDING_SMS_CONSENT_KEY);
    if (!pending || pending !== loggedInEmail.trim().toLowerCase()) return;
    try {
        await authAPI.setSmsConsent({ consent: true, consent_text: SMS_CONSENT_TEXT });
        clearPendingSmsConsent();
    } catch (err) {
        console.error('Failed to flush pending SMS consent:', err);
        // Leave the flag in place so the next login retries it.
    }
}

/**
 * Get current user ID from localStorage
 */
export function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('userId');
}

/**
 * Get current auth token from localStorage
 */
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}

/**
 * Clear auth data (for logout)
 */
export function clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
}

/**
 * Save auth data after login
 */
export function saveAuth(loginResponse: LoginResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userId', loginResponse.user_id);
    localStorage.setItem('userEmail', loginResponse.email);
    localStorage.setItem('userName', `${loginResponse.first_name} ${loginResponse.last_name}`);
    if (loginResponse.access_token) {
        localStorage.setItem('authToken', loginResponse.access_token);
    }
    if (loginResponse.refresh_token) {
        localStorage.setItem('refreshToken', loginResponse.refresh_token);
    }
}

/**
 * Get stored user info
 */
export function getStoredUserInfo(): { userId: string | null; email: string | null; name: string | null } {
    if (typeof window === 'undefined') {
        return { userId: null, email: null, name: null };
    }
    return {
        userId: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
    };
}
