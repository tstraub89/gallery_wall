
import { Frame } from '../types';
import { ImageMetadata } from '../utils/imageStore';
import { PhotoAnalysis, MatchScore } from './types';

// Scoring Weights (unused in code but good for reference/tweaking)
// const WEIGHTS = { ... };

export interface ScoringOptions {
    targetFaces?: boolean;
    preferBlackAndWhite?: boolean;
    preferVibrant?: boolean;
}

export function scorePhotoForFrame(
    photoId: string,
    metadata: ImageMetadata,
    analysis: PhotoAnalysis,
    frame: Frame,
    options: ScoringOptions = {}
): MatchScore {
    const breakdown = {
        aspectRatio: 0,
        resolution: 0,
        composition: 0,
        colorHarmony: 0,
        faceHandling: 0
    };

    // 1. Aspect Ratio (0-25)
    const frameRatio = frame.width / frame.height;
    const photoRatio = metadata.aspectRatio;
    const ratioDiff = Math.abs(frameRatio - photoRatio);

    if (ratioDiff < 0.05) breakdown.aspectRatio = 25;
    else if (ratioDiff < 0.15) breakdown.aspectRatio = 20;
    else if (ratioDiff < 0.3) breakdown.aspectRatio = 15;
    else if (ratioDiff < 0.5) breakdown.aspectRatio = 5;

    // 2. Resolution / DPI (0-25)
    const megapixels = (metadata.width * metadata.height) / 1000000;
    if (megapixels > 12) breakdown.resolution = 25;
    else if (megapixels > 8) breakdown.resolution = 20;
    else if (megapixels > 4) breakdown.resolution = 15;
    else if (megapixels > 2) breakdown.resolution = 5;

    // 3. Composition (0-20)
    const frameOrientation = frameRatio >= 1 ? 'landscape' : 'portrait';
    const photoOrientation = photoRatio >= 1 ? 'landscape' : 'portrait';

    if (frameOrientation === photoOrientation) {
        breakdown.composition = 20;
    } else {
        if (Math.abs(frameRatio - 1) < 0.1) breakdown.composition = 15;
        else breakdown.composition = 5;
    }

    // 4. Color Harmony (0-15)
    if (analysis.colorProfile) {
        const { isGreyscale, brightness, saturation } = analysis.colorProfile;

        if (options.preferBlackAndWhite) {
            if (isGreyscale) breakdown.colorHarmony += 15;
            else if (saturation < 20) breakdown.colorHarmony += 5;
        } else if (options.preferVibrant) {
            if (!isGreyscale && saturation > 40) breakdown.colorHarmony += 15;
            else if (!isGreyscale && saturation > 20) breakdown.colorHarmony += 5;
        } else {
            // Default logic: Slight preference for non-greyscale but not heavy penalty
            if (!isGreyscale) breakdown.colorHarmony += 10;
            if (brightness > 20) breakdown.colorHarmony += 5;
        }
    }

    // 5. Face Handling (0-15)
    if (options.targetFaces) {
        if (analysis.faceDetection && analysis.faceDetection.hasFaces) {
            breakdown.faceHandling += 10; // Baseline points for having a face
            const faces = analysis.faceDetection;
            if (frameOrientation === 'portrait' && faces.isPortrait) breakdown.faceHandling += 5;
            else if (frameOrientation === 'landscape' && faces.isGroup) breakdown.faceHandling += 5;
        } else if (!analysis.faceDetection) {
            breakdown.faceHandling = 0;
        }
    } else {
        // Target faces off - give neutral score (5) so it doesn't penalize 
        breakdown.faceHandling = 5;
    }

    const totalScore = Math.min(100,
        breakdown.aspectRatio +
        breakdown.resolution +
        breakdown.composition +
        breakdown.colorHarmony +
        breakdown.faceHandling
    );

    return {
        photoId,
        frameId: frame.id,
        totalScore,
        breakdown,
        warnings: []
    };
}
