# MikScooter Examenkiezer — Changelog

All notable changes to scripts in this repo will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) and versions follow [Semantic Versioning](https://semver.org/).

---

## examenkiezer.js

### v1.1.0 — 2026-04-10
- Payment recovery banner v2: only shows when redirect actually stalled (beforeunload did not fire), not after completed/cancelled payments
- New `mikscooter_last_redirect_completed` sessionStorage flag set on beforeunload to track successful redirects
- Race condition fix: `stopStatusUpdates()` now uses `statusUpdaterActive` flag + clears pending `fadeTimeout` to prevent flickering
- `showFallbackUI()` deferred to next microtask via `Promise.resolve().then()` to avoid UI glitches
- Auto-redirect reduced from 1500ms to 600ms
- New tracking event: `payment_recovery_skipped` with reason (`redirect_completed` or `expired`)

### v1.0.0 — 2026-04-10
- Initial migration from the Webflow "Before `</body>`" custom code field to GitHub + jsDelivr
- Source snapshot: `webflow-page-examenkiezer-custom-code-inside-body-tag_2026-04-10_13_49u_v2.txt`
- 18 separate `<script>` blocks merged into a single `.js` file (tags stripped, execution order preserved)
- No functional changes
- Reason: original Webflow custom code block (~59k chars) exceeded Webflow's 50k page-level limit
