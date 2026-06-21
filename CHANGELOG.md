# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026-06-21] — Add Property UX & Skeleton Loaders

### Added
- **Skeleton loaders app-wide.** New self-theming `Skeleton` component (`components/ui/skeleton.tsx`, light `bg-gray-200` / dark `bg-white/10`). Replaced data-fetch loading spinners with layout-matching skeletons across the dashboard widgets (stat cards, Requiring Attention, Top Appreciating, Recent Alerts, property list), the dedicated list pages, Manage Properties (clients list + detail panel), the Profile page, Bulk Upload (quota check), the history modal, the billing success page, and the Add Property draft-load. In-button submit spinners (Log In, Confirm, Save, Delete, etc.) intentionally remain spinners.
- **Editable bulk-upload review.** Each draft's extracted fields — Address, Client Name, City, State, ZIP Code, and Inspection Date — are now editable inputs, pre-filled from the extracted data and submitted (per-draft and bulk) instead of the raw extracted values.

### UI Changes
- **Bulk-upload "missing document" clarity.** The optional second-document upload now names the specific complementary document (4-Point Inspection vs Home Inspection) derived from the draft's primary `doc_type`, uploads it with the correct type, and renders the chosen file as a proper card (type label + size) — replacing the generic "Upload 4-Point or Home Inspection".
- **Bulk-upload results cleanup.** Removed the "Upload Complete" summary stat cards and the redundant "Draft Properties" heading (failure counts still surface in their dedicated sections).
- **Add Property page is now full-bleed.** Removed the redundant in-card "Add New Property" title and the rounded "card-on-gray" container; the page now fills the full width and height of the content area as a single white (dark `#1a1a1a`) surface, with no gray gutters or collapsing height on short content.
- **Flow tabs hidden on review pages.** The Upload PDF / Bulk Upload / Manual Entry tabs are hidden once you're reviewing extracted data (PDF review step or bulk results), preventing an accidental tab switch from discarding in-progress review.

### Fixed
- **Draft open no longer flashes the upload UI.** Opening a draft property (`?draft=`) previously rendered the PDF upload step while the draft loaded, then snapped to the review page. The page now starts in the review step and shows a skeleton/loading state until the extracted data is ready.

## [2026-06-21] — Light/Dark Theme

### Added
- **Light/Dark theme toggle.** New `ThemeProvider` + `useTheme()` (`common/theme/theme-provider.tsx`) persist the choice to `localStorage` and toggle a `.dark` class on `<html>`; a no-FOUC inline script in `app/layout.tsx` applies the stored theme before paint (`suppressHydrationWarning`). New Sun/Moon `ThemeToggle` component (`common/theme/theme-toggle.tsx`) placed in both the header and the sidebar.

### UI Changes
- **App-wide dark theme.** Added `dark:` variants across the app on a consistent convention (page `#0f0f0f`; cards `#1a1a1a` with `white/10` borders; subtle `white/5`–`white/10` surfaces; `gray-300`/`gray-400` text; translucent status tints `X-500/15`): dashboard (stat cards plus the Requiring Attention, Top Appreciating, and Recent Alerts widgets), Manage Properties (page, clients list, detail panel), the Add Property flow (add-properties page, bulk-upload, negotiated-wins-form), all system modals (reset, set-age, add-manual, add-defaults, edit, delete, history), the Profile page, the three dedicated list pages (`/requiring-action`, `/top-appreciating-properties`, `/recent-alerts`), and shared UI (`status-badge`, `otp-input`).
- **Recent Alerts page feedback** now matches the dashboard widget: a "Feedback" column with a "Was this helpful?" label and icon-only thumb buttons (replacing the text "Yes / No" pills), in both the desktop table and mobile cards.
- **Login & Signup pages are permanently dark** regardless of the toggle — hardcoded dark colors plus a scoped `dark` root that also darkens the `OTPInput`; inputs restyled to the dark surface with orange focus rings, and a `input:-webkit-autofill` override in `app/globals.css` stops the browser's light autofill background from overriding dark inputs.
- **Default property image** replaced and repointed app-wide to `property-default-v2.png` (versioned filename busts browser/CDN image caches); old asset removed.
- **Favicon** switched to the Viano logo via the App Router file convention (`app/icon.png`); removed the stock `app/favicon.ico` and the `metadata.icons → /V.png` entry.

## [2026-06-21]

