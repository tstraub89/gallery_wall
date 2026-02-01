import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PPI } from '../constants';
import { getImage } from './imageStore';
import { Project } from '../types';

// Helper to load an image from a Blob URL
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};







/**
 * Robust file saving that prefers the modern File System Access API (Chrome/Edge)
 * and falls back to FileSaver.js (Firefox/Safari).
 */
export const saveFile = async (blob: Blob, suggestedName: string) => {
    try {
        // Feature detection for File System Access API (Chrome/Edge/Opera)
        // @ts-ignore - Types might be missing for this modern API
        if (window.showSaveFilePicker) {
            const opts = {
                suggestedName,
                types: [{
                    description: 'File',
                    accept: {
                        [blob.type]: ['.' + suggestedName.split('.').pop()]
                    }
                }],
            };
            // @ts-ignore
            const handle = await window.showSaveFilePicker(opts);
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        }

        // Fallback for Firefox/Safari/Mobile
        saveAs(blob, suggestedName);
    } catch (err: any) {
        // If user cancels picker, we get an AbortError. Ignore it.
        if (err.name === 'AbortError') return;

        console.warn('File System Access API failed, falling back to FileSaver', err);
        // Last ditch fallback
        saveAs(blob, suggestedName);
    }
};


/**
 * Generates a ZIP file containing high-resolution cropped photos from the project frames.
 * @param {Project} project - The current project object containing frames.
 */
