
import {
    RecommenderInput,
    LayoutSolution,
    PlacedFrame,
    RecommenderFrame
} from '../types';
import { isWithinBounds, hasCollision } from '../utils/geometry';

export class MonteCarloGenerator {

    generate(input: RecommenderInput): LayoutSolution[] {
        const solutions: LayoutSolution[] = [];

        // Brute force settings
        const startTime = performance.now();
        const timeLimit = 5000; // 5 seconds
        const maxAttempts = 100000;
        let attempts = 0;

        // Target
        const desiredPerfectSolutions = 4;
        const totalFrames = input.inventory.reduce((sum, f) => sum + f.count, 0);
        let perfectCount = 0;

        while (perfectCount < desiredPerfectSolutions && (performance.now() - startTime < timeLimit) && attempts < maxAttempts) {
            attempts++;
            const solution = this.createSingleSolution(input);

            if (solution) {
                solutions.push(solution);
                if (solution.frames.length === totalFrames) {
                    perfectCount++;
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
            let placedFrame = false;
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
                placedFrame = true;
                break;
            }

            // If forceAll is true and we failed to place, this solution is invalid
            if (config.forceAll && !placedFrame) {
                return null;
            }
        }

        // Calculate a basic score
        const score = this.calculateScore(placed, wallRect);

        return {
            id: crypto.randomUUID(),
            frames: placed,
            score,
            metadata: {
                coverage: 0, // TODO
                alignment: 0,
                balance: 0
            }
        };
    }

    private calculateScore(placed: PlacedFrame[], wall: any): number {
        // Simple score: Number of frames placed + some centrality bonus
        if (placed.length === 0) return 0;

        let score = placed.length * 100;

        // Centrality: Negative penalty for distance from center
        const cx = wall.width / 2;
        const cy = wall.height / 2;

        let totalDist = 0;
        placed.forEach(f => {
            const fx = f.x + f.width / 2;
            const fy = f.y + f.height / 2;
            const dist = Math.sqrt(Math.pow(fx - cx, 2) + Math.pow(fy - cy, 2));
            totalDist += dist;
        });

        const avgDist = totalDist / placed.length;
        score -= avgDist; // Penalty

        return score;
    }
}
