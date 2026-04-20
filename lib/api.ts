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
     * Refresh the access token
     */
    refresh: (refreshToken: string) =>
        apiRequest<{ access_token: string }>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
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
}

// Property Types
export interface CreatePropertyRequest {
    property_name: string;
    location: string;
    address: string;
    zip_code?: string | null;
    client_name: string;
    inspection_date?: string | null;
    negotiated_wins?: string | null;
    city?: string | null;
    state?: string | null;
    year_built?: number | null;
    square_footage?: number | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    lot_size?: number | null;
    property_type?: string | null;
    purchase_price?: number | null;
    purchase_date?: string | null;
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
    year_built: number | null;
    square_footage: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    lot_size: number | null;
    property_type: string | null;
    purchase_price: number | null;
    purchase_date: string | null;
    user_id: string;
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
