# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- OTP-based email and phone verification across signup, profile, and phone update flows.
  - Signup: New 3-step wizard (Account Info -> OTP Verification -> Password). Phone OTP is required; email OTP is optional and gracefully falls back to phone-only when the email channel is unavailable.
  - Profile: Verification status badges next to email and phone. "Verify" buttons open OTP modals with 6-digit input, resend countdown timer, and inline error handling.
  - Phone Update: Changing phone number in Edit Profile now triggers an OTP-gated flow via `request-otp` -> `confirm-update` endpoints.
  - Reusable `OTPInput` component: 6-digit auto-focusing input boxes with paste support, backspace navigation, and keyboard arrow key handling.
  - New auth API methods: `sendPreRegisterOTP`, `sendEmailOTP`, `verifyEmailOTP`, `sendPhoneOTP`, `verifyPhoneOTP`, `requestPhoneUpdateOTP`, `confirmPhoneUpdate`.
- Property Systems management in Manage Properties detail panel. Agents can now view all property systems (water heater, HVAC, roof, etc.) with real-time age tracking, lifespan progress bars, and alert tier badges (Tier 1 = amber, Tier 2 = red).
- One-tap replacement logging via "Log Replacement" modal. Pre-filled with today's date, supports event types (Full Replacement, Age Adjustment), and optional agent notes. Shows success toast with rescheduled alert count.
- Replacement History timeline modal per system. Displays a vertical timeline of all past replacement events with age transitions, event types, dates, and notes.
- New Systems API integration: `GET /systems`, `POST /systems/{id}/reset`, `GET /systems/{id}/history`.

### Changed
- Signup flow now requires phone OTP verification before account creation. Email OTP is optional and the UI silently hides the email verification section when the channel is unavailable.
- `SignUpRequest` interface: `email_otp` is now optional (`email_otp?: string`), `phone_otp` remains required.
- `UserResponse` interface: added `email_verified` and `phone_verified` optional boolean fields.
- Removed Negotiated Wins editing from the property edit modal in Manage Properties. Negotiated Wins can now only be set during property creation.

### Fixed
- Skip subscription limit check when confirming an existing draft property. Previously, clicking a draft property to confirm it would incorrectly trigger the "Limit Reached" paywall, even though the user was not adding a new property but completing an existing draft.
