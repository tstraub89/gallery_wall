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

// Helper to convert blob URL or external URL to base64
const blobToBase64 = (url: string): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
});

const waitForImages = (node: HTMLElement): Promise<void[]> => {
    const images = Array.from(node.querySelectorAll('img'));
    return Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
    }));
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

/**
 * Capture the Canvas Wall as a PNG Blob
 */
import { toBlob } from 'html-to-image';

export const exportCanvasToBlob = async (
    project: Project,
    canvasId: string = 'canvas-export-target'
): Promise<{ blob: Blob | null, error: string | null }> => {
    const node = document.getElementById(canvasId);
    if (!node) {
        return { blob: null, error: 'Could not find wall element to export.' };
    }

    const imgElements = Array.from(node.querySelectorAll('img'));
    const originalSources = new Map();
    let failedConversions = 0;

    try {
        // Pre-process images to Base64 to avoid taint issues
        for (const img of imgElements) {
            if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('http'))) {
                originalSources.set(img, img.src);
                try {
                    const b64 = await blobToBase64(img.src);
                    if (typeof b64 === 'string') {
                        img.src = b64;
                    }
                } catch {
                    failedConversions++;
                }
            }
        }

        await waitForImages(node);
        // Small delay to ensure rendering settles
        await new Promise(resolve => setTimeout(resolve, 300));

        const currentWidth = Math.ceil(project.wallConfig.width * PPI);
        const currentHeight = Math.ceil(project.wallConfig.height * PPI);

        // Target roughly 1080p for standard export, but scalable
        const targetWidth = 1920;
        const targetHeight = 1080;
        const scaleToHD = Math.max(targetWidth / currentWidth, targetHeight / currentHeight, 1.0);
        const scales = [scaleToHD, 1.0, 0.8, 0.5];

        let blob = null;
        let lastError = null;

        // Try descending scales if memory/canvas limits are hit
        for (const s of scales) {
            try {
                blob = await toBlob(node, {
                    width: currentWidth,
                    height: currentHeight,
                    pixelRatio: s,
                    backgroundColor: '#ffffff',
                    style: {
                        transform: 'none',
                        left: '0',
                        top: '0',
                        position: 'relative'
                    },
                    cacheBust: true,
                    skipFonts: true,
                });
                if (blob) break;
            } catch (err) {
                lastError = err;
            }
        }

        if (!blob) throw lastError || new Error('Failed to generate image blob');

        // Restore original sources
        for (const [img, src] of originalSources.entries()) img.src = src;

        return { blob, error: failedConversions > 0 ? `Exported with ${failedConversions} missing images` : null };

    } catch (err: any) {
        // Restore original sources in case of error
        for (const [img, src] of originalSources.entries()) img.src = src;
        console.error('Export failed', err);
        alert(`Export failed: ${err.message || String(err)}`);
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