### Added
- **Edit System** modal in the property detail panel. Edits a system's `system_type`, `name`, `brand`, and tankless flag (water heaters); only changed fields are sent, empty string clears name/brand. Calls `PUT /api/property/my-properties/{propertyId}/systems/{systemId}`.
- **Delete System** confirmation modal. Destructive confirm dialog warning that the system, its replacement history, and pending alerts are removed (plus the same-day Twilio caveat). Calls `DELETE /api/property/my-properties/{propertyId}/systems/{systemId}`.
- New Systems API methods `systemsAPI.editSystem()` and `systemsAPI.deleteSystem()`, with new types `EditSystemRequest`, `EditSystemResponse`, `DeleteSystemResponse`.
- Per-system **Edit** (pencil) and **Delete** (trash) icon buttons next to "Reset System" in each system row, plus an **"Add System"** button in the System Age & Lifespan header (visible whenever the section renders, not just the empty state).

### UI Changes
- **App-wide orange theme.** Changed the `--primary` and `--ring` design tokens from navy `#00346C` to orange `#E8730A` (`app/globals.css`), recoloring all default buttons and focus rings. Swept remaining hardcoded navy/blue accents to the orange palette across the Add Property flow (`add-properties` page, bulk-upload, negotiated-wins-form) and the system modals (reset, set-age, add-manual, add-defaults, edit, history).
- **Shared header (`PageHeader`) redesign.** Bold title, removed the placeholder notification bell on all pages, and an orange "Add New Property" pill driven by `actionLabel` (now shown on Dashboard, Profile, and Manage Properties). Mobile bar enlarged the logo and added a compact orange add button + larger hamburger.
- **Sidebar bottom section** consolidated into a single profile card (avatar, name, role) with a dark-themed menu (Profile / Log Out) that opens on hover or click and aligns above the card; background tightened to `#1F1F1F` and active/accent colors to `#E8730A`.
- **Manage Properties page redesign.** Clients list and detail panel are now separate rounded white cards on a gray background; search + status filter moved into the Clients panel (top toolbar removed); rows show full address + city/state and a "View / Hide Details" toggle; table-style columns when the detail panel is closed; redesigned pagination (orange active page, Previous/Next).
- **Property detail panel** restyled to the new design: photo/initials header with icon action buttons, orange "Current Home Value" card, pill-based info grid (Viano Activated / Property Type / Inspection Date wired to the property endpoint), redesigned System Age & Lifespan rows, and a single continuous white card with Property Insights.
- **Profile page** restyled to match the new design: rounded cards on gray, larger profile card with orange "Edit Profile" button (avatar pencil removed), Quick Stats with progress bars, and table-style Audit History. Existing billing and OTP verification flows retained.
- **Dashboard restyle.** Top stat cards use neutral gray icon circles, dark values, gray-pill "View …" buttons with orange arrows, and a custom sparkle icon for Top Appreciating. Section headers (Needs Attention, Top Appreciating, Recent Property Alerts) updated with themed icons, `#6E6355` titles, and gray-pill "View All →" buttons.

## [Unreleased]

### Added
- **Dashboard stat cards now display real API data** instead of dummy values.
  - **Active Properties**: Integrates `GET /api/property/bulk-upload/quota` to show `current_count` and `max_allowed` with a green progress bar showing plan usage percentage.
  - **Upcoming Touchpoints**: Integrates `GET /api/property/upcoming-touchpoints?days=180` to display the real `count` from the API.
  - **Top Appreciating Properties**: Integrates `GET /api/property/opportunities` to display `total_opportunities` from the appreciation API.
- **Property Opportunities API integration** (`lib/api.ts`):
  - New types: `PropertyOpportunityItem`, `PropertyOpportunitiesResponse`.
  - New method: `propertyAPI.getOpportunities()` → `GET /api/property/opportunities`.
  - Returns appreciated properties only (current price > last sale price), sorted by highest gain first, with formatted gain like `+$142K`.
- **Upcoming Touchpoints API integration** (`lib/api.ts`):
  - New types: `UpcomingTouchpointItem`, `UpcomingTouchpointsResponse`.
  - New method: `propertyAPI.getUpcomingTouchpoints(days)` → `GET /api/property/upcoming-touchpoints?days={days}`.
- **Dedicated full-width list pages** for each dashboard section with pagination (15 items per page):
  - `/requiring-action` — Full list of properties requiring attention with dismiss functionality.
  - `/top-appreciating-properties` — Full list of appreciating properties with ranked badges.
  - `/recent-alerts` — Full list of scheduled property alerts with feedback buttons.
  - Each page uses a clean full-width layout: single title with gray count badge, no outer card wrapper, edge-to-edge rows with light dividers.
