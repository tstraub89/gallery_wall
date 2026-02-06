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
*   **PDF/Image Generation**: `jspdf`, `html2canvas`
*   **Zip Generation**: `jszip`

## Build & Run

### Scripts
*   `npm run dev`: Start the development server (available at `http://localhost:5173`).
*   `npm run build`: Build the application for production.
*   `npm run preview`: Preview the production build locally.
*   `npm run lint`: Run ESLint checks.
*   `npm run type-check`: Run TypeScript type checking.

## Architecture

### State Management
The application uses React Context for global state management:
*   **`ProjectContext`**: Central store for the current project state, including the wall configuration, placed frames (`frames`), and the unplaced inventory (`library`).
*   **`LayoutContext`**: Manages UI state related to the workspace (zoom level, selected tool, viewport position).
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
*   `src/components/`: React components grouped by feature (e.g., `Canvas/`, `Library/`, `Properties/`).
*   `src/context/`: Context providers and hooks.
*   `src/hooks/`: Custom React hooks (e.g., `useCanvasDrag`, `useCanvasSelection`, `useCanvasDrop`, `useProject`).
*   `src/recommender/`: Worker code and layout algorithms.
*   `src/utils/`: Helper functions for geometry, export, and image handling.
*   `public/`: Static assets and example files.

## Conventions
*   **Styling**: Use CSS Modules for component-specific styles.
*   **Typing**: Strict TypeScript usage. Interfaces are defined in `src/types.ts`.
*   **Features**: Pro features are explicitly marked and gated.
*   **Storage**: Uses `IndexedDB` for local persistence (implied by `ProjectContextCore` or similar utils not deeply analyzed but referenced in README).
