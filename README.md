# MikScooter Examenkiezer

Custom JavaScript for the MikScooter Webflow examenkiezer page, served via the jsDelivr CDN.

**Status:** active — temporary solution until MikScooter migrates to the Voltality Next.js/Sanity/Vercel stack, at which point this repo will be archived.

**Owner:** Steven van Eck (Voltality)

---

## Production URLs

| Script | Webflow page | jsDelivr URL |
|---|---|---|
| `examenkiezer.js` | `/examenkiezer` | https://cdn.jsdelivr.net/gh/GitVoltality/mikscooter-examenkiezer@main/examenkiezer.js |

---

## Webflow integration

Each script is loaded from Webflow's page-level "Before `</body>`" custom code field with a single tag, for example:

```html
<script src="https://cdn.jsdelivr.net/gh/GitVoltality/mikscooter-examenkiezer@main/examenkiezer.js"></script>
```

---

## Update workflow

1. Edit the `.js` file locally
2. Bump the version header comment at the top of the file
3. Update `CHANGELOG.md` with a new version entry
4. Commit, tag, and push:
   ```bash
   git add <file>.js CHANGELOG.md
   git commit -m "<script>: v<version> — <short description>"
   git tag <script-name>-v<version>
   git push --follow-tags
   ```
5. Purge the jsDelivr cache:
   ```bash
   ./purge.sh <file>.js
   ```
6. Verify on the live Webflow page (hard refresh: `Cmd+Shift+R` / `Ctrl+Shift+R`)

Global propagation after purge: ~30–60 seconds.

---

## Versioning

Semver per-script. Tag format: `<script-name>-v<semver>` (e.g. `examenkiezer-v1.2.3`).

- **Patch** (1.0.0 → 1.0.1): bug fixes
- **Minor** (1.0.0 → 1.1.0): new features, backward compatible
- **Major** (1.0.0 → 2.0.0): breaking changes

---

## Rollback

**Git revert (preferred):**
```bash
git revert <bad-commit-sha>
git push
./purge.sh <file>.js
```

**Emergency URL pin in Webflow** (if a faster rollback is needed) — swap the Webflow `<script>` tag to a known-good tag:
```html
<script src="https://cdn.jsdelivr.net/gh/GitVoltality/mikscooter-examenkiezer@examenkiezer-v1.0.0/examenkiezer.js"></script>
```

Tag-pinned URLs are immutably cached, so this rollback is instant and permanent until you swap back to `@main`.

---

## Important notes

- **Repo must stay public.** jsDelivr does not serve private GitHub repos.
- **Never wrap contents of `.js` files in `<script>` tags.** Those tags live only in Webflow, wrapping the CDN URL.
- **Everything in this repo ships to the browser.** Don't commit internal URLs, secrets, or debug comments beyond what's already exposed client-side.
