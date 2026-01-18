# Gallery Wall Planner

A powerful, interactive web application for planning gallery walls. Visualize your layouts with real frames and personal photos before you hang a single nail.

## Features

### 🖼️ Frame Library & Management
-   **Import Frames**: Easily import your collection of frames from a text list.
-   **Smart Parsing**: Supports "8x10" and "matted to 5x7" syntax automatically.
-   **HxW Support**: Toggle "Input is Height x Width" to handle different list formats.
-   **Usage Tracking**: The library dims frames that are already placed on the canvas, so you know exactly what inventory you have left.
-   **Collapsible Sidebar**: Organized "Frames" and "Photos" sections.

### 📸 Photo Library
-   **Batch Upload**: Add multiple photos at once.
-   **Masonry Layout**: View your photos in a beautiful, full-view masonry grid (vertical scrolling).
-   **Drag & Drop**: Drag photos from the library directly onto frames on the canvas.
-   **OS Integration**: Drag files from your computer directly onto a frame to place them *and* auto-save them to your library.
-   **Usage Indicators**: Photos currently on the wall are marked with a "Use Again" label.

### 🎨 Infinite Canvas Workspace
-   **Pan & Zoom**: Navigate a limitless workspace with familiar controls (Space+Drag or Middle-Click to pan, Ctrl+Scroll to zoom).
-   **Grid & Snapping**: Toggle a background grid (`#`) and enable snap-to-grid (`S`) for perfect alignment.
-   **Multi-Select**: Shift-click to select multiple frames, or `Ctrl+A` to select all.
-   **Group Dragging**: Move entire clusters of frames together while maintaining their relative positions.
-   **Wall Templates**: Switch between Flat, Staircase, or Corner wall configurations.

### 🛠️ Image & Frame Controls
-   **Smart Panning**: Adjust the X/Y position of an image *within* its frame to reveal hidden areas (no cropping!).
-   **Precise Positioning**: Use sliders or text inputs for pixel-perfect placement.
-   **Rotation**: Rotate both frames and images independently.
-   **Accurate Matting**: Mats are rendered with real-world dimensions (e.g., a 2-inch mat looks like 2 inches relative to the frame).

### 💾 Project Management
-   **Multiple Projects**: Create and switch between different distinct layouts.
-   **Auto-Save**: Progress is automatically saved to your browser's local storage.
-   **Export Tools**:
    -   **Backup**: Export your project data to JSON.
    -   **Shopping List**: Generate a text file list of all frames used in the current design.

## Tech Stack
-   **React** (Vite)
-   **CSS Modules** (custom responsive design)
-   **IndexedDB** (for efficient local image storage)
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

-   **Resize Sidebar**: Drag the right edge of the left sidebar to make your photo thumbnails larger.
-   **Keyboard Shortcuts**:
    -   `S`: Toggle Grid Snapping
    -   `#`: Toggle Grid Visual
    -   `Ctrl + A`: Select All Frames
    -   `Backspace` / `Delete`: Remove selected frames
