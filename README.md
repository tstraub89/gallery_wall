# Gallery Wall Planner 🖼️✨

A powerful, interactive web application for planning gallery walls. Visualize your layouts with real frames and personal photos before you hang a single nail.

## Features

### 🖼️ Frame Library & Management
-   **Manual Addition**: Quickly add custom frames with specified internal openings (matting) directly in-app.
-   **Import via Text**: Batch import your collection from a simple text list (e.g., "8x10", "11x14 matted to 8x10").
-   **Smart Parsing**: Fraction handling (e.g., "11 1/4") and automatic matted opening detection.
-   **HxW Support**: Toggle "Input is Height x Width" to handle different list formats.
-   **Inventory Tracking**: Instantly see which frames have been "Placed" on the wall.
-   **Library Deletion**: Hover to remove unused frame templates from your library.

### 📸 Photo Library
-   **Batch Upload**: Add multiple photos at once.
-   **Masonry Layout**: View your photos in a beautiful, full-view masonry grid.
-   **Selection & Management**: Multi-select photos (Ctrl/Cmd + Click) to manage or delete them.
-   **Drag & Drop**: Drag photos from the library onto frames on the canvas.
-   **Smart Integration**: Drag files from your computer onto a frame to place them *and* auto-save them to your library.
-   **Usage Indicators**: Photos currently on the wall are marked with a label.

### 🎨 Infinite Canvas Workspace
-   **Pan & Zoom**: Navigate a limitless workspace with familiar controls (Space-bar or Drag background to pan, Ctrl+Scroll to zoom).
-   **Grid & Snapping**: Toggle a background grid (`#`) and enable snap-to-grid (`S`) for perfect alignment.
-   **Undo / Redo**: Full history support with `Ctrl+Z` and `Ctrl+Y`.
-   **Multi-Select**: Shift-click to select multiple frames, or `Ctrl+A` to select all.
-   **Alignment Tools**: Align selected frames (Left, Center, Right, Top, Middle, Bottom) with one click.
-   **Group Dragging**: Move entire clusters of frames together without losing their relative positions.
-   **Wall Templates**: Switch between Flat, Staircase (Ascending/Descending) configurations.

### 🛠️ Image & Frame Props
-   **Smart Panning**: Adjust the X/Y position, scale, and rotation of an image *within* its frame.
-   **Precise Controls**: Use sliders or numeric inputs for pixel-perfect placement.
-   **Frame Styling**: Adjust frame border thickness globally for any selection.
-   **Accurate Matting**: Mats are rendered with real-world dimensions relative to frame size.
-   **Quick Removal**: Delete frames from the canvas with a single click or the `Delete` key.

### 💾 Project Management
-   **Multiple Projects**: Create and switch between distinct gallery wall designs.
-   **Unified Header Actions**: "Save PNG", "Export Project", and "Import Project" are centrally located in the top menu.
-   **Auto-Save**: Progress is automatically saved to your browser's local storage.
-   **Robust Export**: High-resolution PNG output with cross-browser stability (Firefox/Chrome optimized).
-   **Safe Deletion**: Delete any project; the app will automatically start a fresh one if you delete your last layout.

## Tech Stack
-   **React** (Vite)
-   **CSS Modules** (custom responsive design)
-   **IndexedDB** (for efficient local image storage)
-   **html-to-image** (for high-fidelity canvas exports)
-   **UUID** (for unique entity tracking)

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Open in Browser**
    Visit the local URL provided by Vite (usually `http://localhost:5173`).

## Usage Tips

-   **Find Placed Frames**: Click any frame in the Left Sidebar to instantly select all its instances on the canvas.
-   **Resize Sidebar**: Drag the right edge of the left sidebar to change focus between your library and the canvas.
-   **Keyboard Shortcuts**:
    -   `S`: Toggle Grid Snapping
    -   `#`: Toggle Grid Visual
    -   `Ctrl + Z` / `Cmd + Z`: Undo
    -   `Ctrl + Y` / `Cmd + Shift + Z`: Redo
    -   `Ctrl + A`: Select All Frames
    -   `Backspace` / `Delete`: Remove selected frames from canvas
