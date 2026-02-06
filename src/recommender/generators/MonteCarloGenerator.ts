
import {
    RecommenderInput,
    LayoutSolution,
    PlacedFrame,
    RecommenderFrame
} from '../types';
import { isWithinBounds, hasCollision } from '../utils/geometry';
import { estimateMaxCapacity } from '../utils/heuristics';

export class MonteCarloGenerator {

    generate(input: RecommenderInput): LayoutSolution[] {
        const solutions: LayoutSolution[] = [];

        // Brute force settings
        const startTime = performance.now();
        const timeLimit = 5000; // 5 seconds
        const maxAttempts = 100000;
        let attempts = 0;

        // Target
        const desiredPerfectSolutions = 10;
        const totalFrames = input.inventory.reduce((sum, f) => sum + f.count, 0);

        const maxCap = estimateMaxCapacity(input);
        // Monte Carlo (Random) is inefficient at packing. We relax the target to 75% of max capacity
        // to ensure we find "good enough" solutions instantly rather than timing out trying to be perfect.
        const relaxedCap = Math.floor(maxCap * 0.75);
        const targetCount = input.config.forceAll ? totalFrames : Math.max(1, Math.min(totalFrames, relaxedCap));

        let perfectCount = 0;

        // Deduplication Helper
        const getSignature = (frames: PlacedFrame[]) => {
            const sorted = [...frames].sort((a, b) => {
                const dy = Math.round(a.y) - Math.round(b.y);
                if (Math.abs(dy) > 1) return dy;
                return Math.round(a.x) - Math.round(b.x);
            });
            return sorted.map(f =>
                `${Math.round(f.x)},${Math.round(f.y)},${Math.round(f.width)},${Math.round(f.height)}`
            ).join('|');
        };

        const signatures = new Set<string>();

        while (perfectCount < desiredPerfectSolutions && (performance.now() - startTime < timeLimit) && attempts < maxAttempts) {
            attempts++;
            const solution = this.createSingleSolution(input);

            if (solution) {
                const sig = getSignature(solution.frames);
                if (!signatures.has(sig)) {
                    signatures.add(sig);
                    solutions.push(solution);
                    if (solution.frames.length >= targetCount) {
                        perfectCount++;
                    }
                }
            }
        }

        return solutions.sort((a, b) => b.score - a.score); // Best first
    }

    private createSingleSolution(input: RecommenderInput): LayoutSolution | null {
        const { wall, inventory, obstacles, config } = input;
        const placed: PlacedFrame[] = [];
        const wallRect = { x: 0, y: 0, width: wall.width, height: wall.height };

        // Flatten inventory into individual items to place
        let framesToPlace: RecommenderFrame[] = [];
        inventory.forEach(item => {
            for (let i = 0; i < item.count; i++) {
                framesToPlace.push(item);
            }
        });

        // Randomize order
        framesToPlace = framesToPlace.sort(() => Math.random() - 0.5);

        for (const frame of framesToPlace) {
            // Try N times to place this frame
            for (let attempt = 0; attempt < 50; attempt++) {
                // Determine rotation (randomly 0 or 90)
                // For now, let's stick to 0 to keep it simple, or random?
                const rot = Math.random() > 0.8 ? 90 : 0; // Mostly upright
                const fWidth = rot === 0 ? frame.width : frame.height;
                const fHeight = rot === 0 ? frame.height : frame.width;

                // Random position within wall (considering margin)
                const margin = config.margin;
                const maxX = wall.width - fWidth - margin;
                const maxY = wall.height - fHeight - margin;
                const minX = margin;
                const minY = margin;

                if (maxX < minX || maxY < minY) continue; // Wont fit

                const x = minX + Math.random() * (maxX - minX);
                const y = minY + Math.random() * (maxY - minY);

                const candidate = {
                    id: crypto.randomUUID(),
                    libraryId: frame.id,
                    x,
                    y,
                    width: fWidth,
                    height: fHeight,
                    rotation: rot
                };

                // Check Bounds
                if (!isWithinBounds(candidate, wallRect)) continue;

                // Check Collision (with obstacles and already placed frames)
                if (hasCollision(candidate, [...obstacles, ...placed], config.spacing)) continue;

                // Success
                placed.push(candidate);
                break;
            }
        }

        // Calculate a score?
        // Score = Number of frames placed (higher is better)
        const score = placed.length;

        if (score === 0) return null;

        return {
            id: crypto.randomUUID(),
            frames: placed,
            score
        };
    }
}
