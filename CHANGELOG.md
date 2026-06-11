# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Async upload-and-extract (Phase 1 API)**: Single PDF upload now handles the `202 Accepted` response with background polling for the draft property.
  - `propertyAPI.uploadAndExtract()` accepts `202` status and throws `BillingError` on `402`.
  - New `propertyAPI.pollForNewDraft(maxAttempts, intervalMs)` helper polls `/my-properties` until the newest draft appears.
  - New `BillingError` custom error class for subscription-related failures (HTTP 402).
  - Processing indicator with descriptive status message shown during background polling.
  - Graceful timeout message if draft does not appear within 60 seconds.
- `failed_s3_upload` display in bulk upload results: new stat card and failure list section for S3 upload errors.
- `created_at` optional field on `PropertyResponse` for sorting drafts by creation time.
- **Bulk Property Upload** feature for uploading multiple PDF inspection reports at once.
  - New "Bulk Upload" tab in Add Properties page alongside "Upload PDF" and "Manual Entry".
  - Quota checking on mount with display of remaining uploads (e.g., "You can upload 12 more properties").
  - Multi-file selection with PDF validation and per-file document type selector (4-Point / Home Inspection).
  - Expandable review accordion for each draft showing extracted property details (address, client, city, state, ZIP, inspection date).
  - Per-draft editing: add Negotiated Wins and upload optional second document before confirming.
  - Checkbox selection for individual drafts with "Select All / Deselect All" toggle.
  - Bulk confirm selected properties or confirm individually with one click.
  - Remove selected drafts from the list before confirmation.
  - Results summary showing successful drafts, extraction failures, and draft creation failures with counts.
  - Confirmed properties section with link to view in Properties list.
  - New API methods: `propertyAPI.getBulkUploadQuota()` and `propertyAPI.bulkUploadAndExtract()`.
  - New types: `BulkUploadQuotaResponse`, `BulkUploadItem`, `BulkUploadFailedItem`, `BulkUploadResponse`.
  - New component: `components/manage-properties/bulk-upload/index.tsx`.
- OTP-based email and phone verification across signup, profile, and phone update flows.
  - Signup: New 3-step wizard (Account Info -> OTP Verification -> Password). Phone OTP is required; email OTP is optional and gracefully falls back to phone-only when the email channel is unavailable.
  - Profile: Verification status badges next to email and phone. "Verify" buttons open OTP modals with 6-digit input, resend countdown timer, and inline error handling.
  - Phone Update: Changing phone number in Edit Profile now triggers an OTP-gated flow via `request-otp` -> `confirm-update` endpoints.
  - Reusable `OTPInput` component: 6-digit auto-focusing input boxes with paste support, backspace navigation, and keyboard arrow key handling.
  - New auth API methods: `sendPreRegisterOTP`, `sendEmailOTP`, `verifyEmailOTP`, `sendPhoneOTP`, `verifyPhoneOTP`, `requestPhoneUpdateOTP`, `confirmPhoneUpdate`.
- Property Systems management in Manage Properties detail panel. Agents can now view all property systems (water heater, HVAC, roof, etc.) with real-time age tracking, lifespan progress bars, and alert tier badges (Tier 1 = amber, Tier 2 = red).
- One-tap replacement logging via "Log Replacement" modal. Pre-filled with today's date, supports event types (Full Replacement, Age Adjustment), and optional agent notes. Shows success toast with rescheduled alert count.
- Replacement History timeline modal per system. Displays a vertical timeline of all past replacement events with age transitions, event types, dates, and notes.
- **Undo Reset** support in Replacement History. Each event shows an "Undo Reset" button (disabled if already undone). Undone events are visually dimmed with strikethrough. Calls `POST /systems/{id}/undo-reset`.
- **Set System Age** modal for systems with unknown age. When `age_unknown: true`, the system card shows an "Age Unknown" badge and a "Set Age" prompt. Users can enter either a manufacturing year or a direct age. Calls `PUT /systems/{id}/age`.
- **Add Manual System** modal for adding individual systems to a property. Supports all system types (HVAC, water heater, roof shingle/tile/metal, pool equipment, electrical, plumbing, appliances) with optional name, brand, and age info. Calls `POST /systems/add-manual`.
- **Add Default Systems** wizard for bulk-adding Water Heater + HVAC units + Roof. Configurable per-section age inputs (MFG year or direct age), dynamic HVAC unit list (add/remove), and roof type dropdown (Shingle/Tile/Metal). Calls `POST /systems/add-defaults`.
- **Age Adjustment** mode in the reset modal now supports `adjusted_age`. When "Age Adjustment" is selected, users enter a specific age value (e.g., 3.5 years). When "Full Replacement" is selected, age resets to 0 (brand new).
- New Systems API methods: `GET /systems`, `PUT /systems/{id}/age`, `POST /systems/{id}/reset`, `POST /systems/{id}/undo-reset`, `POST /systems/add-manual`, `POST /systems/add-defaults`, `GET /systems/{id}/history`.
- Updated `SystemResponse` type with new fields: `mfg_year`, `age_unknown`, and nullable `age_at_inspection`, `current_age`, `percentage_used`.
- Updated `ReplacementEventResponse` type with `undone_at` field for tracking undone events.

### Changed
- **Breaking: `UploadAndExtractResponse` type** now reflects the async 202 response shape (`upload_id`, `message`, `filename`, `doc_type`) instead of the old synchronous response (`property_id`, `extracted`, `document`).
- `BulkUploadResponse` type: added optional `failed_s3_upload: BulkUploadFailedItem[]` field.
- PDF review step now uses `draftProperty` (fetched from `/my-properties/{id}`), `uploadFilename`, and `pdfDocType` state instead of the old `extractedData` object.
- Second document upload logic in PDF confirm uses `pdfDocType` state instead of `extractedData.document.doc_type`.
- Signup flow now requires phone OTP verification before account creation. Email OTP is optional and the UI silently hides the email verification section when the channel is unavailable.
- `SignUpRequest` interface: `email_otp` is now optional (`email_otp?: string`), `phone_otp` remains required.
- `UserResponse` interface: added `email_verified` and `phone_verified` optional boolean fields.
- Removed Negotiated Wins editing from the property edit modal in Manage Properties. Negotiated Wins can now only be set during property creation.

### Removed
- **Breaking: 8 property fields removed** from the Property schema and all API endpoints to align with the updated backend contract.
  - Removed fields: `year_built`, `square_footage`, `bedrooms`, `bathrooms`, `lot_size`, `property_type`, `purchase_price`, `purchase_date`.
  - `CreatePropertyRequest`: removed all 8 fields and `inspection_date`.
  - `PropertyResponse`: removed all 8 fields.
  - `ConfirmPropertyRequest`: removed all 8 fields; remaining fields made optional.
  - Removed the "Property Specifications" accordion section from the Add Properties form (PDF review and manual entry).
  - Removed the "Property Specifications" display section from the Manage Properties detail panel.
  - Dashboard stats: upcoming closings metric (based on `purchase_date`) replaced with `0`.
  - Dashboard valuation: `closingDate` set to `undefined`.
  - Backend will return `422 Unprocessable Entity` if any removed field is sent after deployment.

### Fixed
- Skip subscription limit check when confirming an existing draft property. Previously, clicking a draft property to confirm it would incorrectly trigger the "Limit Reached" paywall, even though the user was not adding a new property but completing an existing draft.