export const generateProjectZip = async (project: Project) => {
    const zip = new JSZip();
    const photoFolder = zip.folder(`${project.name || 'Gallery_Export'}_Photos`);
    if (!photoFolder) throw new Error("Failed to create zip folder");

    // Filter frames that have images
    const framesWithImages = project.frames.filter(f => f.imageId);

    if (framesWithImages.length === 0) {
        throw new Error("No photos found in the project frames.");
    }

    const errors: string[] = [];

    for (let i = 0; i < framesWithImages.length; i++) {
        const frame = framesWithImages[i];
        try {
            // 1. Fetch the original high-res image blob
            if (!frame.imageId) continue;
            const blob = await getImage(frame.imageId);
            if (!blob) throw new Error(`Image data not found for frame ${i + 1}`);

            const imgUrl = URL.createObjectURL(blob);
            const sourceImage = await loadImage(imgUrl);

            // 2. Calculate Dimensions
            // Key Fix: The UI scales the image to cover the *FRAME*, not the *MAT*.
            // Matting is just an overlay. So we must calculate the image size relative to the FRAME.

            const frameW_in = frame.width;
            const frameH_in = frame.height;

            // The "Visible" area is what we export (Mat opening if matted, else full frame)
            const visibleW_in = frame.matted ? frame.matted.width : frameW_in;
            const visibleH_in = frame.matted ? frame.matted.height : frameH_in;

            // Image State (x, y are in screen pixels based on screen PPI)
            const { scale = 1, x = 0, y = 0, rotation = 0 } = frame.imageState || {};

            const BLEED_IN = 0.125; // 1/8th inch bleed

            // --- Smart DPI Capping ---
            // Calculate the native PPI of the source image relative to the frame size
            const imgAspect = sourceImage.width / sourceImage.height;
            const frameAspect = frameW_in / frameH_in;
            const nativePPI = imgAspect > frameAspect
                ? sourceImage.height / frameH_in
                : sourceImage.width / frameW_in;

            // Bleed Correction for Unmatted Frames
            // If !matted, Frame == Visible. 
            // The calculated drawW/drawH covers Frame, but Canvas is Frame + Bleed.
            // We need to scale up slightly to cover the bleed (Zoom-to-Bleed).
            // If matted, Frame usually >> Mat + Bleed, so no correction needed.
            let bleedScale = 1;
            if (!frame.matted) {
                const bleedX = (visibleW_in + (BLEED_IN * 2)) / visibleW_in;
                const bleedY = (visibleH_in + (BLEED_IN * 2)) / visibleH_in;
                bleedScale = Math.max(bleedX, bleedY) * 1.005; // tiny safety buffer
            }

            // Effective PPI is native / total zoom (user scale * bleed correction)
            const effectivePPI = nativePPI / (scale * bleedScale);
            const TARGET_PPI = Math.min(300, effectivePPI);

            // Output Canvas Size (Visible Area + Bleed)
            const outputW_px = Math.ceil((visibleW_in + (BLEED_IN * 2)) * TARGET_PPI);
            const outputH_px = Math.ceil((visibleH_in + (BLEED_IN * 2)) * TARGET_PPI);

            const canvas = document.createElement('canvas');
            canvas.width = outputW_px;
            canvas.height = outputH_px;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            // Fill with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputW_px, outputH_px);

            // Move origin to center of canvas (which aligns with center of Visible Area)
            ctx.translate(outputW_px / 2, outputH_px / 2);

            // --- Image Drawing Math ---
            let drawW, drawH;
            if (imgAspect > frameAspect) {
                drawH = frameH_in * TARGET_PPI;
                drawW = drawH * imgAspect;
            } else {
                drawW = frameW_in * TARGET_PPI;
                drawH = drawW / imgAspect;
            }

            // Apply Transforms
            ctx.rotate((rotation * Math.PI) / 180);

            // Scale (User Scale * Bleed Correction)
            ctx.scale(scale * bleedScale, scale * bleedScale);

            // Pan
            // User Pan (x/y) is in Screen PPI. Convert to Target PPI.
            const screenToPrintRatio = TARGET_PPI / PPI;
            const offsetX = x * screenToPrintRatio;
            const offsetY = y * screenToPrintRatio;

            ctx.translate(offsetX, offsetY);

            // Draw Center
            ctx.drawImage(
                sourceImage,
                -drawW / 2,
                -drawH / 2,
                drawW,
                drawH
            );

            // 3. Export to Blob
            const cropBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            if (!cropBlob) throw new Error("Failed to create blob");

            // 4. Add to ZIP
            const fileName = `Frame_${i + 1}_${visibleW_in}x${visibleH_in}${frame.matted ? '_matted' : ''}.jpg`;
            photoFolder.file(fileName, cropBlob);

            URL.revokeObjectURL(imgUrl);

        } catch (err: any) {
            console.error(`Error processing frame ${i + 1}:`, err);
            errors.push(`Frame ${i + 1}: ${err.message || String(err)}`);
        }
    }

    if (errors.length > 0) {
        console.warn("Some images failed to export:", errors);
        // We still proceed to download what we have, but maybe alert?
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    await saveFile(content, `${project.name || 'Gallery'}_Photos_Export.zip`);

    return { success: true, errorCount: errors.length };
};





// Replaces html-to-image with a manual Canvas 2D implementation
// This is much more robust on iOS Safari as it avoids DOM serialization issues and memory limits
export const exportCanvasToBlob = async (
    project: Project,
    _canvasId?: string // Deprecated
): Promise<{ blob: Blob | null, error: string | null }> => {
    try {
        // High Resolution Export Settings
        // Base target is 4x native PPI (approx 40 PPI)
        const TARGET_SCALE = 4;
        let exportPPI = PPI * TARGET_SCALE;

        const widthInches = project.wallConfig.width;
        const heightInches = project.wallConfig.height;

        // Safety Cap: 5 Megapixels (Area-based)
        // 5MP is ~2236x2236 or 2700x1850. Plenty for sharing.
        // Combined with JPEG compression, this keeps files small (approx 300-800KB).
        const MAX_PIXELS = 5 * 1000 * 1000;

        const targetWidth = widthInches * exportPPI;
        const targetHeight = heightInches * exportPPI;
        const targetPixels = targetWidth * targetHeight;

        if (targetPixels > MAX_PIXELS) {
            // Scale down to fit 10MP area while maintaining aspect ratio
            const scaleDown = Math.sqrt(MAX_PIXELS / targetPixels);
            exportPPI = exportPPI * scaleDown;
        }

        const widthPx = Math.ceil(widthInches * exportPPI);
        const heightPx = Math.ceil(heightInches * exportPPI);
        const EXPORT_SCALE = exportPPI / PPI; // Recalculate scale factor for coordinate mapping

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('Could not create canvas context');

        // 1. Draw Wall Background
        const wallType = project.wallConfig.type;
        if (wallType === 'staircase-asc' || wallType === 'staircase-desc') {
            const stairAngle = project.wallConfig.stairAngle ?? 50;
            const clipPercent = Math.min(100, Math.max(10, stairAngle));
            const bottomPercent = 100 - clipPercent;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(widthPx, 0);
            if (wallType === 'staircase-asc') {
                ctx.lineTo(widthPx, heightPx * (bottomPercent / 100)); // Right side lower
                ctx.lineTo(0, heightPx);
            } else {
                ctx.lineTo(widthPx, heightPx);
                ctx.lineTo(0, heightPx * (bottomPercent / 100)); // Left side lower
            }
            ctx.closePath();
            ctx.clip();
        }

        ctx.fillStyle = project.wallConfig.backgroundColor || '#e5e5e7';
        ctx.fillRect(0, 0, widthPx, heightPx);


        // 2. Draw Frames (Sorted by Z-Index)
        const sortedFrames = [...project.frames].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        // Helper to draw a rounded rect
        const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        };

        const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
            ctx.beginPath();
            ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
            ctx.closePath();
        };

        for (const frame of sortedFrames) {
            // Frame Metrics in Export Scale
            // frame.x/y are stored in SCREEN PIXELS (PPI=10). We must scale them.
            const frameX = frame.x * EXPORT_SCALE;
            const frameY = frame.y * EXPORT_SCALE;

            const bWidthInches = typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1;
            const bWidthPx = Math.round(bWidthInches * exportPPI);
            const contentW = Math.round(frame.width * exportPPI);
            const contentH = Math.round(frame.height * exportPPI);

            const borderX = frameX - bWidthPx;
            const borderY = frameY - bWidthPx;
            const borderW = contentW + (bWidthPx * 2);
            const borderH = contentH + (bWidthPx * 2);

            const isRound = frame.shape === 'round';

            // A. Shadow (Scaled)
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 8 * EXPORT_SCALE;
            ctx.shadowOffsetX = 2 * EXPORT_SCALE;
            ctx.shadowOffsetY = 2 * EXPORT_SCALE;
            ctx.fillStyle = frame.frameColor || '#111';

            if (isRound) drawCircle(ctx, borderX, borderY, borderW, borderH);
            else drawRoundedRect(ctx, borderX, borderY, borderW, borderH, 2 * EXPORT_SCALE);

            ctx.fill();
            ctx.restore();

            // B. Border
            ctx.fillStyle = frame.frameColor || '#111';
            if (isRound) {
                drawCircle(ctx, borderX, borderY, borderW, borderH);
                ctx.fill();
            } else {
                ctx.fillRect(borderX, borderY, borderW, borderH); // Basic rect for border is crisp
            }

            // C. Content (Image + Mat)
            // Save before clipping
            ctx.save();

            // Clip
            ctx.beginPath();
            if (isRound) {
                ctx.ellipse(frameX + contentW / 2, frameY + contentH / 2, contentW / 2, contentH / 2, 0, 0, 2 * Math.PI);
            } else {
                ctx.rect(frameX, frameY, contentW, contentH);
            }
            ctx.clip();

            // Background (White if no image)
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            // Draw Image
            if (frame.imageId) {
                try {
                    const blob = await getImage(frame.imageId);
                    if (blob) {
                        const imgUrl = URL.createObjectURL(blob);
                        const img = await loadImage(imgUrl);

                        // Transforms
                        // frame.imageState.x/y are in Screen Pixels (PPI=10). Scale them.
                        const { scale = 1, x = 0, y = 0, rotation = 0 } = frame.imageState || {};
                        const scaledPanX = x * EXPORT_SCALE;
                        const scaledPanY = y * EXPORT_SCALE;

                        const centerX = frameX + contentW / 2;
                        const centerY = frameY + contentH / 2;

                        // Position logic matching CSS `object-position` + `transform`
                        ctx.save();
                        ctx.translate(centerX, centerY); // Move to center
                        ctx.rotate((rotation * Math.PI) / 180);
                        ctx.scale(scale, scale);
                        ctx.translate(scaledPanX, scaledPanY);

                        // Draw Image Centered (Cover Logic)
                        const imgRatio = img.width / img.height;
                        const frameRatio = contentW / contentH;
                        let drawW, drawH;

                        if (imgRatio > frameRatio) {
                            // Image is wider than frame -> Height fits match, Width bleeds
                            drawH = contentH;
                            drawW = contentH * imgRatio;
                        } else {
                            // Image is taller -> Width fits match, Height bleeds
                            drawW = contentW;
                            drawH = contentW / imgRatio;
                        }

                        // High quality filter
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

                        ctx.restore();
                        URL.revokeObjectURL(imgUrl);
                    }
                } catch (err) {
                    console.warn(`Failed to render image for frame ${frame.id}`, err);
                }
            }

            // Draw Matting Overlay
            if (frame.matted) {
                const mattedW = frame.matted.width * exportPPI;
                const mattedH = frame.matted.height * exportPPI;
                const matBorderW = (contentW - mattedW) / 2;
                const matBorderH = (contentH - mattedH) / 2;

                ctx.fillStyle = '#ffffff'; // Mat color

                // Top
                ctx.fillRect(frameX, frameY, contentW, matBorderH);
                // Bottom
                ctx.fillRect(frameX, frameY + contentH - matBorderH, contentW, matBorderH);
                // Left
                ctx.fillRect(frameX, frameY + matBorderH, matBorderW, mattedH);
                // Right
                ctx.fillRect(frameX + contentW - matBorderW, frameY + matBorderH, matBorderW, mattedH);

                // Inner Shadow for Mat (Simulated with stroke)
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1 * EXPORT_SCALE;
                ctx.strokeRect(frameX + matBorderW, frameY + matBorderH, mattedW, mattedH);
            }

            // Restore from Clip
            ctx.restore();
        }

        // 3. Draw Watermark (Bottom Right)
        const wmScale = EXPORT_SCALE * 0.75; // Matches scaling nicely
        const wmPadding = 20 * wmScale;
        const radius = 12 * wmScale;

        // Badge Dimensions
        const badgeW = 180 * wmScale; // Reduced to 180 for very tight fit
        const badgeH = 50 * wmScale;
        const badgeX = widthPx - badgeW - wmPadding;
        const badgeY = heightPx - badgeH - wmPadding;

        ctx.save();
        // Shadow for badge
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 10 * wmScale;
        ctx.shadowOffsetY = 2 * wmScale;

        // Badge BG
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, radius);
        ctx.fill();
        ctx.shadowColor = 'transparent'; // Clear shadow for content

        // Logo Icon (Vector Draw)
        const iconSize = 32 * wmScale;
        const iconX = badgeX + (12 * wmScale);
        const iconY = badgeY + (9 * wmScale);

        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5 * wmScale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw Rect
        const s = iconSize / 24;

        ctx.beginPath();
        drawRoundedRect(ctx, iconX + 3 * s, iconY + 3 * s, 18 * s, 18 * s, 2 * s);
        ctx.stroke();

        // Circle
        ctx.beginPath();
        ctx.arc(iconX + 8.5 * s, iconY + 8.5 * s, 1.5 * s, 0, 2 * Math.PI);
        ctx.stroke();

        // Polyline
        ctx.beginPath();
        ctx.moveTo(iconX + 21 * s, iconY + 15 * s);
        ctx.lineTo(iconX + 16 * s, iconY + 10 * s);
        ctx.lineTo(iconX + 5 * s, iconY + 21 * s);
        ctx.stroke();

        // Text: GalleryPlanner
        const fontSize = 16 * wmScale;
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#111';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textX = iconX + iconSize + (8 * wmScale);
        const textY = badgeY + (badgeH / 2);

        ctx.fillText("Gallery", textX, textY);

        const textWidth = ctx.measureText("Gallery").width;
        ctx.font = `300 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText("Planner", textX + textWidth, textY);

        ctx.restore();

        // 4. Export to Blob (JPEG for efficient sharing)
        // JPEG 0.85 reduces file size by ~90% compared to PNG while maintaining visual fidelity.
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));

        if (!blob) throw new Error('Canvas toBlob failed');
        return { blob, error: null };

    } catch (err: any) {
        console.error('Manual Canvas Export failed', err);
        return { blob: null, error: err.message || String(err) };
    }
};


/**
 * Generates a .gwall file (ZIP) containing the project metadata and all images used in frames.
 * @param {Project} project - The current project object.
 */
export const exportProjectBundle = async (project: Project) => {
    const zip = new JSZip();

    // 1. Gather used image IDs
    const usedImageIds = [...new Set(project.frames.filter(f => f.imageId).map(f => f.imageId))];

    // 2. Add Project JSON (Pruned to bundled images)
    const exportProject = {
        ...project,
        images: (project.images || []).filter(id => usedImageIds.includes(id))
    };
    const projectData = JSON.stringify(exportProject, null, 2);
    zip.file('project.json', projectData);

    // 3. Add Images
    const imageFolder = zip.folder('images');
    if (!imageFolder) throw new Error("Failed to create images folder");
    const errors: string[] = [];

    for (const imageId of usedImageIds) {
        try {
            if (!imageId) continue;
            const blob = await getImage(imageId);
            if (!blob) throw new Error(`Missing in database`);

            // We use the imageId as the filename
            imageFolder.file(imageId, blob);
        } catch (err: any) {
            console.warn(`Could not bundle image ${imageId}:`, err);
            errors.push(`${imageId}: ${err.message || String(err)}`);
        }
    }

    // 4. Generate and Save ZIP
    const content = await zip.generateAsync({ type: "blob" });
    await saveFile(content, `${project.name || 'project'}.gwall`);

    return {
        success: true,
        errorCount: errors.length,
        warnings: errors
    };
};

/**
 * Processes a .gwall file and returns the project metadata and image blobs.
 * @param {File|Blob} file - The .gwall ZIP file.
 */
export const importProjectBundle = async (file: File | Blob) => {
    const zip = await JSZip.loadAsync(file);
    const projectJsonFile = zip.file('project.json');
    if (!projectJsonFile) throw new Error('Invalid .gwall file: missing project.json');

    const projectText = await projectJsonFile.async('text');
    const project = JSON.parse(projectText);

    // Validate required project structure
    if (!project || typeof project !== 'object') {
        throw new Error('Invalid .gwall file: project.json is not an object');
    }
    if (!Array.isArray(project.frames)) {
        throw new Error('Invalid .gwall file: project.frames is missing or not an array');
    }
    if (!project.wallConfig || typeof project.wallConfig !== 'object') {
        throw new Error('Invalid .gwall file: wallConfig is missing or invalid');
    }

    const images: { id: string; blob: Blob }[] = [];

    // Extract images from the 'images/' folder
    const imageFolder = zip.folder('images');
    const imageFiles: { id: string; file: JSZip.JSZipObject }[] = [];

    if (imageFolder) {
        imageFolder.forEach((relativePath, file) => {
            if (!file.dir) {
                imageFiles.push({
                    id: relativePath, // relativePath is the filename within the folder
                    file
                });
            }
        });

        for (const item of imageFiles) {
            const blob = await item.file.async('blob');
            images.push({ id: item.id, blob });
        }
    }

    return { project, images };
};

export const generateShoppingListBlob = (project: Project): Blob | null => {
    if (!project || !project.frames.length) return null;

    const list = project.frames.map((f, i) => {
        const hasImage = !!f.imageId;
        let line = `Frame ${i + 1}: ${f.width}" x ${f.height}"`;
        if (f.matted) {
            line += ` (Matted to ${f.matted.width}" x ${f.matted.height}")`;
        }
        line += ` - Status: ${hasImage ? 'Filled' : 'Empty'}`;
        return line;
    }).join('\n');

    const header = `GALLERY WALL SHOPPING LIST\nProject: ${project.name}\nTotal Frames: ${project.frames.length}\n----------------------------\n\n`;
    return new Blob([header + list], { type: 'text/plain' });
};
