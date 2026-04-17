# MikScooter Examenkiezer — Changelog

All notable changes to scripts in this repo will be documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/) and versions follow [Semantic Versioning](https://semver.org/).

---

## examenkiezer.js

### v1.1.2 — 2026-04-17
- Docs/refs only: GitHub repository owner renamed from `GitVoltality` to `Voltality`. Updated `Source:` URL in `examenkiezer.js` header, `README.md`, and `purge.sh` (`REPO=` variable). Git remote updated to match.
- No code or behaviour changes. Both jsDelivr URLs continue to serve identical bytes thanks to GitHub's automatic redirect — old `cdn.jsdelivr.net/gh/GitVoltality/…` URLs keep working, new canonical path is `cdn.jsdelivr.net/gh/Voltality/…`.
- **Action required in Webflow:** update the page-level `<script src>` tag to the new canonical URL to remove the redirect dependency. Instructions in README.

### v1.1.1 — 2026-04-17
- Fix: native Webflow form submit could leak through to the Make.com webhook in sessions where `examenkiezer.js` failed to register its click interception (e.g. when `#payment-loader` was not in the DOM at `DOMContentLoaded`). Make.com would create a valid Mollie payment, but the response body containing the iDeal link was discarded by Webflow's success panel, leaving the user with no payment link. Evidence: multiple customers (Merel Jansen, Jolinde Arends, Levi de Wals, Sid Besems) produced Airtable records with Mollie URLs stored but reported seeing no payment link and retried unsuccessfully.
- Added capturing-phase submit blocker at the top of the file as a belt-and-braces safety net — cancels native submit of `form[data-name="MikScooter-ExamenKiezer"]` before any other listener, even if the rest of the script fails to initialise.
- Decoupled the `loader` element from the payment-handler early-return guard (`if (!form || !betaalButton || !loader) return;` → `if (!form || !betaalButton) return;`). The loader is cosmetic; the click interception is essential. All remaining `loader.style.display = ...` calls are now null-guarded.
- Hardened the form-submit handler: `e.preventDefault()` now fires unconditionally. Previously it only fired when validation failed, and relied on the sibling click handler to prevent default in the happy path — a hole whenever that sibling handler didn't register. Validation and user-feedback behaviour are preserved.
- New tracking events: `form_submit_capture_blocked`, `payment_loader_missing_at_init`, and `reason: 'native_submit_prevented'` on `form_submit_blocked` for diagnostics.

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
