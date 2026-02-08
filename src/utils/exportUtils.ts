// import JSZip from 'jszip'; // Moved to dynamic import
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
    const JSZipMod = (await import('jszip')).default;
    const zip = new JSZipMod();
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
            const frameW_in = frame.width;
            const frameH_in = frame.height;

            // The "Visible" area is what we export (Mat opening if matted, else full frame)
            const visibleW_in = frame.matted ? frame.matted.width : frameW_in;
            const visibleH_in = frame.matted ? frame.matted.height : frameH_in;

            // Image State (x, y are in screen pixels based on screen PPI)
            const { scale = 1, x = 0, y = 0, rotation = 0 } = frame.imageState || {};

            const BLEED_IN = 0.125; // 1/8th inch bleed

            // --- Smart DPI Capping ---
            const imgAspect = sourceImage.width / sourceImage.height;
            const frameAspect = frameW_in / frameH_in;
            const nativePPI = imgAspect > frameAspect
                ? sourceImage.height / frameH_in
                : sourceImage.width / frameW_in;

            let bleedScale = 1;
            if (!frame.matted) {
                const bleedX = (visibleW_in + (BLEED_IN * 2)) / visibleW_in;
                const bleedY = (visibleH_in + (BLEED_IN * 2)) / visibleH_in;
                bleedScale = Math.max(bleedX, bleedY) * 1.005; // tiny safety buffer
            }

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

            // Move origin to center of canvas
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
            ctx.scale(scale * bleedScale, scale * bleedScale);

            // Pan
            const screenToPrintRatio = TARGET_PPI / PPI;
            const offsetX = x * screenToPrintRatio;
            const offsetY = y * screenToPrintRatio;
            ctx.translate(offsetX, offsetY);

            // Draw Center
            ctx.drawImage(sourceImage, -drawW / 2, -drawH / 2, drawW, drawH);

            // 3. Export to Blob
            const cropBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            if (!cropBlob) throw new Error("Failed to create blob");

            // 4. Add to ZIP
            const fileName = `Frame_${i + 1}_${visibleW_in}x${visibleH_in}${frame.matted ? '_matted' : ''}.jpg`;
            photoFolder.file(fileName, cropBlob);

            URL.revokeObjectURL(imgUrl);

        } catch (err: any) {
            console.error(`Error processing frame ${i + 1}: `, err);
            errors.push(`Frame ${i + 1}: ${err.message || String(err)}`);
        }
    }

    if (errors.length > 0) {
        console.warn("Some images failed to export:", errors);
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    await saveFile(content, `${project.name || 'Gallery'}_Photos_Export.zip`);

    return { success: true, errorCount: errors.length };
};

