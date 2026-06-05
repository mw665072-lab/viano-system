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

// Generic fetch wrapper with error handling
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Get token from localStorage if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

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
            // No refresh token, force logout
            if (typeof window !== 'undefined') {
                clearAuth();
                window.location.href = '/login';
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
                    headers: { 'Content-Type': 'application/json' },
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
                    window.location.href = '/login';
                }
                throw new Error('Session expired. Please log in again.');
            } finally {
                isRefreshing = false;
            }
        }
    }

    if (!response.ok) {
        let errorDetail = 'An error occurred';
        try {
            const error = await response.json();
            errorDetail = error.detail || error.message || errorDetail;
        } catch (e) {
            errorDetail = `HTTP Error: ${response.status}`;
        }
        throw new Error(errorDetail);
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

        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
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
     */
    uploadAndExtract: async (file: File, docType: '4point' | 'home_inspection' = 'home_inspection'): Promise<UploadAndExtractResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${API_BASE_URL}/api/property/upload-and-extract?doc_type=${encodeURIComponent(docType)}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        // Handle 402 billing error specifically
        if (response.status === 402) {
            const error = await response.json().catch(() => ({ detail: 'Subscription required' }));
            throw new BillingError(error.detail || 'Subscription required to upload more properties');
        }

        // Accept 202 Accepted as success (async processing)
        if (response.status !== 202 && !response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to upload and extract PDF' }));
            throw new Error(error.detail || 'Failed to upload and extract PDF');
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

        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'PUT',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to edit documents' }));
            throw new Error(error.detail || 'Failed to edit documents');
        }

        return response.json();
    },

    /**
     * Get CMA (Comparative Market Analysis) estimate for a property
     * Calls Rentcast API to get price estimate based on property address
     * Returns 404 if property not found, 503 if Rentcast is down
     */
    getCMA: (propertyId: string) =>
        apiRequest<CMAResponse>(`/api/property/my-properties/${propertyId}/cma`),

    /**
     * Get bulk upload quota for the current user
     * Returns how many more properties can be added based on subscription tier
     */
    getBulkUploadQuota: () =>
        apiRequest<BulkUploadQuotaResponse>('/api/property/bulk-upload/quota'),

    /**
     * Bulk upload and extract multiple PDFs
     * Creates draft properties for each successfully extracted PDF
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
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Bulk upload failed' }));
            throw new Error(error.detail || 'Bulk upload failed');
        }

        return response.json();
    },
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
        apiRequest<{ allowed: boolean; reason: string; requires_subscription: boolean }>('/api/billing/can-add-property'),

    /**
     * Create a Stripe Checkout Session for a new subscription (JWT-based)
     */
    createCheckoutSession: () =>
        apiRequest<{ checkout_url: string }>('/api/billing/create-checkout-session', {
            method: 'POST',
        }),

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

        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
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
}

// PDF-First Flow Types
export interface ExtractedPropertyData {
    client_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    inspection_date: string;
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
}

export interface ConfirmPropertyResponse {
    success: boolean;
    process_id: string;
    status: string;
    property_id: string;
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
}

export interface SystemResponse {
    system_id: string;
    system_type: string;
    name: string | null;
    brand: string | null;
    age_at_inspection: number;
    current_age: number;
    lifespan_min: number;
    lifespan_max: number;
    alert_tier: string | null;
    percentage_used: number;
    replacement_history: ReplacementEventResponse[];
}

export interface ResetSystemRequest {
    replacement_date?: string;
    notes?: string;
    event_type?: 'full_replacement' | 'age_adjustment';
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

// Billing Types
export interface SubscriptionResponse {
    subscription_id: string;
    stripe_subscription_id: string;
    status: string;
    current_period_start: string | null;
    current_period_end: string | null;
    monthly_cost: number;
}

export interface BillingStatusResponse {
    user_id: string;
    total_properties: number;
    has_subscription: boolean;
    subscription: SubscriptionResponse | null;
    monthly_cost: number;
}

// CMA Types
export interface CMAResponse {
    price: number;
    low: number;
    high: number;
    formatted: string;
    address: string;
}

// Bulk Upload Types
export interface BulkUploadQuotaResponse {
    remaining: number;
    current_count: number;
    max_allowed: number;
    can_bulk_upload: boolean;
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
    quota_remaining: number;
    successful: BulkUploadItem[];
    failed_extraction: BulkUploadFailedItem[];
    failed_draft_creation: BulkUploadFailedItem[];
    failed_s3_upload?: BulkUploadFailedItem[];
}

/** Custom error class for billing/subscription errors (402) */
export class BillingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BillingError';
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
