# GalleryPlanner Project Context

## Overview
**GalleryPlanner** is an interactive web application for planning gallery wall layouts. It allows users to visualize frame arrangements on a virtual wall, supporting real photos, custom frame sizes, and complex layouts (including staircases).

It features a "Pro" tier (currently free in beta) that includes AI-assisted auto-layout, PDF exports, and project persistence.

## Tech Stack
*   **Framework**: React 19
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Styling**: CSS Modules (`*.module.css`)
*   **Routing**: React Router DOM
*   **Icons**: Lucide React
*   **Analytics**: PostHog, Vercel Speed Insights
*   **Content**: react-markdown, rehype-raw, remark-gfm
*   **PDF/Image Generation**: `jspdf`, `html2canvas`
*   **Utilities**: `jszip` (Zip generation), `file-saver`, `uuid`, `clsx`

## Build & Run

### Scripts
*   `npm run dev`: Start the development server (available at `http://localhost:5173`).
*   `npm run build`: Build the application for production (includes sitemap generation).
*   `npm run preview`: Preview the production build locally.
*   `npm run lint`: Run ESLint checks.
*   `npm run type-check`: Run TypeScript type checking.
*   `npm run sitemap`: Generate `sitemap.xml` based on static routes and articles.

## Versioning & Release Policy

### Semantic Versioning Rules
*   **Patch (x.x.Y)**:
    *   **Definition**: Bug fixes, minor app functionality changes, or significant website architectural updates.
    *   **Agent Permission**: ✅ **Allowed**. You may bump this as needed if changes meet the threshold and are not purely content/cosmetic.
*   **Minor (x.Y.x)**:
    *   **Definition**: New features, significant non-breaking changes.
    *   **Agent Permission**: ⚠️ **Suggest Only**. You must **PROPOSE** this to the user. Do **NOT** bump without explicit confirmation.
*   **Major (Y.x.x)**:
    *   **Definition**: Breaking changes, massive overhauls.
    *   **Agent Permission**: ⛔️ **Forbidden**. Only bump this when explicitly instructed by the user.

### Commit Conventions
*   **Standalone Release**: If the commit *only* bumps the version, use `chore(release): vX.X.X`.
*   **Mixed Release**: If the commit includes code changes *and* a version bump, the message should focus on the changes (e.g., `feat: add new sidebar (v0.3.0)`).
*   **Website Tweaks**: Minor copy/CSS changes to the website do **NOT** warrant a version bump. Commit them directly.

### Release Process
When bumping a version (Patch or Minor):
1.  **Update `package.json`**: Increment the `version` field.
2.  **Update `CHANGELOG.md`**: Add a new entry with high-level, user-friendly descriptions of the changes.

### State Management
The application uses React Context for global state management:
*   **`ProjectContext`**: Central store for the current project state, including the wall configuration, placed frames (`frames`), and the unplaced inventory (`library`).
*   **`LayoutContext`**: Manages UI layout state (sidebar visibility and width).
*   **`ViewportContext`**: Manages canvas viewport state (pan and zoom).
*   **`SelectionContext`**: Manages selection state for frames, images, and templates.
*   **`ProContext`**: Manages subscription status and feature gating (Pro vs. Free).

### Data Model (`src/types.ts`)
*   **`Project`**: The root object containing `frames`, `library`, `wallConfig`, and `images`.
*   **`Frame`**: Represents a placed frame on the wall. Properties include geometry (`x`, `y`, `width`, `height`, `rotation`), visual style (`frameColor`, `matted`), and content (`imageId`).
*   **`LibraryItem`**: Represents a frame type in the user's inventory (not yet placed on the wall). It extends `Frame` and includes a `count`.
*   **`WallConfig`**: Defines the wall dimensions and type (e.g., standard vs. staircase with `stairAngle`).

### Layout Recommendation Engine
The "Auto-Layout" feature runs in a separate Web Worker (`src/recommender/recommender.worker.ts`) to avoid blocking the main thread.
*   **Generators**: Implements specific layout algorithms in `src/recommender/generators/`:
    *   `MonteCarloGenerator`
    *   `GridGenerator`
    *   `MasonryGenerator`
    *   `SkylineGenerator`
    *   `SpiralGenerator`
*   **Communication**: The main thread sends `GENERATE` messages, and the worker replies with `SOLUTION_FOUND` for valid layouts.

## Directory Structure
*   `infra/`: Infrastructure code (e.g., PostHog reverse proxy).
*   `scripts/`: Build and maintenance scripts (e.g., sitemap generation).
*   `src/components/`: React components grouped by feature (e.g., `Canvas/`, `Library/`, `Properties/`).
*   `src/content/`: Markdown content for articles and resources.
*   `src/context/`: Context providers and hooks.
*   `src/hooks/`: Custom React hooks (e.g., `useCanvasDrag`, `useCanvasSelection`, `useCanvasDrop`, `useProject`).
*   `src/recommender/`: Worker code and layout algorithms.
*   `src/utils/`: Helper functions for geometry, export, and image handling.
*   `public/`: Static assets and example files.

## Asset Management

### Image Assets
*   **Format**: All static images (heros, featured resources) MUST be in **WebP** format.
*   **Generation**: When generating new images via AI, they must be converted from PNG to WebP before being committed to `/public`.
*   **Conversion Command**: 
    ```bash
    npx -y cwebp-bin -q 80 ${file}.png -o ${file}.webp
    ```
*   **Cleanup**: Original PNG files should be removed after successful conversion.

## Conventions
*   **Styling**: Use CSS Modules for component-specific styles.
*   **Typing**: Strict TypeScript usage. Interfaces are defined in `src/types.ts`.
*   **Features**: Pro features are explicitly marked and gated.
*   **Storage**: Uses `IndexedDB` for local persistence (implied by `ProjectContextCore` or similar utils not deeply analyzed but referenced in README).