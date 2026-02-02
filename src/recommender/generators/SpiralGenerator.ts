import { RecommenderInput, LayoutSolution, PlacedFrame, RecommenderFrame } from '../types';
import { isWithinBounds, hasCollision } from '../utils/geometry';


// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export class SpiralGenerator {
    generate(input: RecommenderInput): LayoutSolution[] {
        const solutions: LayoutSolution[] = [];

        // Expand inventory based on counts
        const expandedInventory = input.inventory.flatMap(item => Array(item.count).fill(item));
        const totalFrames = expandedInventory.length;

        // 1. Standard (Area Descending)
        solutions.push(this.createSolution(input, [...expandedInventory].sort((a, b) => (b.width * b.height) - (a.width * a.height))));

        // 2. Randomized Attempts (for variety)
        // Replaced simple loop with Time-Bounded Brute Force

        // BRUTE FORCE SEARCH (Timed)
        const startTime = performance.now();
        const timeLimit = 5000; // 5 seconds
        const maxAttempts = 100000;
        let attempts = 0;

        // Check how many "good enough" solutions we already have
        const desiredSolutions = 4;
        const passingThreshold = input.config.forceAll ? totalFrames : Math.max(1, Math.floor(totalFrames * 0.9));

        let satisfactoryCount = solutions.filter(s => s.frames.length >= passingThreshold).length;

        while (satisfactoryCount < desiredSolutions && (performance.now() - startTime < timeLimit) && attempts < maxAttempts) {
            attempts++;
            const randomSol = this.createSolution(input, shuffle(expandedInventory));
            if (randomSol.frames.length > 0) {
                solutions.push(randomSol);
                if (randomSol.frames.length >= passingThreshold) {
                    satisfactoryCount++;
                }
            }
        }

        // Filter out empty or low-score solutions
        return solutions.filter(s => s.frames.length > 0).sort((a, b) => b.score - a.score);
    }

    private createSolution(input: RecommenderInput, framesToPlace: RecommenderFrame[]): LayoutSolution {
        const placed: PlacedFrame[] = [];
        const { wall, config } = input;
        const spacing = config.spacing || 2;
        const margin = config.margin || 5;

        // Bounds restricted by margin
        const validBounds = {
            x: margin,
            y: margin,
            width: wall.width - (margin * 2),
            height: wall.height - (margin * 2)
        };

        // Wall Center
        const centerX = wall.width / 2;
        const centerY = wall.height / 2;

        // Dynamic Max Attempts for Wide Walls:
        // Calculate distance to furthest corner to ensure we cover the whole wall.
        // Max radius needed = distance from (centerX, centerY) to (0,0) or (w,h)
        const maxRadius = Math.sqrt(Math.pow(Math.max(centerX, wall.width - centerX), 2) + Math.pow(Math.max(centerY, wall.height - centerY), 2));
        // Approximate attempts needed: radius grows by ~0.5 per step/loop combo. 
        // This is a rough heuristic, but 2000 was too low (approx 15"). 
        // Let's ensure we have enough.
        const dynamicMaxAttempts = Math.max(2000, maxRadius * 200);

        const radiusStep = 0.5;
        const angleStep = 0.1;

        for (const frame of framesToPlace) {
            let placedFrame: PlacedFrame | null = null;

            let radius = 0;
            let angle = 0;
            let attempt = 0;

            while (!placedFrame && attempt < dynamicMaxAttempts) {
                // First attempt: try exact center (radius 0)
                const x = centerX + radius * Math.cos(angle) - frame.width / 2;
                const y = centerY + radius * Math.sin(angle) - frame.height / 2;

                const candidate: PlacedFrame = {
                    id: crypto.randomUUID(),
                    libraryId: frame.id,
                    x,
                    y,
                    width: frame.width,
                    height: frame.height,
                    rotation: 0
                };

                // Check bounds (allow spiral to continue even if center is off-screen, but only place if fully visible)
                if (isWithinBounds(candidate, validBounds)) {
                    // Check collisions with ALREADY PLACED AND OBSTACLES
                    if (!hasCollision(candidate, [...input.obstacles, ...placed], spacing)) {
                        placedFrame = candidate;
                    }
                }

                // Move spiral
                if (radius === 0) {
                    // If center failed, start spiraling
                    radius += radiusStep;
                } else {
                    angle += angleStep;
                    radius += radiusStep * (angleStep / (2 * Math.PI)); // Very slow growth
                }

                attempt++;
            }

            if (placedFrame) {
                placed.push(placedFrame);
            } else if (config.forceAll) {
                // If forceAll is true and we fail to place a frame, return valid empty structure so it's filtered out
                return {
                    id: crypto.randomUUID(),
                    frames: [],
                    score: 0
                };
            }
        }

        if (placed.length === 0) return {
            id: crypto.randomUUID(),
            frames: [],
            score: 0
        };

        return {
            id: crypto.randomUUID(),
            frames: placed,
            score: placed.length
        };
    }
}
