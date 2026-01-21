# Gallery Wall Planner 🖼️✨

A powerful, interactive web application for planning gallery walls. Visualize your layouts with real frames and personal photos before you hang a single nail.

## Features

### 🖼️ Frame Library & Design Inventory
-   **1:1 Inventory Manifest**: Every frame on your wall is accounted for individually in the sidebar.
-   **Persistent Library**: Duplicated frames remain in your library as "Unplaced" items even if removed from the wall.
-   **Manual Addition**: Quickly add custom frames with specified internal openings (matting) directly in-app.
-   **Import via Text**: Batch import your collection from a simple text list (e.g., "8x10", "11x14 matted to 8x10").
-   **Smart Parsing**: Fraction handling (e.g., "11 1/4") and automatic matted opening detection.
-   **Status Indicators**: Sleek "Placed" pills and "(Duplicated)" labels help you manage your physical inventory.

### 📸 Photo Library
-   **Batch Upload**: Add multiple photos at once.
-   **Masonry Layout**: View your photos in a beautiful, full-view masonry grid.
-   **Selection & Management**: Multi-select photos (Ctrl/Cmd + Click) to manage or delete them.
-   **Drag & Drop**: Drag photos from the library onto frames on the canvas.
-   **Smart Integration**: Drag files from your computer onto a frame to place them *and* auto-save them to your library.

### 🎨 Infinite Canvas Workspace
-   **Marquee Selection**: Left-click and drag on the background to bulk-select frames with a selection box.
-   **Context Menu**: Right-click any frame to access **Duplicate**, **Bring to Front**, **Send to Back**, and **Remove Photo**.
-   **Smart Duplication**: Hold `Ctrl / Cmd` while dragging a frame to spawn an instant copy on the wall.
-   **Pan & Zoom**: Navigate with ease (Right-click/Middle-click to pan, Ctrl+Scroll to zoom). Optimized for Firefox/Chrome to prevent browser zoom conflicts.
-   **Grid & Snapping**: Toggle a background grid (`#`) and enable snap-to-grid (`S`) for perfect alignment.
-   **Undo / Redo**: Full history support with `Ctrl+Z` and `Ctrl+Y`.
-   **Alignment Tools**: Align selected frames (Left, Center, Right, Top, Middle, Bottom) with one click.
-   **Wall Templates**: Switch between Flat, Staircase (Ascending/Descending) configurations.

### 💾 Project & Export
-   **Shopping List**: Export a text-based manifest of every frame in your design, including dimensions and filled status.
-   **Reset Project**: Quickly clear your canvas to start a fresh layout.
-   **Multiple Projects**: Create and switch between distinct gallery wall designs.
-   **Unfied Actions**: "Save PNG", "Export Project", and "Import Project" are centrally located.
-   **Auto-Save**: Progress is automatically saved to your browser's local storage.

## Tech Stack
-   **React** (Vite)
-   **CSS Modules** (custom responsive design)
-   **IndexedDB** (for efficient local image storage)
-   **html-to-image** (for high-fidelity canvas exports)

## Getting Started

1.  **Install Dependencies**: `npm install`
2.  **Run Development Server**: `npm run dev`
3.  **Open in Browser**: Visit `http://localhost:5173`.

## Usage Tips & Shortcuts

Click the **"?"** button in the header for the built-in **Quick Start Guide**.

-   **Navigation**:
    -   **Right-Click + Drag**: Pan Workspace
    -   **Ctrl / Cmd + Scroll**: Zoom In/Out
-   **Interaction**:
    -   **Ctrl / Cmd + Drag Frame**: Duplicate and Move
    -   **Double-Click**: Reset Image Scale/Position within a frame
-   **Keyboard Shortcuts**:
    -   `Ctrl + D`: Duplicate Selection
    -   `Ctrl + Z` / `Ctrl + Y`: Undo / Redo
    -   `S` / `#`: Toggle Snap / Grid
    -   `Arrows`: Nudge 1px (`Shift` for 10px)
    -   `Delete` / `Backspace`: Remove Selection
    -   `Ctrl + A`: Select All Frames
