// lib/api.ts - API Service Layer for VianoSystems
// Updated to match exact backend OpenAPI schemas

// Base API URL - Uses environment variable or defaults to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Generic fetch wrapper with error handling
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || `HTTP Error: ${response.status}`);
    }

    return response.json();
}

// ============ AUTHENTICATION APIs ============
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
     * Fetch user data from RDS
     */
    getUser: (userId: string) =>
        apiRequest<UserResponse>(`/api/auth/user/${userId}`),
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
     * Get all properties for a user
     */
    getUserProperties: (userId: string) =>
        apiRequest<PropertyResponse[]>(`/api/property/user/${userId}`),

    /**
     * Get a specific property for a user by ID
     */
    getProperty: (userId: string, propertyId: string) =>
        apiRequest<PropertyResponse>(`/api/property/user/${userId}/property/${propertyId}`),

    /**
     * Delete a property for a user
     * Only the owner can delete their property
     * Cascades deletion to related documents, processes, and messages
     */
    delete: (userId: string, propertyId: string) =>
        apiRequest<string>(`/api/property/user/${userId}/property/${propertyId}`, {
            method: 'DELETE',
        }),

    /**
     * Reset and reprocess a property
     * This endpoint:
     * - Deletes all existing documents (from S3 and RDS)
     * - Deletes all related processes, messages, and engine results
     * - Uploads new documents to S3 and stores metadata in RDS
     * - Starts a new processing pipeline
     * Returns immediately with process_id for tracking.
     */
    resetAndReprocess: async (
        userId: string,
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
        const url = `${API_BASE_URL}/api/property/user/${userId}/property/${propertyId}/reset-and-reprocess${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to reset and reprocess' }));
            throw new Error(error.detail || 'Failed to reset and reprocess');
        }

        return response.json();
    },

    /**
     * Edit property documents (legacy - use resetAndReprocess for better handling)
     * - Remove existing documents by providing document IDs
     * - Upload new documents with their types
     */
    editDocuments: async (
        userId: string,
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
        const url = `${API_BASE_URL}/api/property/user/${userId}/property/${propertyId}/documents${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'PUT',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to edit documents' }));
            throw new Error(error.detail || 'Failed to edit documents');
        }

        return response.json();
    },
};

// ============ DOCUMENT APIs ============
export const documentAPI = {
    /**
     * Upload one or more PDF documents
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
        userId: string,
        propertyId: string,
        files: File[],
        docTypes: ('4point' | 'home_inspection')[]
    ) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const docTypesParam = docTypes.map(dt => `doc_types=${encodeURIComponent(dt)}`).join('&');
        const url = `${API_BASE_URL}/api/documents/upload/${userId}/${propertyId}?${docTypesParam}`;

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail || 'Failed to upload document');
        }

        return response.json();
    },

    /**
     * Get all documents for a property (secured by user_id)
     */
    getPropertyDocuments: (userId: string, propertyId: string) =>
        apiRequest<DocumentResponse[]>(`/api/documents/property/${userId}/${propertyId}`),

    /**
     * Delete a document from S3 and RDS
     */
    delete: (userId: string, propertyId: string, documentId: string) =>
        apiRequest<string>(`/api/documents/${userId}/${propertyId}/${documentId}`, {
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
     * Get all processes for a user
     */
    getUserProcesses: (userId: string) =>
        apiRequest<ProcessSummaryResponse[]>(`/api/process/user/${userId}`),

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
}

export interface UserResponse {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    last_login: string | null;
    role: string;
    created_at: string | null;
}

// Property Types
export interface CreatePropertyRequest {
    property_name: string;
    location: string;
    address: string;
    client_name: string;
    property_closing_date?: string | null;
    user_id: string;
}

export interface PropertyResponse {
    property_id: string;
    property_name: string;
    location: string;
    address: string;
    client_name: string;
    property_closing_date: string | null;
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
    user_id: string;
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
}

export interface EngineResultResponse {
    engine_result_id: string;
    doc_id: string;
    status: string;
    json_result_preview: string;
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
 * Clear auth data (for logout)
 */
export function clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
}

/**
 * Save auth data after login
 */
export function saveAuth(loginResponse: LoginResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('userId', loginResponse.user_id);
    localStorage.setItem('userEmail', loginResponse.email);
    localStorage.setItem('userName', `${loginResponse.first_name} ${loginResponse.last_name}`);
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
