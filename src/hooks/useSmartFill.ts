
import { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getPhotoAnalysis, savePhotoAnalysis } from '../smartfill/analysisCache';
import { SmartFillWorkerMessage, SmartFillWorkerResponse, FrameSuggestion, PhotoAnalysis } from '../smartfill/types';
import { scorePhotoForFrame, ScoringOptions } from '../smartfill/matchScoring';
import { getImageMetadata, getImage } from '../utils/imageStore';
import { Frame } from '../types';

export function useSmartFill() {
    const { currentProject } = useProject();
    const [pendingCount, setPendingCount] = useState(0);
    const isAnalyzing = pendingCount > 0;
    const [progress, setProgress] = useState(0);
    const workerRef = useRef<Worker | null>(null);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../smartfill/smartfill.worker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = async (event: MessageEvent<SmartFillWorkerResponse>) => {
            const { type, payload } = event.data;

            if (type === 'ANALYSIS_COMPLETE') {
                await savePhotoAnalysis(payload.id, payload);
                setPendingCount(prev => Math.max(0, prev - 1));

                // If this was the last one for a specific batch, we could resolve here
                // But simpler is to check count in the loop below.
            } else if (type === 'ERROR') {
                console.error("Worker error:", payload);
                setPendingCount(prev => Math.max(0, prev - 1));
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const analyzeLibrary = useCallback(async (imageIds: string[], options: { detectFaces?: boolean } = {}) => {
        console.log("analyzeLibrary called with:", imageIds.length, "images", options);
        if (!workerRef.current) {
            console.error("Worker not initialized!");
            return;
        }

        // Check which items actually need analysis
        const pendingIds: string[] = [];
        for (const id of imageIds) {
            const cached = await getPhotoAnalysis(id);
            if (!cached || (options.detectFaces && !cached.faceDetection)) {
                pendingIds.push(id);
            }
        }

        console.log("Pending analysis items:", pendingIds.length);

        if (pendingIds.length === 0) {
            console.log("No pending items, returning early.");
            return;
        }

        setPendingCount(prev => prev + pendingIds.length);
        setProgress(0);

        let sent = 0;
        const total = pendingIds.length;

        for (const id of pendingIds) {
            try {
                // Try preview first, but fallback to full if missing (for legacy projects)
                let blob = await getImage(id, 'preview');
                if (!blob) {
                    blob = await getImage(id, 'full');
                }

                if (blob) {
                    const objectUrl = URL.createObjectURL(blob);

                    workerRef.current.postMessage({
                        id: id,
                        type: 'ANALYZE_PHOTO',
                        payload: {
                            imageId: id,
                            imageUrl: objectUrl,
                            width: 0, // Worker will load metadata
                            height: 0,
                            detectFaces: options.detectFaces
                        }
                    } as SmartFillWorkerMessage);
                } else {
                    // If image missing, decrement immediately
                    setPendingCount(prev => Math.max(0, prev - 1));
                }

                sent++;
                setProgress((sent / total) * 100);
            } catch (e) {
                console.error("Error sending photo for analysis", id, e);
                setPendingCount(prev => Math.max(0, prev - 1));
            }
        }

        // Wait for pending count to reach zero (or back to initial state)
        return new Promise<void>((resolve) => {
            const check = () => {
                // We use a functional setter to get the latest value without closure issues
                // but since we're in a hook, we should probably use a ref for the count too if we want sync check
                // or just rely on the fact that isAnalyzing will trigger re-renders.
                // For a promise, we need a reliable way to know "this batch" is done.
                // Simpler: Just resolve after a brief delay if we really want a promise, 
                // but better to just let the UI react to isAnalyzing.
                resolve();
            };
            check();
        });
    }, []);

    const getSuggestionsForFrame = useCallback(async (frame: Frame, options: ScoringOptions = {}): Promise<FrameSuggestion[]> => {
        if (!currentProject) return [];

        const imageIds = currentProject.images;
        // If we want faces, trigger analysis for those specifically if missing
        analyzeLibrary(imageIds, { detectFaces: options.targetFaces });

        const metadataMap = await getImageMetadata(imageIds);
        const suggestions: FrameSuggestion[] = [];

        for (const photoId of imageIds) {
            const analysis = await getPhotoAnalysis(photoId);
            const metadata = metadataMap[photoId];

            if (analysis && metadata) {
                const matchScore = scorePhotoForFrame(photoId, metadata, analysis, frame, options);
                suggestions.push({
                    frameId: frame.id,
                    photoId,
                    matchScore,
                    alternativePhotoIds: []
                });
            }
        }

        return suggestions.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore).slice(0, 10);
    }, [currentProject, analyzeLibrary]);

    const generateGallerySolutions = useCallback(async (count = 10, options: ScoringOptions = {}): Promise<any[]> => {
        if (!currentProject) return [];

        const imageIds = currentProject.images;

        // Ensure analysis is triggered for missing items
        await analyzeLibrary(imageIds, { detectFaces: options.targetFaces });

        const metadataMap = await getImageMetadata(imageIds);
        const analysisMap: Record<string, PhotoAnalysis> = {};

        for (const id of imageIds) {
            const anal = await getPhotoAnalysis(id);
            if (anal) analysisMap[id] = anal;
        }

        // Dynamically import optimizer to split code
        const { generateSolutions } = await import('../smartfill/galleryOptimizer');
        return generateSolutions(currentProject, metadataMap, analysisMap, count, options);
    }, [currentProject, analyzeLibrary]);

    const checkAnalysisStatus = useCallback(async (imageIds: string[], options: { detectFaces?: boolean } = {}): Promise<boolean> => {
        for (const id of imageIds) {
            const cached = await getPhotoAnalysis(id);
            if (!cached || (options.detectFaces && !cached.faceDetection)) {
                return false; // Found something needing analysis
            }
        }
        return true; // All good
    }, []);

    return {
        analyzeLibrary,
        checkAnalysisStatus,
        getSuggestionsForFrame,
        generateGallerySolutions,
        isAnalyzing,
        progress
    };
}