- **Dashboard section "View All" links** now route to the new dedicated pages instead of `/manage-properties`.
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
- **Dashboard UI refinements** across all list sections for visual consistency:
  - Section headers now use `pb-3 md:pb-4 mb-0 border-b border-gray-100` with reduced height.
  - Row padding standardized to `py-[10px]` with 52x52px property images and `border-b` dividers.
  - Max 5 rows for dashboard list sections (Requiring Action, Equity Opportunities); max 3 rows for Recent Alerts.
  - Removed row navigation links and chevron arrows from list items (except "View All" header links).
  - Added dismiss button (X) to Properties Requiring Attention rows, wired to `POST /api/property/systems/{systemId}/dismiss`.
  - Renamed "Top Equity Opportunities" → "Top Appreciating Properties" in both section header and stat card title.
  - Stat cards redesigned: larger icon circles, colored values, stacked title/value/subtitle layout, progress bar for Active Properties.
  - Compact empty state for Requiring Action: smaller icon, shorter subtitle text.
- **Recent Property Alerts section** fully integrated with `GET /api/property/scheduled-alerts`:
  - Maps API fields: `property_address`, `client_name`, `alert_type`, `trigger`, `priority`, `scheduled_for`, `status`.
  - Priority mapping: `1=High`, `2=Medium`, `3=Low` with colored badges.
  - Status `scheduled_twilio` displayed as "Sent".
  - Added feedback buttons (Yes/No) per alert with local state tracking.
- **Top Appreciating Properties section** now fetches real data via `propertyAPI.getOpportunities()`:
  - Displays `formatted_gain` from API instead of calculated dummy values.
  - Shows `location` and `last_sale_date` from API response.
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

## [Unreleased] — Manage Properties UI/UX Refactor

### Added
- **Manage Properties detail panel close control**: back-arrow close button positioned to the left of the client avatar; clicking it clears the selected property and returns to the full-width list view.
- **Dynamic system status badges and progress-bar colors** in the property detail panel based on `percentage_used`:
  - `< 50%` → "Good" (emerald/green)
  - `50–74%` → "Fair" (amber/yellow)
  - `75–89%` → "Warning" (orange)
  - `>= 90%` → "Critical" (red)
- **Conditional "History" button** next to "Reset System" for each system; shown only when `replacement_history.length > 0` and opens the replacement-history modal.
- **Responsive mobile toolbar** for Manage Properties:
  - Shorter "Search..." placeholder on small screens
  - Icon-only status filter and "Add Property" buttons on mobile
  - Subtitle hidden on mobile to reduce clutter
- **Responsive mobile detail panel**:
  - System rows stack vertically on mobile while remaining horizontal on desktop
  - Property Insights grid switches from 4 columns on desktop to 2 columns on mobile
  - Reduced padding and font sizes for smaller viewports

### Changed
- **Manage Properties page layout**:
  - Default view now shows the property list full-width; detail panel opens only after selecting a property
  - Left property list panel fixed to `w-96` (384px) when the detail panel is open, matching the search-bar width for perfect vertical alignment
  - Detail panel uses `flex-1` to fill the remaining viewport width
- **Property list styling**:
  - List items changed from rounded card style to table-style rows with `border-b border-gray-200` dividers
  - Selected item highlighted with orange left border (`border-l-orange-400`) and light orange background
- **Property detail panel styling**:
  - Client header, property info grid, and systems list combined into a single white card with `rounded-2xl` and `border border-gray-100`
  - Horizontal divider lines separate header, property info, and systems sections
  - Vertical divider lines between the three property-info columns
  - System rows separated by divider lines
  - Action buttons (Edit, Download Report, Delete) moved directly below the client header card
- **Current Home Value card** in the detail header:
  - Wrapped in a bordered container with left-aligned text
  - Added a purple trending-up icon in the top-right corner
  - Vertically centered with the client name/address block
- **Property Insights section**:
  - Wrapped in a white card with border outline
  - Inner stat cards now use solid tinted backgrounds (purple/orange/amber/blue) with matching border colors
- **Top navigation header** (`common/header/index.tsx`):
  - Hidden on mobile (`hidden lg:flex`) so the Manage Properties mobile toolbar is the only header content visible on small screens
- **Left sidebar** (`common/sidebar/index.tsx`):
  - Dark theme with viano logo, navigation items, plan upgrade cards, and user profile card
  - Active "Manage Properties" item uses orange text

### Fixed
- Pagination footer in the property list now stays at the bottom of the list container regardless of record count by using a flex column layout with `flex-1` on the scrollable list area.
- Desktop system-row action buttons now remain on the right side of the progress bar instead of wrapping to the left.
