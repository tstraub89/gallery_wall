# Gallery Wall Planner 🖼️✨

**Visualize your perfect gallery wall before you hang a single nail.**

A powerful, interactive web application designed to help you plan complex gallery layouts with real frames and personal photos. Transition from a pile of frames on the floor to a perfectly aligned wall with confidence.

<a href="https://www.buymeacoffee.com/tstraub89" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217"></a>

---

## 🚀 Key Highlights

*   **Precision Layout Canvas**: An infinite workspace with pan, zoom, and smart snapping tools (`S`, `#`) for pixel-perfect alignment.
*   **Inventory First Workflow**: Keep track of your physical frames. Even if you remove a frame from the wall, it stays in your "Unplaced" library for later use.
*   **Instant Visualization**: Drag and drop photos from your computer directly onto frames to see your memories in situ.
*   **Intelligent Import**: Quickly build your library by pasting a list of dimensions (e.g., "8x10", "11 1/4 x 14"). The app handles fractions and matting automatically.
*   **Print-Ready Photo Export**: preparing your gallery for reality? Export all your cropped, high-resolution photos in a single ZIP, ready for printing.
*   **Template Support**: Switch between standard flat walls and specialized staircase configurations (ascending/descending).
*   **Circular & Oval Shapes**: Design beyond rectangles with full support for round frames and matted cutouts.

---

## 🛠️ Detailed Features

### 🖼️ Inventory & Frame Management
*   **1:1 Inventory Manifest**: Every frame is accounted for individually in the sidebar with "Placed" and "(Duplicated)" status indicators.
*   **Manual & Batch Addition**: Add custom frames with specific internal openings (matting) or import an entire collection via text.
*   **Smart Parsing**: Comprehensive handling of fractions (e.g., "11 1/4") and automatic detection of matted openings.
*   **Geometric Variety**: Choose between traditional rectangular frames and modern round/oval shapes with automatic proportional scaling.

### 📸 Photo Management
*   **Batch Upload**: Add multiple photos at once and view them in a beautiful masonry grid.
*   **Multi-Select**: Manage your library efficiently with `Ctrl / Cmd + Click` selection.
*   **Smart Integration**: Drag files directly from your computer onto a canvas frame to place them and auto-save them to your library simultaneously.

### 🎨 Workspace Interaction
*   **Marquee Selection**: Bulk-select frames by dragging on the background.
*   **Context Menu**: Right-click for quick access to Layering (Bring to Front), Duplication, and Photo removal.
*   **Advanced Alignment**: One-click tools to align selected frames by edges or centers.
*   **Undo / Redo**: Full history support with `Ctrl+Z` / `Ctrl+Y`.

### 💾 Project Controls
*   **Shopping List**: Export a text manifest of all frames in your design for easy shopping or assembly.
*   **Photo Export**: Generate a ZIP file of all your photos, cropped to their exact visible area (with 1/8" bleed) for high-quality printing.
*   **Multi-Project Support**: Create and switch between distinct gallery wall designs.
*   **Canvas Snapshot**: Save your layout as a PNG to share or use as a reference.

---

## ⌨️ Shortcuts & Navigation

Click the **"?"** button in the header for the in-app **Quick Start Guide**.

| Category | Shortcut | Action |
| :--- | :--- | :--- |
| **View** | `Right-Click + Drag` | Pan Workspace |
| | `Ctrl / Cmd + Scroll` | Zoom In/Out |
| | `#` | Toggle Background Grid |
| | `S` | Toggle Snap-to-Grid |
| **Selection** | `Ctrl / Cmd + A` | Select All (Frames or Photos) |
| | `Click + Drag` | Marquee selection |
| **Edit** | `Ctrl / Cmd + D` | Duplicate Selection |
| | `Ctrl + Drag` | Quick Duplicate and Move |
| | `Arrows` | Nudge 1px (`Shift` for 10px) |
| | `Backspace / Del` | Remove Selection |
| | `Double-Click` | Reset image scale/position in frame |
| **History** | `Ctrl + Z` | Undo |
| | `Ctrl + Y` | Redo |

---

## 🏗️ Getting Started

1.  **Install**: `npm install`
2.  **Dev Server**: `npm run dev`
3.  **Browse**: Open `http://localhost:5173`.

> [!TIP]
> You can load [example_staircase.gwall](./example_staircase.gwall) to try out the tool with a preconfigured gallery wall layout. You can also check [example_frame_template.txt](./example_frame_template.txt) to see how to format your own frame collection for batch importing.

**Tech Stack**: Built with React (Vite), CSS Modules, and IndexedDB for persistent local storage.
