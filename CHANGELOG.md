# Changelog

All notable changes to this project will be documented in this file.

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
