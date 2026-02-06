# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-02-05

### Performance Optimizations (Major Overhaul)
- **Modularized Interaction Hooks**: Refactored the monolithic `useCanvasInteraction` into specialized hooks:
  - `useCanvasSelection`: Handles marquee selection and hit testing.
  - `useCanvasDrag`: Manages frame dragging logic.
  - `useCanvasDrop`: Handles file and library item drops.
- **Local State Dragging**: Drag operations now update a local state (`dragDelta`) instead of the global Redux/Context store on every frame. This eliminates full-canvas re-renders during interactions, resulting in smooth 60fps performance even with complex layouts.
- **Memoization**: `FrameContent` component is now memoized to prevent re-renders of frame internals when unrelated state changes.

### Features & Improvements
- **Rigid Group Snapping**: When dragging multiple frames, the group now maintains its relative arrangement perfectly. The *bounding box* of the group snaps to the grid, rather than individual frames snapping independently.
- **Throttled Selection**: Marquee selection calculations are now throttled for better responsiveness.
- **Touch Interaction**: Optimized touch gestures to utilize the new local state pattern for smoother mobile performance.

### Fixes
- Fixed an issue where context menu props caused TypeScript errors.
- Resolved various lint warnings and unused variables.
