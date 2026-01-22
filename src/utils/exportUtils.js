import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PPI } from '../constants';
import { getImage } from './imageStore';

// Helper to load an image from a Blob URL
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Generates a ZIP file containing high-resolution cropped photos from the project frames.
 * @param {Object} project - The current project object containing frames.
 */
export const generateProjectZip = async (project) => {
    const zip = new JSZip();
    const photoFolder = zip.folder(`${project.name || 'Gallery_Export'}_Photos`);

    // Filter frames that have images
    const framesWithImages = project.frames.filter(f => f.imageId);

    if (framesWithImages.length === 0) {
        throw new Error("No photos found in the project frames.");
    }

    const errors = [];

    for (let i = 0; i < framesWithImages.length; i++) {
        const frame = framesWithImages[i];
        try {
            // 1. Fetch the original high-res image blob
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

            const TARGET_PPI = 300;
            const BLEED_IN = 0.125; // 1/8th inch bleed

            // Output Canvas Size (Visible Area + Bleed)
            const outputW_px = Math.ceil((visibleW_in + (BLEED_IN * 2)) * TARGET_PPI);
            const outputH_px = Math.ceil((visibleH_in + (BLEED_IN * 2)) * TARGET_PPI);

            const canvas = document.createElement('canvas');
            canvas.width = outputW_px;
            canvas.height = outputH_px;
            const ctx = canvas.getContext('2d');

            // Fill with white
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputW_px, outputH_px);

            // Move origin to center of canvas (which aligns with center of Visible Area)
            ctx.translate(outputW_px / 2, outputH_px / 2);

            // --- Image Drawing Math ---

            // 1. Calculate Base Size: "object-fit: cover" against the FRAME.
            // (The UI fits image to Frame, Mat hides edges).
            // Logic: standard object-fit: cover on frameW/frameH
            const imgAspect = sourceImage.width / sourceImage.height;
            const frameAspect = frameW_in / frameH_in;

            let drawW, drawH;
            if (imgAspect > frameAspect) {
                // Image wider -> Height determines scale
                drawH = frameH_in * TARGET_PPI;
                drawW = drawH * imgAspect;
            } else {
                // Image taller -> Width determines scale
                drawW = frameW_in * TARGET_PPI;
                drawH = drawW / imgAspect;
            }

            // 2. Bleed Correction for Unmatted Frames
            // If !matted, Frame == Visible. 
            // The calculated drawW/drawH covers Frame, but Canvas is Frame + Bleed.
            // We need to scale up slightly to cover the bleed (Zoom-to-Bleed).
            // If matted, Frame usually >> Mat + Bleed, so no correction needed.
            let bleedScale = 1;
            if (!frame.matted) {
                // Calculate ratio needed to cover the bleed area
                const bleedX = (visibleW_in + (BLEED_IN * 2)) / visibleW_in;
                const bleedY = (visibleH_in + (BLEED_IN * 2)) / visibleH_in;
                bleedScale = Math.max(bleedX, bleedY);
                // Apply a tiny safety buffer (e.g. 1.02 -> 1.025) to avoid rounding gaps
                bleedScale *= 1.005;
            }

            // 3. Apply Transforms
            // Rotation
            ctx.rotate((rotation * Math.PI) / 180);

            // Scale (User Scale * Bleed Correction)
            // Note: User scale applies to the "base" fit.
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
            const cropBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));

            // 4. Add to ZIP
            const fileName = `Frame_${i + 1}_${visibleW_in}x${visibleH_in}${frame.matted ? '_matted' : ''}.jpg`;
            photoFolder.file(fileName, cropBlob);

            URL.revokeObjectURL(imgUrl);

        } catch (err) {
            console.error(`Error processing frame ${i + 1}:`, err);
            errors.push(`Frame ${i + 1}: ${err.message}`);
        }
    }

    if (errors.length > 0) {
        console.warn("Some images failed to export:", errors);
        // We still proceed to download what we have, but maybe alert?
    }

    // Generate ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${project.name || 'Gallery'}_Photos_Export.zip`);

    return { success: true, errorCount: errors.length };
};
