# Production-readiness validation — September 24, 2026

The September 24 audit was implemented on `codex/production-ready-payment-desk`. This is a release candidate for dealership review. It has not been merged to main or published.

The visual direction retains the established Ford-blue identity: raised individual section cards, shaded icon headers, bold labels, a complete navy payment summary, and compact financing/target sections. IBM Plex Sans is bundled locally with its SIL Open Font License. Vehicle reference/date fields are available under Deal details. Calculation and validation repairs remain in place.

The refinement adds compact, separately bordered target cards with a grid of resulting figures, section accent colors, financing beside the deal inputs, a shorter mobile summary, and direct Compare payments / Review customer estimate / Edit deal actions. Empty estimates guide entry without presenting zero as a completed payment. Visible and entered dates use MM/DD/YY, with calendar validation and ISO rule dates retained internally. See `DESIGN-SYSTEM.md` for the component conventions and accessibility references.

## Evidence

- ESLint, 58 unit/regression tests, and the Vite production build pass.
- All 52 applicable Playwright checks passed across the full run and targeted recheck, with 5 intentionally inapplicable project cases skipped. The initial run passed 50; two WebKit checks exceeded their setup budget during slow browser startup and passed unchanged with one worker. After the target-card refinements, 13 targeted browser checks passed across Chromium, mobile Chromium, and WebKit (2 inapplicable cases skipped), covering product/export, grid navigation, populated-target accessibility, responsive boundaries, and successive target applications. The breakpoint sweep runs once; the hidden mobile-grid recovery test includes resizing to desktop with an invalid draft.
- Automated WCAG-tagged axe scans pass on the dealer, grid, and customer surfaces in all three projects. This does not establish complete accessibility conformance.
- Responsive checks cover 320, 390, 760, 800, 801, 900, 1024, 1280, and 1440 CSS pixels. Desktop, tablet, mobile, and customer screens were also inspected visually.
- The requested product choices are Service Contract, Gap, and Other. Positive Other charges need a custom name and an explicit tax choice. The same products and taxes reach the customer proposal.
- The browser tests exercise repeated payment targets, Undo after subsequent edits, malformed amount/date recovery, APR rounding, new registration unknown versus explicit zero, copy fallback, share failure without printing, mobile grid/customer transitions, and keyboard collapse behavior.
- New regressions cover start → review → edit with preserved figures, the desktop summary comparison shortcut, keyboard section jumps, field helper/error descriptions, MM/DD/YY input, and impossible-date recovery. Date unit tests include leap days and Eastern-time creation timestamps.
- A synthetic multi-product proposal was generated as an actual headless Chromium PDF without background graphics, then its pages were rendered and visually checked. Physical printer and operating-system share dialogs remain manual acceptance items.
- Dependency installation reported no known npm vulnerabilities. The app uses local fonts and browser memory; no saved-deal backend or analytics service is introduced.

## September 25 CI follow-up

GitHub runs 36066241694 and 36143119550 exposed a WebKit contrast regression missed by the earlier local validation: the Add product hover background inherited white text from the original style. The hover now explicitly retains dark blue text. Header view buttons also switch their foreground and background together to avoid a low-contrast transition. A dedicated pointer-hover regression covers Chromium and WebKit, and accessibility diagnostics now include the failing contrast/target details. The multi-surface accessibility scan requests reduced motion so smooth section scrolling cannot move touch targets while axe measures them; no accessibility rules are disabled.

## Release boundaries

Business owners must approve CRV/product tax treatment, the conservative document-fee basis, representative lender/DMS reconciliation, and any supported use beyond the documented Michigan purchase scope. Physical-device assistive-technology checks and a staff pilot remain in `ACCEPTANCE.md`.

The Pages environment was read and verified to permit the main branch. The main-branch protection status and CI evidence are recorded with the pull request. Workflow files alone do not prove repository protection.

## Review artifacts

The task's local artifact folder contains the original professional review, 22-item backlog, current visual evidence, and PDF proof:

`C:/Users/JoeGallant/.codex/visualizations/2026/09/24/01a0d4e6-462f-74e0-9109-7f4bd977c87d/`

Key files: `PROFESSIONAL-HANDOFF-REVIEW.md`, `implementation-backlog.csv`, `refined-ui-desktop.png`, `refined-ui-mobile.png`, `refined-target-grid-desktop.png`, and `refined-target-cards-compact.png`. Earlier `redesign-*` and `restored-design-*` screenshots document prior iterations. The paths are local evidence, not public deployment URLs.
