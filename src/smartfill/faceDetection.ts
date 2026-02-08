
import { FaceDetection } from './types';

// Lazy-load dependencies
let blazeface: any = null;
let tf: any = null;
let model: any = null;

export async function loadFaceDetectionModel(): Promise<void> {
    if (model) return;

    try {
        // Dynamic imports to avoid initial bundle bloat
        tf = await import('@tensorflow/tfjs');
        blazeface = await import('@tensorflow-models/blazeface');

        // Initialize backend (try WebGL, fall back to CPU)
        await tf.setBackend('webgl');
        await tf.ready();

        model = await blazeface.load();
        console.log('Face detection model loaded');
    } catch (e) {
        console.error('Failed to load face detection model', e);
        // Fallback or disable feature
    }
}

export async function detectFaces(
    imageData: ImageData | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<FaceDetection> {
    if (!model) {
        await loadFaceDetectionModel(); // Auto-load if not ready
        if (!model) {
            // If still failed, return empty
            return { hasFaces: false, faceCount: 0, boundingBoxes: [], isPortrait: false, isGroup: false };
        }
    }

    try {
        const predictions = await model.estimateFaces(imageData, false);

        const hasFaces = predictions.length > 0;
        const faceCount = predictions.length;
        const boundingBoxes = predictions.map((p: any) => ({
            x: p.topLeft[0],
            y: p.topLeft[1],
            width: p.bottomRight[0] - p.topLeft[0],
            height: p.bottomRight[1] - p.topLeft[1]
        }));

        // Simple heuristics
        // Portrait = 1 face, fairly large?
        const isPortrait = faceCount === 1;
        const isGroup = faceCount > 2;

        return {
            hasFaces,
            faceCount,
            boundingBoxes,
            isPortrait,
            isGroup
        };
    } catch (e) {
        console.error('Face detection error', e);
        return { hasFaces: false, faceCount: 0, boundingBoxes: [], isPortrait: false, isGroup: false };
    }
}
