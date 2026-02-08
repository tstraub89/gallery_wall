import { Project } from '../types';
import { ImageMetadata } from '../utils/imageStore';
import { PhotoAnalysis } from './types';
import { scorePhotoForFrame, ScoringOptions } from './matchScoring';

export interface OptimizationSolution {
    id: string; // solution ID
    assignments: Record<string, string>; // frameId -> photoId
    totalScore: number;
    usedPhotoIds: Set<string>;
}

// Simple greedy optimization with randomization for variety
// We want 10 distinct solutions.
// Strategy:
// 1. For each solution, randomize the order of frames to fill.
// 2. For each frame, pick the best available photo (not yet used in this solution).
// 3. To add more variety, maybe "shake" the scores slightly or introduce a "random pick from top N" logic.

export function generateSolutions(
    project: Project,
    metadatas: Record<string, ImageMetadata>,
    analyses: Record<string, PhotoAnalysis>,
    count: number = 10,
    options: ScoringOptions = {}
): OptimizationSolution[] {
    const solutions: OptimizationSolution[] = [];
    const frames = project.frames.filter(f => !f.locked); // Only fill unlocked frames
    const photoIds = project.images; // Available photos

    if (frames.length === 0 || photoIds.length === 0) return [];

    // Pre-calculate all pairwise scores to avoid re-computation
    // Map<frameId, { photoId, score }[]>
    const scoresMap = new Map<string, { photoId: string, score: number }[]>();

    frames.forEach(frame => {
        const frameScores: { photoId: string, score: number }[] = [];
        photoIds.forEach(photoId => {
            const meta = metadatas[photoId];
            const anal = analyses[photoId];
            if (meta && anal) {
                const matchScore = scorePhotoForFrame(photoId, meta, anal, frame, options);
                frameScores.push({ photoId, score: matchScore.totalScore });
            }
        });
        // Sort by score desc
        frameScores.sort((a, b) => b.score - a.score);
        scoresMap.set(frame.id, frameScores);
    });

    for (let i = 0; i < count; i++) {
        const solution: OptimizationSolution = {
            id: `sol-${Date.now()}-${i}`,
            assignments: {},
            totalScore: 0,
            usedPhotoIds: new Set()
        };

        // Randomize frame order to create variety in greedy assignment
        const processingOrder = [...frames].sort(() => Math.random() - 0.5);

        processingOrder.forEach(frame => {
            const candidates = scoresMap.get(frame.id) || [];

            // Filter out already used photos
            const available = candidates.filter(c => !solution.usedPhotoIds.has(c.photoId));

            if (available.length > 0) {
                // To add more variety, pick randomly from top 3 best matches
                // For the first solution (i=0), always pick the absolute best (deterministic "best")
                // For others, add randomness.
                let pickIndex = 0;
                if (i > 0) {
                    // Pick from top 3 or fewer
                    const poolSize = Math.min(available.length, 3);
                    pickIndex = Math.floor(Math.random() * poolSize);
                }

                const chosen = available[pickIndex];
                solution.assignments[frame.id] = chosen.photoId;
                solution.usedPhotoIds.add(chosen.photoId);
                solution.totalScore += chosen.score;
            } else {
                // No unique photo left? 
                // If we MUST fill, we could reuse, but user requested "Once a photo is used, it's not to be used again"
                // So we leave it empty? Or do we fallback to duplicates if strictly needed?
                // Plan said: "leave frames empty if no match/insufficient photos".
            }
        });

        // Only add if we filled at least something?
        if (Object.keys(solution.assignments).length > 0) {
            solutions.push(solution);
        }
    }

    return solutions;
}
