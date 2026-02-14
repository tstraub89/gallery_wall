
import { analyzeImageColors, createCompositionProfile } from './photoAnalysis';
import { detectFaces } from './faceDetection';
import { SmartFillWorkerMessage, SmartFillWorkerResponse, ColorProfile, CompositionProfile, FaceDetection } from './types';

// Simple context type for worker
const ctx: Worker = self as any;

console.log("[SmartFill Worker] Initialized");

ctx.onmessage = async (event: MessageEvent<SmartFillWorkerMessage>) => {
    const { id, type, payload } = event.data;
    console.log(`[SmartFill Worker] Received message: ${type}`, payload);

    try {
        switch (type) {
            case 'ANALYZE_PHOTO':
                await handleAnalyzePhoto(id, payload);
                break;

            case 'ANALYZE_BATCH':
                // TODO: Implement batch processing
                break;

            default:
                console.warn(`Unknown message type: ${type}`);
        }
    } catch (error: any) {
        ctx.postMessage({
            id,
            type: 'ERROR',
            payload: error.message
        } as SmartFillWorkerResponse);
    }
};

async function handleAnalyzePhoto(messageId: string, payload: {
    imageId: string;
    imageUrl: string; // Blob URL or Data URL
    width: number;
    height: number;
}) {
    const { imageId, imageUrl, width, height } = payload;

    // 1. Load image (using OffscreenCanvas or fetch+Bitmap)
    // For worker, fetch + createImageBitmap is best
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    URL.revokeObjectURL(imageUrl); // Clean up immediately after loading into bitmap

    const actualWidth = bitmap.width;
    const actualHeight = bitmap.height;

    // 2. Create OffscreenCanvas to extract pixel data
    // Scale down for analysis speed (max 300px)
    const MAX_SIZE = 300;
    const scale = Math.min(1, MAX_SIZE / Math.max(actualWidth, actualHeight));
    const scaledWidth = Math.max(1, Math.floor(actualWidth * scale));
    const scaledHeight = Math.max(1, Math.floor(actualHeight * scale));

    const canvas = new OffscreenCanvas(scaledWidth, scaledHeight);
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Could not get 2d context in worker');

    context.drawImage(bitmap, 0, 0, scaledWidth, scaledHeight);
    const imageData = context.getImageData(0, 0, scaledWidth, scaledHeight);

    // 3. Analyze Colors
    const colorProfile: ColorProfile = analyzeImageColors(imageData);

    // 4. Analyze Composition (basic edge check)
    const compositionProfile: CompositionProfile = createCompositionProfile(width, height);
    // We could pass imageData to calculateEdgeComplexity here if needed, 
    // but typically edge complexity needs full res or larger res than color analysis.
    // For V1, let's skip complex edge detection on the worker to keep it fast, 
    // or use the scaled version as a proxy.

    // 5. Detect Faces (opt-in via payload flag, or always run if cheap? V1: run if module loaded or requested)
    // For V1, let's assume we run it if the user requested "Prioritize People".
    // We need to pass that preference in payload.
    // Let's assume payload has `detectFaces: boolean`.

    let faceDetection: FaceDetection | undefined;
    if ((payload as any).detectFaces) {
        // We need ImageData for face detection. We already have it from context.getImageData
        faceDetection = await detectFaces(imageData);
    }

    // 6. Return Result
    ctx.postMessage({
        id: messageId,
        type: 'ANALYSIS_COMPLETE',
        payload: {
            id: imageId,
            timestamp: Date.now(),
            colorProfile,
            compositionProfile,
            faceDetection
        }
    } as SmartFillWorkerResponse);

    // Cleanup
    bitmap.close();
}
