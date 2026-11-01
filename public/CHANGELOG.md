# Changelog

## Version 2.5.0 (01-11-2026)

### ✨ What's New
- **Community Showcase**: Added a live animated community showcase on the homepage, recognizing our 47+ open-source contributors with direct links to their GitHub profiles.
- **Modernized Card Design**: Increased the corner radius of all item cards, filter bars, and dialogs across the gallery for a softer, more modern Fluent look.
- **Redesigned Contribute & Changelog Pages**: Simplified the contribution guide with clear steps, direct code snippets, and an easier-to-read version history.
- **Emoji Detail Layout**: Improved the emoji export panel with responsive sizing and quick segmented controls for format selection.
- **Refined Color Customization**: Enhanced the icon color customization picker with improved gradient palettes and streamlined solid color presets.

### 🐛 Fixes & Improvements
- Fixed scrollbar visibility issues on Windows Firefox and Chromium browsers.
- Improved search performance and category filtering speed across all gallery tabs.
- Smoother hover and navigation transitions throughout the application.

## Version 2.4.0 (29-05-2026)

### ✨ Features & UI Updates
- **Dynamic Export Segmented Control**: Replaced the format selection dropdown in the Emoji detail panel with a segmented control.
- **Homepage New Icons Section**: Added an interactive display section directly on the homepage to showcase all newly added Microsoft Fluent system icons.

### 🚀 Package & Developer Tools
- **Vite 8 Upgrade**: Upgraded the bundler and development server to the latest **Vite 8** (`^8.0.14`) alongside `@vitejs/plugin-react` (`^6.0.2`) and `esbuild` (`^0.28.0`) for faster and cleaner builds.
- **Automation Scripts**: Added scripts to check (`check-missing-icons.cjs`), copy (`copy-missing-icons.cjs`), and generate metadata/IDs (`generate-icon-metadata.cjs` and `generate-icon-url.cjs`) to simplify synchronizations with upstream icon repositories.

### 📦 Icon Library Update
Synchronized with the latest Microsoft Fluent System Icons release:
- Added **728 new icon files** to local assets (**363 Filled** and **365 Regular** icons).
- Added **53 entirely new icons** (e.g., `agents_sync`, `calendar_todo`, `document_markdown`, `midi_off`, `usb`, `weather_humidity`).
- Fully cataloged and synchronized the local `icon_metadata.json` and `icon_url.json` files, now managing **2,918 unique concept icons**.

### 🐛 Bug Fixes
- Fixed an issue where the "Copy URL" section did not dynamically update its description or copied output when WebP was selected.

## Version 2.3.0 (06-01-2026)

### 🚀 Improvements
- Improved project structure and code quality.

## Version 2.2.0 (15-12-2025)

### ✨ Features
- Added new Fluent icon assets with multiple size variations.  
  Previously, only 24px icons were available; the library now includes additional sizes for better scalability and export flexibility.
- Added real query-based search URLs (`?q=`) for Apps, Emojis, and Icons pages.  
  Searches are now shareable, reload-safe, and SEO-friendly.

### 🚀 Improvements
- Improved SEO across all pages with page-specific metadata, canonical URLs, and enhanced Open Graph / Twitter previews.
- Enhanced search behavior to sync UI state with URL parameters without breaking existing filtering or keyboard shortcuts.

## Version 2.1.0 (12-12-2025)

### ✨ Features
- Added sharing functionality for emojis and icons.  
  You can now share a direct link to any emoji or icon from its detail view.

### 🚀 Improvements
- Improved Apps page layout and category structure for better navigation.
- Enhanced page titles and unified padding across pages for consistent UI spacing.

## Version 2.0.0 (10-12-2025)
