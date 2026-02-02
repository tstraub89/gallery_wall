import { RecommenderInput, LayoutSolution, PlacedFrame, RecommenderFrame } from '../types';
import { hasCollision, isWithinBounds } from '../utils/geometry';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export class SkylineGenerator {
    generate(input: RecommenderInput): LayoutSolution[] {
        const solutions: LayoutSolution[] = [];
        const { inventory } = input;

        // Expand inventory based on counts
        const expandedInventory = inventory.flatMap(item => Array(item.count).fill(item));
        const totalFrames = expandedInventory.length;

        // 1. Standard (Height Descending)
        solutions.push(this.createSolution(input, [...expandedInventory].sort((a, b) => b.height - a.height)));

        // 2. Randomized Attempts (for variety) - allows "smart" logic to pick different initial shelves
        for (let i = 0; i < 3; i++) {
            solutions.push(this.createSolution(input, shuffle(inventory)));
        }

        // 3. Area Sort Attempt
        solutions.push(this.createSolution(input, [...inventory].sort((a, b) => (b.width * b.height) - (a.width * a.height))));


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

        return solutions.filter(s => s.frames.length > 0).sort((a, b) => b.score - a.score);
    }

    private createSolution(input: RecommenderInput, sortedFrames: RecommenderFrame[]): LayoutSolution {
        const { wall, config } = input;

        // Shelf logic
        // If config.shelfCount is not defined, default to 1.
        // Wait, shelfCount is not in RecommenderConfig yet. I need to add it.
        // Let's assume input.config has it as 'any' for now, or update types first.
        const shelfCount = (config as any).shelfCount || 1;

        // Strategy:
        // Divide wall height into (shelfCount + 1) vertical sections? 
        // Or place shelves at y = 100%, y=50%?
        // Let's divide vertically.
        // For 1 shelf: Shelf is at Y = wall.height * 0.66 (bottom 1/3)
        // For 2 shelves: Y1 = 33%, Y2 = 66%?

        // Better: standard shelf height intervals.
        const shelfYPositions: number[] = [];
        const sectionHeight = wall.height / (shelfCount + 1);
        for (let i = 1; i <= shelfCount; i++) {
            shelfYPositions.push(sectionHeight * i);
        }

        // We can create multiple solutions:
        // 1. Fill bottom shelf first
        // 2. Distribute evenly

        // Let's strip it uncomplicated: Balance frames across shelves.

        const placed: PlacedFrame[] = [];

        // Track current width of each shelf to balance them
        const shelfContents: RecommenderFrame[][] = Array.from({ length: shelfCount }, () => []);
        const shelfWidths: number[] = new Array(shelfCount).fill(0);

        // Smart Distribution:
        // 1. Sort frames by height (descending)
        // 2. Place each frame on the shelf that:
        //    a) Has enough vertical headroom (shelfY - frame.height >= margin)
        //    b) Has the least current width (to balance rows)

        sortedFrames.forEach((frame) => {
            let bestShelfIndex = -1;
            let minRowWidth = Infinity;

            for (let i = 0; i < shelfCount; i++) {
                const shelfY = shelfYPositions[i];
                // Check vertical fit (Headroom)
                // Frame top would be at: shelfY - frame.height
                // It must be >= margin (0 for now, but effectively >= 0)
                if (shelfY - frame.height >= 0) {
                    // Valid candidate
                    if (shelfWidths[i] < minRowWidth) {
                        minRowWidth = shelfWidths[i];
                        bestShelfIndex = i;
                    }
                }
            }

            // Fallback: If it fits nowhere (frame taller than even the lowest shelf's headroom), 
            // put it on the lowest shelf (index shelfCount - 1) which has max headroom.
            // (Assuming shelfYPositions increases, last one is largest Y)
            if (bestShelfIndex === -1) {
                bestShelfIndex = shelfCount - 1;
            }

            shelfContents[bestShelfIndex].push(frame);
            shelfWidths[bestShelfIndex] += frame.width;
        });

        const shelves = shelfContents;

        // Place frames on each shelf
        const margin = config.margin || 1;
        const spacing = config.spacing || 2;

        shelves.forEach((shelfFrames, sIdx) => {
            const shelfY = shelfYPositions[sIdx];

            // Calculate total width of this shelf
            const totalRowWidth = shelfFrames.reduce((sum, f) => sum + f.width, 0) + (shelfFrames.length - 1) * spacing;

            // Center the shelf row
            let startX = (wall.width - totalRowWidth) / 2;

            // If it exceeds wall width?
            if (totalRowWidth > (wall.width - margin * 2)) {
                // Should we wrap? Or just left align starting at margin?
                startX = margin;
                // If it overflows, it overflows. Skyline implies long horizontal space.
            }

            let currentX = startX;

            for (const frame of shelfFrames) {
                // Try to place at currentX
                // If collision, move currentX forward and try again
                let placedFrame = false;
                let attempts = 0;

                // Max attempts to find a slot on this shelf
                while (!placedFrame && attempts < 50) {
                    const pf: PlacedFrame = {
                        id: crypto.randomUUID(),
                        libraryId: frame.id,
                        x: currentX,
                        y: shelfY - frame.height,
                        width: frame.width,
                        height: frame.height,
                        rotation: 0
                    };

                    if (hasCollision(pf, [...input.obstacles, ...placed], spacing) || !isWithinBounds(pf, { x: 0, y: 0, width: wall.width, height: wall.height })) {
                        // Collision or Out of Bounds! Slide forward.
                        // Ideally we slide past the obstacle we hit.
                        // But hasCollision doesn't tell us WHICH obstacle.
                        // Simple approach: slide by small increments or frame width?
                        // Better: slide by 2 inches (spacing) until clear?
                        // Or: slide by frame.width / 4?
                        currentX += 2;
                        attempts++;
                    } else {
                        // Valid spot
                        placed.push(pf);
                        currentX += frame.width + spacing;
                        placedFrame = true;
                    }
                }

                if (!placedFrame) {
                    // Could not place on this shelf within limits.
                    // Skip it? Or force it?
                    // For now, skip.
                }
            }
        });

        // Sanitize placed frames
        const validPlaced = placed.filter(p =>
            !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y) &&
            !isNaN(p.width) && !isNaN(p.height)
        );

        if (validPlaced.length === 0) return {
            id: crypto.randomUUID(),
            frames: [],
            score: 0
        };

        // Force Use All Check (using inventory length from input, assuming all are unique items or count matches)
        // input.inventory has counts? No, RecommenderFrame usually has 'count' but here we expanded it?
        // Wait, input.inventory is RecommenderFrame[], if we used 'expanded' inventory passed to generate...
        // The generate method uses 'input.inventory'.
        // BUT, SkylineGenerator logic uses 'solutions' loop.
        // Wait, 'createSolution' takes 'sortedFrames' (which IS the flattened inventory).
        // So we can check if validPlaced.length < sortedFrames.length.

        if (config.forceAll && validPlaced.length < sortedFrames.length) {
            return {
                id: crypto.randomUUID(),
                frames: [],
                score: 0
            };
        }

        return {
            id: crypto.randomUUID(),
            frames: validPlaced,
            score: validPlaced.length
        };
    }
}
