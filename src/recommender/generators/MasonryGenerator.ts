
import { RecommenderInput, LayoutSolution, PlacedFrame, RecommenderFrame } from '../types';
import { hasCollision } from '../utils/geometry';
import { estimateMaxCapacity } from '../utils/heuristics';

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class MasonryGenerator {
    generate(input: RecommenderInput): LayoutSolution[] {
        const { inventory } = input;
        const solutions: LayoutSolution[] = [];

        // Expand inventory based on counts
        const expandedInventory = inventory.flatMap(item => Array(item.count).fill(item));
        const totalFrames = expandedInventory.length;

        // Attempt 1: Sort by Height Descending (Tallest first - standard packing)
        solutions.push(this.createSolution(input, [...expandedInventory].sort((a, b) => b.height - a.height)));

        // Attempt 2: Sort by Area Descending (Largest first)
        solutions.push(this.createSolution(input, [...inventory].sort((a, b) => (b.width * b.height) - (a.width * a.height))));

        // Attempt 3: Sort by Width Descending (Widest first)
        solutions.push(this.createSolution(input, [...inventory].sort((a, b) => b.width - a.width)));

        // Attempt 4: Sort by Longest Side Descending (Biggest Dimension)
        solutions.push(this.createSolution(input, [...inventory].sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height))));

        // BRUTE FORCE SEARCH (Timed)
        // Keep trying random shuffles until we find a full solution or running out of time.
        // Cap at 2 seconds or 200 attempts to prevent hanging.
        const startTime = performance.now();
        const timeLimit = 5000; // 5 seconds
        const maxAttempts = 100000;
        let attempts = 0;

        // Check how many "good enough" solutions we already have
        const desiredSolutions = 10;

        const maxCap = estimateMaxCapacity(input);
        const passingThreshold = input.config.forceAll ? totalFrames : Math.max(1, Math.min(Math.floor(totalFrames * 0.9), maxCap));

        let satisfactoryCount = solutions.filter(s => s.frames.length >= passingThreshold).length;

        // Deduplication Helper
        const getSignature = (frames: PlacedFrame[]) => {
            // Sort frames by position to ensure order doesn't affect signature
            const sorted = [...frames].sort((a, b) => {
                const dy = Math.round(a.y) - Math.round(b.y);
                if (Math.abs(dy) > 1) return dy;
                return Math.round(a.x) - Math.round(b.x);
            });
            // Round to avoid float precision issues
            return sorted.map(f =>
                `${Math.round(f.x)},${Math.round(f.y)},${Math.round(f.width)},${Math.round(f.height)}`
            ).join('|');
        };

        const signatures = new Set<string>();
        solutions.forEach(s => signatures.add(getSignature(s.frames)));

        while (satisfactoryCount < desiredSolutions && (performance.now() - startTime < timeLimit) && attempts < maxAttempts) {
            attempts++;
            const randomSol = this.createSolution(input, [...expandedInventory].sort(() => Math.random() - 0.5));

            if (randomSol.frames.length > 0) {
                const sig = getSignature(randomSol.frames);
                if (!signatures.has(sig)) {
                    signatures.add(sig);
                    solutions.push(randomSol);
                    if (randomSol.frames.length >= passingThreshold) {
                        satisfactoryCount++;
                    }
                }
            }
        }

        return solutions.filter(s => s.frames.length > 0);

    }

    private createSolution(input: RecommenderInput, sortedFrames: RecommenderFrame[]): LayoutSolution {
        const { wall, config, obstacles } = input;
        const placed: PlacedFrame[] = [];

        // Effective wall area (respecting margins)
        const margin = config.margin || 1;
        const spacing = config.spacing || 2;

        const effectiveWall: Rect = {
            x: margin,
            y: margin,
            width: wall.width - margin * 2,
            height: wall.height - margin * 2
        };

        // Free rectangles logic (MaxRects simplified)
        // Initially, the whole wall is free
        let freeRects: Rect[] = [{ ...effectiveWall }];

        // Phase 0: Carve out OBSTACLES from freeRects
        if (obstacles && obstacles.length > 0) {
            for (const ob of obstacles) {
                const obRectWithSpacing = {
                    x: ob.x - spacing,
                    y: ob.y - spacing,
                    width: ob.width + spacing * 2,
                    height: ob.height + spacing * 2
                };
                freeRects = this.cutRectFromFree(freeRects, obRectWithSpacing);
            }
        }

        for (const frame of sortedFrames) {
            // Find best fit in freeRects
            // Strategy: Best Top-Left
            let bestRectIndex = -1;
            let bestScoreX = Infinity;
            let bestScoreY = Infinity;

            for (let i = 0; i < freeRects.length; i++) {
                const rect = freeRects[i];
                if (rect.width >= frame.width && rect.height >= frame.height) {
                    // It fits!
                    if (rect.y < bestScoreY || (rect.y === bestScoreY && rect.x < bestScoreX)) {
                        bestScoreY = rect.y;
                        bestScoreX = rect.x;
                        bestRectIndex = i;
                    }
                }
            }

            if (bestRectIndex !== -1) {
                // Place it
                const targetRect = freeRects[bestRectIndex];
                const pf: PlacedFrame = {
                    id: crypto.randomUUID(),
                    libraryId: frame.id,
                    x: targetRect.x,
                    y: targetRect.y,
                    width: frame.width,
                    height: frame.height,
                    rotation: 0
                };

                // SAFETY CHECK: Ensure we aren't colliding (float precision or logic bug fallback)
                // Use a slightly eroded check to avoid false positives on touching edges
                if (!hasCollision(pf, [...obstacles, ...placed], spacing * 0.9)) {
                    placed.push(pf);

                    // Update Free Rects
                    // We split ALL free rects that intersect with the new placed frame (inflated by spacing)
                    const placedRectWithSpacing = {
                        x: pf.x,
                        y: pf.y,
                        width: pf.width + spacing,
                        height: pf.height + spacing
                    };

                    freeRects = this.cutRectFromFree(freeRects, placedRectWithSpacing);
                } else {
                    // This should theoretically not happen if FreeRects are correct, 
                    // but if it does, we skip this spot and maybe try to recover?
                    // For now, if we collide, we just don't place it in this specific 'best' spot.
                    // Ideally we would search for the *next* best spot, but for simplicity/safety we skip.
                    // Or, we could just log it.
                    // Optimally: continue the search?
                    // Let's just not place it to prevent visual overlap.
                }
            }
        }

        // Center the result if no obstacles are present, or filter if they are
        if (placed.length > 0) {
            const minX = Math.min(...placed.map(p => p.x));
            const maxX = Math.max(...placed.map(p => p.x + p.width));
            const minY = Math.min(...placed.map(p => p.y));
            const maxY = Math.max(...placed.map(p => p.y + p.height));

            const totalW = maxX - minX;
            const totalH = maxY - minY;

            const offsetX = (wall.width - totalW) / 2 - minX;
            const offsetY = (wall.height - totalH) / 2 - minY;

            placed.forEach(p => {
                p.x += offsetX;
                p.y += offsetY;
            });
        }

        // CRITICAL FIX: After centering, we MUST re-validate collisions
        // The shift might have moved frames on top of obstacles!
        const validPlaced = placed.filter(p =>
            !hasCollision(p, obstacles, 0)
        );

        // Force Use All Check
        if (config.forceAll && validPlaced.length < sortedFrames.length) {
            return { id: crypto.randomUUID(), frames: [], score: 0 };
        }

        if (validPlaced.length === 0) return { id: crypto.randomUUID(), frames: [], score: 0 };

        return {
            id: crypto.randomUUID(),
            frames: validPlaced,
            score: validPlaced.length
        };
    }

    private cutRectFromFree(freeRects: Rect[], cuttingRect: Rect): Rect[] {
        const newFreeRects: Rect[] = [];
        for (const oldRect of freeRects) {
            if (this.intersects(cuttingRect, oldRect)) {
                // Split oldRect into up to 4 new rects

                // Top part
                if (cuttingRect.y > oldRect.y) {
                    newFreeRects.push({
                        x: oldRect.x,
                        y: oldRect.y,
                        width: oldRect.width,
                        height: cuttingRect.y - oldRect.y
                    });
                }
                // Bottom part
                if (cuttingRect.y + cuttingRect.height < oldRect.y + oldRect.height) {
                    newFreeRects.push({
                        x: oldRect.x,
                        y: cuttingRect.y + cuttingRect.height,
                        width: oldRect.width,
                        height: (oldRect.y + oldRect.height) - (cuttingRect.y + cuttingRect.height)
                    });
                }
                // Left part
                if (cuttingRect.x > oldRect.x) {
                    newFreeRects.push({
                        x: oldRect.x,
                        y: oldRect.y,
                        width: cuttingRect.x - oldRect.x,
                        height: oldRect.height
                    });
                }
                // Right part
                if (cuttingRect.x + cuttingRect.width < oldRect.x + oldRect.width) {
                    newFreeRects.push({
                        x: cuttingRect.x + cuttingRect.width,
                        y: oldRect.y,
                        width: (oldRect.x + oldRect.width) - (cuttingRect.x + cuttingRect.width),
                        height: oldRect.height
                    });
                }
            } else {
                newFreeRects.push(oldRect);
            }
        }
        return this.pruneRects(newFreeRects);
    }

    private intersects(r1: Rect, r2: Rect): boolean {
        return !(r2.x >= r1.x + r1.width ||
            r2.x + r2.width <= r1.x ||
            r2.y >= r1.y + r1.height ||
            r2.y + r2.height <= r1.y);
    }

    private pruneRects(rects: Rect[]): Rect[] {
        // Remove rects that are fully contained within another rect
        return rects.filter((r1, i) => {
            for (let j = 0; j < rects.length; j++) {
                if (i === j) continue;
                const r2 = rects[j];
                if (r1.x >= r2.x && r1.y >= r2.y &&
                    r1.x + r1.width <= r2.x + r2.width &&
                    r1.y + r1.height <= r2.y + r2.height) {
                    return false; // r1 is inside r2
                }
            }
            return true;
        });
    }
}
