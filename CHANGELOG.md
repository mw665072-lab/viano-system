# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Property Systems management in Manage Properties detail panel. Agents can now view all property systems (water heater, HVAC, roof, etc.) with real-time age tracking, lifespan progress bars, and alert tier badges (Tier 1 = amber, Tier 2 = red).
- One-tap replacement logging via "Log Replacement" modal. Pre-filled with today's date, supports event types (Full Replacement, Age Adjustment), and optional agent notes. Shows success toast with rescheduled alert count.
- Replacement History timeline modal per system. Displays a vertical timeline of all past replacement events with age transitions, event types, dates, and notes.
- New Systems API integration: `GET /systems`, `POST /systems/{id}/reset`, `GET /systems/{id}/history`.

### Changed
- Removed Negotiated Wins editing from the property edit modal in Manage Properties. Negotiated Wins can now only be set during property creation.

### Fixed
- Skip subscription limit check when confirming an existing draft property. Previously, clicking a draft property to confirm it would incorrectly trigger the "Limit Reached" paywall, even though the user was not adding a new property but completing an existing draft.
