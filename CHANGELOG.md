# Changelog

All notable changes to this project will be documented in this file.

## [0.2.7] - 2026-02-06

### ✨ Beta Experience & Pro Gating
- **Pro Features**: Core premium features (Smart Layouts, Hanging Guides) are now properly gated. Users can unlock them immediately for **free** during the beta period.
- **Improved UI**: The "PRO" badge is now more readable, and "Vibe" has been renamed to "Layout" for clarity.
- **Fail Fast**: The Auto-Layout engine now fails instantly if a request is physically impossible (e.g., "Use All Images" on a tiny wall), rather than timing out.

### 🛡 Infrastructure
- **Bug Reporter**: Added a built-in "Report Issue" tool that generates a pre-filled email with diagnostic info. Found in the Header, Help Menu, and Mobile App.
- **Error Boundary**: The entire application is now wrapped in a global error handler to prevent "white screen" crashes.
- **Mobile Polish**: Fixed an annoyance where double-tapping the mobile menu would trigger a browser zoom.

## [0.2.6] - 2026-02-06

### 📊 Analytics
- **PostHog**: Migrated all analytics to PostHog for unified event tracking and rich usage insights (funnels, sessions).
- **Privacy**: Removed Vercel Analytics and the Cloudflare "hash hack" (which cluttered the URL bar). Privacy Policy updated to reflect these changes.

## [0.2.5] - 2026-02-06

### 🐛 Bug Fixes
- **Export Menu**: Removed duplicate "Export Project" entry from the Export dropdown menu. It is now exclusively located in the Project menu.

## [0.2.4] - 2026-02-06

### ⚡ Performance
- **Mobile Assets**: Generated and implemented mobile-optimized variants (800px width) for all landing page images.
- **Responsive Loading**: Added `srcset` attributes to serve lighter images specifically to mobile devices.

### 💅 Website Improvements
- **Mobile Footer**: Refactored the website footer into a responsive grid. The link columns now stack vertically on small screens.
- **Navigation**: The "What's New" link in the footer now opens in the same tab.

## [0.2.3] - 2026-02-06

### 🐛 Bug Fixes
- **Project Menu**: The project dropdown now correctly closes when clicking outside of it.

## [0.2.2] - 2026-02-06

### 🛠️ Stability & Layout Fixes
- **Persistent PPI Warnings**: Fixed a bug where quality warnings would disappear during layout transitions. Metadata is now reliably fetched even for cached images.
- **Layout Locking**: The app now locks into Desktop or Mobile layout upon initial load. This prevents jarring UI swaps when resizing the browser window on desktop.

## [0.2.1] - 2026-02-06

### 🖼️ Image Optimization (Balanced Pro)
- **Dual-Blob Storage**: Implemented a performance-first architecture that stores **1600px Previews** for the UI and **5000px Masters** for high-quality exports.
- **Full WebP Migration**: All image tiers (Master, Preview, and Thumbnail) now use **WebP** for maximum compression. This reduces total project storage by up to 60% compared to raw JPEGs.
- **Demo Crunch**: Optimized the example project from **32.6 MB** to **1.1 MB**, resulting in near-instant initial load times.
- **Smart PPI Logic**: Fixed quality reporting to ensure PPI warnings always calculate against the high-resolution Master image, even when viewing a Preview.

### 🛠️ UI & Interaction Fixes
- **Context Menu Reliability**: Fixed a bug where right-click menus would stop working after panning.
- **Selection Clearing**: Clicking the canvas background or pressing `Escape` now reliably clears selected frames.
- **Event Propagation**: Refined event handling to prevent interaction conflicts between selection, panning, and context menus.


## [0.2.0] - 2026-02-05

### 🚀 New Web Platform
- **Full Site Launch**: GalleryPlanner is no longer just a canvas. We’ve added a dedicated **Landing Page**, **Help Center**, **About Page**, and **Privacy Policy** to support a growing user base.
- **Vercel Migration**: We’ve moved our hosting to Vercel for faster load times, better global caching, and improved routing.

### 🏆 GalleryPlanner Pro
- **Pro Architecture**: The foundation for GalleryPlanner Pro is now live, including secure feature gating, persistent status, and a premium visual identity.
- **PDF Hanging Guide**: *The flagship Pro feature.* You can now generate a professional, print-ready "Installation Guide" that includes your layout snapshot and precise measurements for hanging your frames in the real world.

### ⚡️ Core Experience
- **Performance Improvements**: A major overhaul of the interaction engine ensures butter-smooth performance, even on complex walls with dozens of frames.
- **Rigid Group Snapping**: Multi-selected frames now move as a rigid unit. The group's bounding box snaps to the grid, ensuring your carefully spaced arrangements are preserved perfectly during moves.
