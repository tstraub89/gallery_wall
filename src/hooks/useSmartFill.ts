
import { useState, useCallback, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { getPhotoAnalysis, savePhotoAnalysis } from '../smartfill/analysisCache';
import { SmartFillWorkerMessage, SmartFillWorkerResponse, FrameSuggestion, PhotoAnalysis } from '../smartfill/types';
import { scorePhotoForFrame, ScoringOptions } from '../smartfill/matchScoring';
import { getImageMetadata, getImage } from '../utils/imageStore';
import { Frame } from '../types';

export function useSmartFill() {
    const { currentProject } = useProject();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const workerRef = useRef<Worker | null>(null);

    // Initialize Worker
    useEffect(() => {
        workerRef.current = new Worker(new URL('../smartfill/smartfill.worker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = async (event: MessageEvent<SmartFillWorkerResponse>) => {
            const { type, payload } = event.data;
            if (type === 'ANALYSIS_COMPLETE') {
                await savePhotoAnalysis(payload.id, payload);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const analyzeLibrary = useCallback(async (imageIds: string[], options: { detectFaces?: boolean } = {}) => {
        if (!workerRef.current) return;

        // Check which items actually need analysis
        const pendingIds: string[] = [];
        for (const id of imageIds) {
            const cached = await getPhotoAnalysis(id);
            if (!cached || (options.detectFaces && !cached.faceDetection)) {
                pendingIds.push(id);
            }
        }

        if (pendingIds.length === 0) {
            setIsAnalyzing(false);
            return;
        }

        setIsAnalyzing(true);
        setProgress(0);

        let completed = 0;
        const total = pendingIds.length;

        for (const id of pendingIds) {
            try {
                const blob = await getImage(id, 'preview');
                if (blob) {
                    const objectUrl = URL.createObjectURL(blob);
                    const bitmap = await createImageBitmap(blob);

                    workerRef.current.postMessage({
                        id: id,
                        type: 'ANALYZE_PHOTO',
                        payload: {
                            imageId: id,
                            imageUrl: objectUrl,
                            width: bitmap.width,
                            height: bitmap.height,
                            detectFaces: options.detectFaces
                        }
                    } as SmartFillWorkerMessage);
                }

                completed++;
                setProgress((completed / total) * 100);
            } catch (e) {
                console.error("Error analyzing photo", id, e);
                completed++;
            }
        }

        setTimeout(() => setIsAnalyzing(false), 500);
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
