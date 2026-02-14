export interface ColorProfile {
    dominantColors: string[]; // Hex codes
    saturation: number; // 0-100
    brightness: number; // 0-100
    isGreyscale: boolean;
    harmony: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted';
}

export interface FaceDetection {
    hasFaces: boolean;
    faceCount: number;
    boundingBoxes: { x: number; y: number; width: number; height: number }[];
    isPortrait: boolean; // Single person prominent
    isGroup: boolean; // Multiple people
}

export interface CompositionProfile {
    // Basic metadata reused from ImageMetadata (width, height, aspectRatio)
    orientation: 'landscape' | 'portrait' | 'square';
    edgeComplexity: number; // 0-100 score of detail near edges (for cropping safety)
}

export interface PhotoAnalysis {
    id: string; // matches imageId
    timestamp: number;
    colorProfile: ColorProfile;
    compositionProfile: CompositionProfile;
    faceDetection?: FaceDetection; // Optional, only if enabled
}

export interface MatchScore {
    photoId: string;
    frameId: string;
    totalScore: number; // 0-100
    breakdown: {
        aspectRatio: number; // 0-25
        resolution: number; // 0-25
        composition: number; // 0-20
        colorHarmony: number; // 0-15
        faceHandling: number; // 0-15
    };
    warnings: string[];
}

export interface FrameSuggestion {
    frameId: string;
    photoId: string;
    matchScore: MatchScore;
    alternativePhotoIds: string[];
}


export interface OptimizationSolution {
    id: string; // solution ID
    assignments: Record<string, string>; // frameId -> photoId
    totalScore: number;
}

// Worker Types
export type WorkerMessageType =
    | 'ANALYZE_PHOTO'
    | 'ANALYZE_BATCH'
    | 'CALCULATE_SCORES'
    | 'OPTIMIZE_GALLERY';

export interface SmartFillWorkerMessage {
    id: string;
    type: WorkerMessageType;
    payload: {
        imageId: string;
        imageBlob?: Blob;
        imageUrl?: string;
        width: number;
        height: number;
        detectFaces?: boolean;
    };
}

export interface SmartFillWorkerResponse {
    id: string;
    type: 'ANALYSIS_COMPLETE' | 'BATCH_PROGRESS' | 'SCORES_COMPLETE' | 'OPTIMIZATION_COMPLETE' | 'ERROR';
    payload: any;
}
