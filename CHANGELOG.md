# Changelog

All notable changes to this project will be documented in this file.

## [0.5.2] - 2026-02-08

### 🌐 Social & Discoverability
- **Project Socials**: Updated footer links to official GalleryPlanner accounts:
    - **Instagram**: [@gallery.planner](https://www.instagram.com/gallery.planner/)
    - **Bluesky**: [gallery-planner.com](https://bsky.app/profile/gallery-planner.com)
    - **Pinterest**: [galleryplanner](https://www.pinterest.com/galleryplanner/)
- **RSS Feed**: Launched an automated RSS feed at `/rss.xml` for Pinterest and feed readers.
- **Visual Polish**: Added brand icons (Instagram, GitHub, Pinterest, and a custom butterfly for Bluesky) to the footer for a more premium look.
- **Privacy First**: Moved personal social links (LinkedIn) to the About page to keep the main footer focused on the project.

### ⚡️ Automated Dates
- **Smart Last-Updated**: The sitemap and RSS feed now automatically detect when a "Learn" guide was last modified on disk, ensuring search engines always see the most recent version without manual registry updates.

## [0.5.1] - 2026-02-08

### ✨ Playground Mode
- **Free Pro Experience**: The **Example Gallery** is now a fully unlocked "Playground." Users can try all Pro features—including Smart Fill, PDF Export, and Project Backups—completely free within this demo project.
- **Instant Analysis**: Improved the `.gwall` import format to include pre-calculated AI analysis data. Importing the example project now instantly unlocks Smart Fill suggestions without any waiting.

### ⚡️ Smart Fill Improvements
- **Robust Import**: Fixed an issue where older project files might miss photo metadata, preventing Smart Fill from working. The importer now automatically detects and indexes all images inside frames.
- **Performance**: Optimized the analysis engine to handle large libraries more efficiently, with better progress tracking and memory management.

## [0.5.0] - 2026-02-08

### ✨ Smart Fill: AI Selection
- **Intelligent Photo Matching**: A powerful new tool that automatically selects the best photos for your frames based on composition, color harmony, resolution, and aspect ratio.
- **Bulk Fill**: Populate your entire gallery wall with one click, ensuring a cohesive look across the entire arrangement.
- **Neural Face Detection**: Integrated a neural network to identify faces, helping prioritize portraits and ensure people aren't cropped out.

### 🐛 Bug Fixes & Refinements
- **Frame Removal**: Fixed a critical bug where deleting frames from the canvas via the properties panel would cause a React hook error.
- **Context Menu Locking**: Re-enabled "Lock/Unlock" functionality in the canvas context menu for better project control.
- **Smart Layout (Masonry)**: Fixed the Masonry generator to correctly respect existing frames on the wall as obstacles, preventing overlapping layouts.

## [0.4.0] - 2026-02-07
 
### 📚 The "Mastery" Update: Learn Hub Launch
- **New /learn Center**: Transformed the basic resources page into a comprehensive learning hub. Organized by **Design 101**, **Installation Guides**, and **App Guides**.
- **10+ New Articles**: Added deep-dive guides on complex topics: Staircase Geometry, DPI/Resolution for Prints, Renter-Friendly Installations, and Samsung Frame TV integration.
- **Video Walkthroughs**: Integrated high-quality video guides into pillar articles, demonstrating core concepts visually.
- **SEO & Discoverability**: 
    - **JSON-LD Schema**: Implemented structured data for better search engine indexing.
    - **Automated Sitemaps**: Created a sitemap generation engine to keep Google updated as new content arrives.
    - **Semantic Routing**: Migrated from `/resources` to `/learn` with proper site-wide link refactoring.

### 🎨 Color & Style Refactor
- **Portal-based Menus**: A major architectural upgrade using **React Portals**. UI menus now float at the root Level, making them immune to sidebar clipping and overflow issues forever.
- **Custom Color Picker**: Professional-grade selector for Pro users with hex input and standard preset swatches (Wood, Gold, Silver, etc.).
- **Compact Properties**: Refined the right sidebar with a side-by-side Shape/Color layout to maximize screen real estate.

### 📱 Mobile & Polish
- **Responsive Design**: Fixed table wrapping and redesigned article headers for mobile screens.
- **Transparency**: Added "AI-Assisted" notes to all editorial content, detailing our hybrid human-AI creative process.
- **Font Loading**: Switched to async font loading to eliminate the "flash of invisible text" on first visit.

## [0.3.2] - 2026-02-07

### 🎥 Visual Upgrades
- **Interactive Landing Page**: Replaced static screenshots with high-quality looping videos to demonstrate the app's "magic moments" (Template switching, AI Layouts, Drag & Drop).
- **Hero Carousel**: Added a widescreen carousel to the "How it Works" section, visually guiding users through the core workflow.
- **Async Fonts**: Fixed a font loading issue that was causing a flash of invisible text (FOIT) on initial load, improving perceived performance.

## [0.3.1] - 2026-02-07

### 📱 Mobile Refinements
- **Low-Data Mode**: The mobile library now automatically uses lightweight thumbnails in grid view (even for "Extra Large" size) to save bandwidth and load faster.
- **Smart Navigation**: Tapping a frame that is already placed on your wall now **zooms you to it** instead of creating a duplicate.
- **Crash Fixes**: Resolved an issue where opening the library view settings on mobile could cause the app to crash.

## [0.3.0] - 2026-02-07

### 🧩 Template Packs
- **Template Library**: A massive expansion of the template system. Organize your wall instantly with new categories: **Essentials**, **Organic**, and **Architectural**.
- **Smart Replace**: Preview different layouts on your wall with a single click. The system smartly replaces the current template until you start customizing, at which point it "commits" your design.
- **Inventory Sync**: Frames added via templates are now fully integrated into your library, complete with tracking badges to show which ones are currently on the wall.
- **New Layouts**: Added over 10 new professionally designed layouts, including **The Matrix** (3x3 Grid), **The Fibonacci** (Golden Spiral), and **The Butterfly**.

## [0.2.10] - 2026-02-06

### ✨ Library Improvements
- **Gallery View Options**: Added a toggle for **Grid/List** views. Grid view now supports **Small**, **Medium** (default), **Large**, and **Extra Large** sizes.
- **Smart Loading**: Eliminated the "loading flash" when opening the sidebar by implementing a smart **LRU Cache** that keeps recent images in memory.
- **Dense Frame Grid**: The frames library now uses a compact, aspect-ratio-aware grid layout to make browsing shapes much faster.

## [0.2.9] - 2026-02-06

### ⚡ Performance & AI Readiness
- **Instant Load Fixes**: Eliminated "forced reflows" and optimized preloading to ensure the application starts and responds faster than ever.
- **AI-Ready Documentation**: Added `llms.txt` support, making it easier for AI tools and search engines to understand the platform's features and documentation.

## [0.2.8] - 2026-02-06

### 📱 Mobile & Efficiency
- **Mobile Spotlight**: Added a new section to the landing page highlighting the mobile planning experience.
- **Modern Image Formats**: Migrated all website images to WebP, significantly reducing download sizes without sacrificing quality.
- **Better Caching**: Optimized how the browser stores files (cache headers) to make repeat visits nearly instantaneous.

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
