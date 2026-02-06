
import { RecommenderInput, LayoutSolution, PlacedFrame, RecommenderFrame } from '../types';
import { hasCollision } from '../utils/geometry';
import { estimateMaxCapacity } from '../utils/heuristics';

export class GridGenerator {
    generate(input: RecommenderInput): LayoutSolution[] {
        const solutions: LayoutSolution[] = [];
        const { inventory } = input;

        // Expand inventory based on counts
        const expandedInventory = inventory.flatMap(item => Array(item.count).fill(item));
        const totalFrames = expandedInventory.length;

        // Attempt 1: Sort by Height Descending
        solutions.push(this.createRowLayout(input, [...expandedInventory].sort((a, b) => b.height - a.height)));

        // Attempt 2: Sort by Area Descending (Big frames first)
        solutions.push(this.createRowLayout(input, [...inventory].sort((a, b) => (b.width * b.height) - (a.width * a.height))));

        // Attempt 3: Sort by Height Ascending (Small frames first)
        solutions.push(this.createRowLayout(input, [...inventory].sort((a, b) => a.height - b.height)));

        // BRUTE FORCE SEARCH (Timed)
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
        solutions.forEach(s => signatures.add(getSignature(s.frames)));

        while (satisfactoryCount < desiredSolutions && (performance.now() - startTime < timeLimit) && attempts < maxAttempts) {
            attempts++;
            const randomSol = this.createRowLayout(input, [...expandedInventory].sort(() => Math.random() - 0.5));
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

    private createRowLayout(input: RecommenderInput, sortedFrames: RecommenderFrame[]): LayoutSolution {
        const { wall, config } = input;
        const placed: PlacedFrame[] = [];

        // Grid config
        const spacing = config.spacing || 2;
        const margin = config.margin || 5;

        const maxRowWidth = wall.width - (margin * 2);

        let currentRow: PlacedFrame[] = [];
        let currentX = 0;
        const rows: { frames: PlacedFrame[], height: number, width: number }[] = [];

        // 1. Pack into rows
        for (const frame of sortedFrames) {
            // Check if we have vertical space for a NEW row if this doesn't fit in current?
            // Actually, we only know row height after we pack it.
            // But we can check if the current accumulated height + spacing + frame.height exceeds wall.
            // Simplification: We pack normally, then TRUNCATE later.
            // OR: We
            const currentTotalHeight = rows.reduce((sum, r) => sum + r.height + spacing, 0);

            // Check if fits in current row
            if (currentX + frame.width <= maxRowWidth) {
                const pf: PlacedFrame = {
                    id: crypto.randomUUID(),
                    libraryId: frame.id,
                    x: currentX, // Relative to row start
                    y: 0,        // Relative to row top
                    width: frame.width,
                    height: frame.height,
                    rotation: 0
                };
                currentRow.push(pf);
                currentX += frame.width + spacing;
            } else {
                // Finish current row
                if (currentRow.length > 0) {
                    const rowHeight = Math.max(...currentRow.map(f => f.height));
                    const rowWidth = currentX - spacing; // Remove trailing spacing

                    // Check limits BEFORE pushing
                    if (currentTotalHeight + rowHeight > wall.height) {
                        // Stop packing, wall is full vertically
                        break;
                    }

                    rows.push({ frames: currentRow, height: rowHeight, width: rowWidth });
                }

                // Start new row
                // If frame doesn't fit in empty row, skip it (too wide)
                if (frame.width > maxRowWidth) continue;

                // Check vertical space for this NEW row
                // We use the frame's height as a proxy for the new row height
                if (currentTotalHeight + (rows.length > 0 ? spacing : 0) + frame.height > wall.height) {
                    break;
                }

                currentRow = [{
                    id: crypto.randomUUID(),
                    libraryId: frame.id,
                    x: 0,
                    y: 0,
                    width: frame.width,
                    height: frame.height,
                    rotation: 0
                }];
                currentX = frame.width + spacing;
            }
        }
        // Push last row if fits
        if (currentRow.length > 0) {
            const rowHeight = Math.max(...currentRow.map(f => f.height));
            const rowWidth = currentX - spacing;
            const currentTotalHeight = rows.reduce((sum, r) => sum + r.height + spacing, 0);
            if (currentTotalHeight + (rows.length > 0 ? spacing : 0) + rowHeight <= wall.height) {
                rows.push({ frames: currentRow, height: rowHeight, width: rowWidth });
            }
        }

        // 2. Calculate offsets to center everything
        const totalContentHeight = rows.reduce((sum, r) => sum + r.height, 0) + (rows.length > 1 ? (rows.length - 1) * spacing : 0);
        const startY = (wall.height - totalContentHeight) / 2;

        let yCursor = startY;

        for (const row of rows) {
            // Center row horizontally
            const startX = (wall.width - row.width) / 2;

            for (const f of row.frames) {
                // Align vertically in row (center or bottom?) -> Center is safest
                const yOffsetInRow = (row.height - f.height) / 2;

                placed.push({
                    ...f,
                    x: startX + f.x,
                    y: yCursor + yOffsetInRow
                });
            }
            yCursor += row.height + spacing;
        }

        // 3. Validate Bounds & Collision with Obstacles
        // For Grid, we just remove frames that would collide with existing obstacles.
        // This might leave holes in the grid, but that's better than overlapping.
        const validPlaced: PlacedFrame[] = [];

        for (const frame of placed) {
            // Strict Boundary Check
            const inBounds =
                frame.x >= 0 &&
                frame.y >= 0 &&
                (frame.x + frame.width) <= wall.width &&
                (frame.y + frame.height) <= wall.height;

            if (inBounds && !hasCollision(frame, input.obstacles, 0)) {
                validPlaced.push(frame);
            }
        }

        // If we removed too many, maybe fail? For now, just return what fits.
        // Also update score to reflect actual placed count.
        if (validPlaced.length === 0) return { id: crypto.randomUUID(), frames: [], score: 0 };

        // Force Use All Check
        if (config.forceAll && validPlaced.length < input.inventory.length) {
            return { id: crypto.randomUUID(), frames: [], score: 0 };
        }

        return {
            id: crypto.randomUUID(),
            frames: validPlaced,
            score: validPlaced.length
        };
    }
}
