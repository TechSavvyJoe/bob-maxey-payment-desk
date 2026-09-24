# Production-readiness validation — September 24, 2026

The September 24 audit was implemented on `codex/production-ready-payment-desk`. This is a release candidate for dealership review. It has not been merged to main or published.

The visual direction retains the established Ford-blue identity: raised individual section cards, shaded icon headers, bold labels, a complete navy payment summary, and compact financing/target sections. IBM Plex Sans is bundled locally with its SIL Open Font License. Vehicle reference/date fields are available under Deal details. Calculation and validation repairs remain in place.

## Evidence

- ESLint, 55 unit/regression tests, and the Vite production build pass.
- All 41 applicable Playwright checks passed, with 4 intentionally inapplicable project cases skipped. The initial run passed 39; two WebKit checks passed unchanged on a targeted rerun after a concurrent build caused a navigation 404 and system contention exhausted one test's time budget. Every financial/customer journey runs on desktop Chromium, mobile Chromium, and desktop WebKit. The breakpoint sweep runs once; the hidden mobile-grid recovery test runs on mobile and includes resizing to desktop with an invalid draft.
- Automated WCAG-tagged axe scans pass on the dealer, grid, and customer surfaces in all three projects. This does not establish complete accessibility conformance.
- Responsive checks cover 320, 390, 760, 800, 801, 900, 1024, 1280, and 1440 CSS pixels. Desktop, tablet, mobile, and customer screens were also inspected visually.
- The requested product choices are Service Contract, Gap, and Other. Positive Other charges need a custom name and an explicit tax choice. The same products and taxes reach the customer proposal.
- The browser tests exercise repeated payment targets, Undo after subsequent edits, malformed amount/date recovery, APR rounding, new registration unknown versus explicit zero, copy fallback, share failure without printing, mobile grid/customer transitions, and keyboard collapse behavior.
- A synthetic multi-product proposal was generated as an actual headless Chromium PDF without background graphics, then its pages were rendered and visually checked. Physical printer and operating-system share dialogs remain manual acceptance items.
- Dependency installation reported no known npm vulnerabilities. The app uses local fonts and browser memory; no saved-deal backend or analytics service is introduced.

## Release boundaries

Business owners must approve CRV/product tax treatment, the conservative document-fee basis, representative lender/DMS reconciliation, and any supported use beyond the documented Michigan purchase scope. Physical-device assistive-technology checks and a staff pilot remain in `ACCEPTANCE.md`.

The Pages environment was read and verified to permit the main branch. The main-branch protection status and CI evidence are recorded with the pull request. Workflow files alone do not prove repository protection.

## Review artifacts

The task's local artifact folder contains the original professional review, 22-item backlog, current visual evidence, and PDF proof:

`C:/Users/JoeGallant/.codex/visualizations/2026/09/24/01a0d4e6-462f-74e0-9109-7f4bd977c87d/`

Key files: `PROFESSIONAL-HANDOFF-REVIEW.md`, `implementation-backlog.csv`, `restored-design-desktop.png`, `restored-design-mobile.png`, `restored-design-customer.png`, and `restored-design-print.pdf`. Earlier `redesign-*` images and the design concept are superseded by these current screenshots. The paths are local evidence, not public deployment URLs.