// Replaces html-to-image with a manual Canvas 2D implementation
export const exportCanvasToBlob = async (
    project: Project,
    options: { cropToFrames?: boolean, showWatermark?: boolean } = {}
): Promise<{ blob: Blob | null, error: string | null, cropRect?: { x: number, y: number, width: number, height: number } }> => {
    const { showWatermark = true } = options;
    try {
        const TARGET_SCALE = 4;
        let exportPPI = PPI * TARGET_SCALE;

        let widthInches = project.wallConfig.width;
        let heightInches = project.wallConfig.height;
        let offsetInchesX = 0;
        let offsetInchesY = 0;

        let cropRect = undefined;
        if (options.cropToFrames && project.frames.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            project.frames.forEach(f => {
                const bW = typeof f.borderWidth === 'number' ? f.borderWidth : 0.1;
                const fx = f.x / PPI;
                const fy = f.y / PPI;
                minX = Math.min(minX, fx - bW);
                minY = Math.min(minY, fy - bW);
                maxX = Math.max(maxX, fx + f.width + bW);
                maxY = Math.max(maxY, fy + f.height + bW);
            });

            const PADDING = 5; // inches
            const croppedX = Math.max(0, minX - PADDING);
            const croppedY = Math.max(0, minY - PADDING);
            const croppedW = Math.min(project.wallConfig.width - croppedX, (maxX - minX) + (PADDING * 2));
            const croppedH = Math.min(project.wallConfig.height - croppedY, (maxY - minY) + (PADDING * 2));

            widthInches = croppedW;
            heightInches = croppedH;
            offsetInchesX = croppedX;
            offsetInchesY = croppedY;
            cropRect = { x: croppedX, y: croppedY, width: croppedW, height: croppedH };
        }

        const MAX_PIXELS = 5 * 1000 * 1000;
        const targetWidth = widthInches * exportPPI;
        const targetHeight = heightInches * exportPPI;
        const targetPixels = targetWidth * targetHeight;

        if (targetPixels > MAX_PIXELS) {
            const scaleDown = Math.sqrt(MAX_PIXELS / targetPixels);
            exportPPI = exportPPI * scaleDown;
        }

        const widthPx = Math.ceil(widthInches * exportPPI);
        const heightPx = Math.ceil(heightInches * exportPPI);
        const EXPORT_SCALE = exportPPI / PPI;

        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        ctx.translate(-offsetInchesX * exportPPI, -offsetInchesY * exportPPI);

        // 1. Draw Wall Background
        const wallType = project.wallConfig.type;
        const fullWallWidthPx = project.wallConfig.width * exportPPI;
        const fullWallHeightPx = project.wallConfig.height * exportPPI;

        if (wallType === 'staircase-asc' || wallType === 'staircase-desc') {
            const stairAngle = project.wallConfig.stairAngle ?? 50;
            const clipPercent = Math.min(100, Math.max(10, stairAngle));
            const bottomPercent = 100 - clipPercent;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(fullWallWidthPx, 0);
            if (wallType === 'staircase-asc') {
                ctx.lineTo(fullWallWidthPx, fullWallHeightPx * (bottomPercent / 100));
                ctx.lineTo(0, fullWallHeightPx);
            } else {
                ctx.lineTo(fullWallWidthPx, fullWallHeightPx);
                ctx.lineTo(0, fullWallHeightPx * (bottomPercent / 100));
            }
            ctx.closePath();
            ctx.clip();
        }

        ctx.fillStyle = project.wallConfig.backgroundColor || '#e5e5e7';
        ctx.fillRect(0, 0, fullWallWidthPx, fullWallHeightPx);

        // 2. Draw Frames
        const sortedFrames = [...project.frames].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

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

            ctx.fillStyle = frame.frameColor || '#111';
            if (isRound) {
                drawCircle(ctx, borderX, borderY, borderW, borderH);
                ctx.fill();
            } else {
                ctx.fillRect(borderX, borderY, borderW, borderH);
            }

            ctx.save();
            ctx.beginPath();
            if (isRound) ctx.ellipse(frameX + contentW / 2, frameY + contentH / 2, contentW / 2, contentH / 2, 0, 0, 2 * Math.PI);
            else ctx.rect(frameX, frameY, contentW, contentH);
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            if (frame.imageId) {
                try {
                    const blob = await getImage(frame.imageId);
                    if (blob) {
                        const imgUrl = URL.createObjectURL(blob);
                        const img = await loadImage(imgUrl);
                        const { scale = 1, x = 0, y = 0, rotation = 0 } = frame.imageState || {};
                        const scaledPanX = x * EXPORT_SCALE;
                        const scaledPanY = y * EXPORT_SCALE;
                        const centerX = frameX + contentW / 2;
                        const centerY = frameY + contentH / 2;

                        ctx.save();
                        ctx.translate(centerX, centerY);
                        ctx.rotate((rotation * Math.PI) / 180);
                        ctx.scale(scale, scale);
                        ctx.translate(scaledPanX, scaledPanY);

                        const imgRatio = img.width / img.height;
                        const frameRatio = contentW / contentH;
                        let drawW, drawH;
                        if (imgRatio > frameRatio) {
                            drawH = contentH;
                            drawW = contentH * imgRatio;
                        } else {
                            drawW = contentW;
                            drawH = contentW / imgRatio;
                        }
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                        ctx.restore();
                        URL.revokeObjectURL(imgUrl);
                    }
                } catch (err) {
                    console.warn(`Failed to render image for frame ${frame.id}`, err);
                }
            } else {
                const label = frame.label || `${frame.width}" x ${frame.height}"`;
                const fontSize = Math.max(10 * EXPORT_SCALE, contentW * 0.10);
                ctx.save();
                ctx.fillStyle = frame.label ? '#555555' : '#999999';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${frame.label ? '600' : '400'} ${fontSize}px system-ui, -apple-system, sans-serif`;
                const centerX = frameX + contentW / 2;
                const centerY = frameY + contentH / 2;
                ctx.fillText(label, centerX, centerY);
                ctx.restore();
            }

            if (frame.matted) {
                const mattedW = frame.matted.width * exportPPI;
                const mattedH = frame.matted.height * exportPPI;
                const matBorderW = (contentW - mattedW) / 2;
                const matBorderH = (contentH - mattedH) / 2;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(frameX, frameY, contentW, matBorderH);
                ctx.fillRect(frameX, frameY + contentH - matBorderH, contentW, matBorderH);
                ctx.fillRect(frameX, frameY + matBorderH, matBorderW, mattedH);
                ctx.fillRect(frameX + contentW - matBorderW, frameY + matBorderH, matBorderW, mattedH);
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                ctx.lineWidth = 1 * EXPORT_SCALE;
                ctx.strokeRect(frameX + matBorderW, frameY + matBorderH, mattedW, mattedH);
            }
            ctx.restore();
        }

        if (showWatermark) {
            const wmScale = EXPORT_SCALE * 0.75;
            const wmPadding = 20 * wmScale;
            const radius = 12 * wmScale;
            const badgeW = 180 * wmScale;
            const badgeH = 50 * wmScale;

            const badgeX = (offsetInchesX * exportPPI) + widthPx - badgeW - wmPadding;
            const badgeY = (offsetInchesY * exportPPI) + heightPx - badgeH - wmPadding;

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 10 * wmScale;
            ctx.shadowOffsetY = 2 * wmScale;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, radius);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            const iconSize = 32 * wmScale;
            const iconX = badgeX + (12 * wmScale);
            const iconY = badgeY + (9 * wmScale);
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2.5 * wmScale;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const s = iconSize / 24;
            ctx.beginPath();
            drawRoundedRect(ctx, iconX + 3 * s, iconY + 3 * s, 18 * s, 18 * s, 2 * s);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(iconX + 8.5 * s, iconY + 8.5 * s, 1.5 * s, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(iconX + 21 * s, iconY + 15 * s);
            ctx.lineTo(iconX + 16 * s, iconY + 10 * s);
            ctx.lineTo(iconX + 5 * s, iconY + 21 * s);
            ctx.stroke();

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
        }

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (!blob) throw new Error('Canvas toBlob failed');
        return { blob, error: null, cropRect };

    } catch (err: any) {
        console.error('Manual Canvas Export failed', err);
        return { blob: null, error: err.message || String(err) };
    }
};

import { getBatchPhotoAnalysis } from '../smartfill/analysisCache';

/**
 * Generates a .gwall file (ZIP) containing the project metadata and all images used in frames.
 */
export const exportProjectBundle = async (project: Project) => {
    const JSZipMod = (await import('jszip')).default;
    const zip = new JSZipMod();

    const usedImageIds = [...new Set(project.frames.filter(f => f.imageId).map(f => f.imageId))];
    const projectImageIds = project.images || [];

    // We bundle ALL images in the project library, not just placed ones
    const allImageIds = [...new Set([...usedImageIds, ...projectImageIds].filter(Boolean) as string[])];

    const projectData = JSON.stringify(project, null, 2);
    zip.file('project.json', projectData);

    // Fetch and bundle analysis data
    try {
        const analysisData = await getBatchPhotoAnalysis(allImageIds);
        if (Object.keys(analysisData).length > 0) {
            zip.file('analysis.json', JSON.stringify(analysisData, null, 2));
        }
    } catch (e) {
        console.warn("Failed to bundle analysis data", e);
    }

    const imageFolder = zip.folder('images');
    if (!imageFolder) throw new Error("Failed to create images folder");
    const errors: string[] = [];

    for (const imageId of allImageIds) {
        try {
            if (!imageId) continue;
            const blob = await getImage(imageId);
            if (!blob) throw new Error(`Missing in database`);

            // Append extension based on type
            const extension = blob.type === 'image/webp' ? '.webp' : '.jpg';
            imageFolder.file(`${imageId}${extension}`, blob);
        } catch (err: any) {
            console.warn(`Could not bundle image ${imageId}: `, err);
            errors.push(`${imageId}: ${err.message || String(err)}`);
        }
    }

    const content = await zip.generateAsync({ type: "blob" });
    await saveFile(content, `${project.name || 'project'}.gwall`);

    return { success: true, errorCount: errors.length, warnings: errors };
};

/**
 * Processes a .gwall file and returns the project metadata and image blobs.
 */
export const importProjectBundle = async (file: File | Blob) => {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const projectJsonFile = zip.file('project.json');
    if (!projectJsonFile) throw new Error('Invalid .gwall file: missing project.json');

    const projectText = await projectJsonFile.async('text');
    const project = JSON.parse(projectText);

    // Read analysis data if it exists
    let analysis: Record<string, any> = {};
    const analysisFile = zip.file('analysis.json');
    if (analysisFile) {
        try {
            const analysisText = await analysisFile.async('text');
            analysis = JSON.parse(analysisText);
        } catch (e) {
            console.warn("Failed to parse analysis.json", e);
        }
    }

    if (!project || typeof project !== 'object' || !Array.isArray(project.frames) || !project.wallConfig) {
        throw new Error('Invalid .gwall file structure');
    }

    const images: { id: string; blob: Blob }[] = [];
    const imageFolder = zip.folder('images');
    const imageFiles: { id: string; file: any }[] = [];

    if (imageFolder) {
        imageFolder.forEach((relativePath, file) => {
            if (!file.dir) {
                // Strip extension to get original ID
                const id = relativePath.split('.')[0];
                imageFiles.push({ id, file });
            }
        });

        for (const item of imageFiles) {
            const fileName = item.file.name.toLowerCase();
            const type = fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            const blob = await item.file.async('blob');
            // Re-create blob with correct type
            const typedBlob = new Blob([blob], { type });
            images.push({ id: item.id, blob: typedBlob });
        }
    }

    return { project, images, analysis };
};
