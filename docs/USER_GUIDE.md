# User Guide – Construction Costing System

Welcome! This guide explains how to use the Construction Costing System web app.

## Getting Started

1. **Open the app in your browser.** You can also try the landing page `landing.html` which contains a quick overview and launch buttons.
2. **Create a new project** or select an existing one.

## Working with BOQ Items

- **Add Item:** Enter item name, quantity, and unit rate. Click "Add".
- **Edit Item:** Click the edit icon next to an item, update fields, and save.
- **Delete Item:** Click the delete icon next to an item.

## Calculations

- The app automatically calculates:
  - **Item Cost:** Quantity × Unit Rate
  - **Subtotal:** Sum of all item costs
  - **Tax:** Applied to subtotal (see settings)
  - **Grand Total:** Subtotal + Tax

## Saving and Loading

- **Save:** Your data is saved automatically in your browser (localStorage).
- **Load:** Reload the page to continue where you left off.

## Export & Import

- **Export to PDF:** Click "Export PDF" to download your BOQ as a PDF.
- **Export to Excel/CSV:** Click "Export Excel/CSV" for spreadsheet formats.
- **Import:** Use "Import" to load BOQ data from Excel/CSV.

## Language & Layout

- **Switch Language:** Use the language toggle (EN/AR) in the navigation bar.
- **RTL Support:** Arabic mode uses right-to-left layout.

## Plans & Upgrades

- **Free Plan:** Limited number of items/projects.
- **Pro Plan:** Unlocks all features. Click "Upgrade" to simulate upgrade.

## Diagnostics & Feedback

- **Diagnostics Screen:** Access from the navigation bar to view app version, analytics status, and test error reporting.
- **Changelog:** See `docs/CHANGELOG.md` for release notes.
- **Feedback:** Open a GitHub issue or email `you@example.com` (replace with your address).

## How to plug in real launch URLs (TODO)
- Replace the Product Hunt link in `landing.html` with your Product Hunt product URL.
- Replace social & share links with your actual pages or sharing endpoints.
- Update `og:url` and `og:image` in `index.html` and `landing.html` with your production URL and share image.

---

Enjoy using the Construction Costing System!
