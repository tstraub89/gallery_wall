# Mastering Smart Fill: AI-Powered Photo Selection

Choosing which photo goes in which frame is often the hardest part of planning a gallery wall. GalleryPlanner's **Smart Fill** feature uses local AI to automate this process, selecting the perfect images from your library based on composition, color, and quality.

## What is Smart Fill?

Smart Fill is a Pro feature that analyzes your uploaded photo library and matches images to the frames on your wall. Instead of manually dragging photos into every frame, Smart Fill can populate your entire layout in seconds, ensuring a cohesive and professional look.

> 💡 **Tip:** This is a beta feature.We are continuously improving our AI models and selection logic. These settings and features are subject to frequent updates as we refine the GalleryPlanner experience.

**The best part?** The analysis happens entirely in your browser. Your photos are never uploaded to our servers, keeping your personal memories 100% private.

---

## How Smart Fill Thinks

The AI doesn't just pick photos at random. It evaluates every possible photo-to-frame combination—**assigning a compatibility score** based on four key pillars:

### 1. **Composition & Orientation**
The AI identifies the subject of your photo and its orientation (Portrait vs. Landscape). It ensures that a wide landscape shot isn't squeezed into a tall, skinny frame, and vice-versa.

### 2. **AI Face Detection**
Using a local, lightweight neural network, Smart Fill identifies faces within your images. It prioritizes these "portrait" shots for prominent frames and adjusts the crop to ensure no one is accidentally cut off.

### 3. **Color Harmony**
Smart Fill looks at the dominant colors across your library. It attempts to distribute colors evenly across your wall, avoiding "clusters" of similar tones and creating a balanced visual rhythm.

### 4. **Print Quality (Resolution Check)**
This is the most practical check. The AI calculates the physical size each photo would be printed at based on your frame dimensions. It will skip low-resolution images that would appear blurry or pixelated when printed.

---

## How to Use Smart Fill

Smart Fill is integrated directly into your workflow. Whether you want to fill an entire wall or find the perfect shot for a single frame, the AI is always ready to help.

### 1. **Fill All Frames (Lucky)**
If you've just generated a new layout and want to see an instant design:
1. Open the **Smart Fill** section in the sidebar.
2. Ensure your library is analyzed (it happens automatically after upload).
3. Click the **"✨ Fill All Frames (Lucky)"** button.
4. Watch as the AI populates every empty frame on your wall with unique, high-scoring photos.

### 2. **Instant Selection Suggestions**
If you have a specific frame you want to fill manually but need inspiration:
1. **Click any frame** on your wall.
2. Look at the **Smart Fill** section in the sidebar.
3. The AI automatically generates a list of **"Suggestions for selected frame"**, sorted by their compatibility score.
4. Keep an eye on the sidebar indicators:
    - **Match Score (0-100)**: Shows how well the photo fits.
        - **Green (> 80)**: Excellent match.
        - **Orange (50-80)**: Good match, might need minor cropping.
        - **Red (< 50)**: Poor match (wrong shape or low quality).
    - **Duplicate Warning (Red !)**: Shows that this photo is already placed somewhere else on your wall.
    - **Current Selection (Green ✓)**: Marks the photo currently inside the selected frame.

> **Note on Print Quality:** If you see a **Red or Yellow Triangle** on your canvas frames, that is a resolution warning.
> *   ⚠️ **Yellow**: Quality is okay (< 300 PPI) but could be sharper.
> *   🔺 **Red**: Quality is low (< 150 PPI) and may look pixelated.

### 3. **The Right-Click Shortcut**
For Power Users who want to stay focused on the canvas:
1. **Right-click** any frame on your wall.
2. Select **"Auto-fill"** from the context menu.
3. The AI will instantly search your library and place the single best match for that specific frame size and orientation.

---

## Getting the Best Results

To help the AI help you, follow these simple tips:

### Over-Upload Your Library
The AI needs choices. If you have 10 frames on the wall, don't just upload 10 photos. Upload 30 or 40. This gives the "Color Harmony" and "Resolution" checks enough data to find truly great matches.

### Use the Style Toggles
In the Smart Fill settings, you can guide the AI's aesthetic choices:
- **Target Faces**: Ensures your favorite people are prioritized and perfectly centered in their frames.
- **Prefer B&W**: Instantly creates a timeless, "Fine Art" gallery feel by selecting your monochromatic shots.
- **Prefer Vibrant**: Perfect for colorful vacation photos or high-energy family sessions.

### Manually Fine-Tune
Smart Fill is a powerful assistant, but you're the lead designer. After the AI fills your wall, you can still:
- **Pan and Zoom**: Adjust the crop the AI selected.
- **Swap**: Drag a different photo over a frame to replace it.
- **Shuffle**: Click "Smart Fill" again to see a completely different arrangement.

---

## Frequently Asked Questions

**Is my data private?**
Yes. Unlike other AI tools, GalleryPlanner runs the Smart Fill engine locally on your device. Your photos stay in your browser's memory and are never sent to a cloud server for processing.

**Why are some photos being skipped?**
Usually, this is due to the **Resolution Check**. If a photo's pixel count is too low for the selected frame size (falling below 150 DPI), the AI will skip it to prevent you from ordering a low-quality print.

**Can I undo a Smart Fill?**
Yes! Just use the standard **Undo (Ctrl/Cmd + Z)** or click the "Clear All Photos" button in the project menu to start fresh.

---

## Related Guides

- **[Understanding Smart Layout](/learn/understanding-smart-layout)** — Learn how the AI arranges the frames themselves.
- **[Print Resolution Guide](/learn/print-resolution-guide)** — A deep dive into DPI and image quality.
- **[GalleryPlanner Pro Features](/learn/what-is-galleryplanner-pro)** — Explore the full suite of Pro tools.

**Ready to try Smart Fill?** [Launch the App →](/app)
