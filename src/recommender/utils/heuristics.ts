import { RecommenderInput, RecommenderFrame } from '../types';

/**
 * Calculates the rough maximum number of frames that can fit on the wall
 * considering their areas, spacing, and a packing efficiency factor.
 */
export function estimateMaxCapacity(input: RecommenderInput): number {
    const { wall, inventory, obstacles, config } = input;
    const spacing = config.spacing || 0;
    const margin = config.margin || 0;

    // 1. Calculate Available Wall Area
    const wallArea = (wall.width - (margin * 2)) * (wall.height - (margin * 2));

    const obstaclesArea = obstacles.reduce((sum, obs) => {
        return sum + (obs.width * obs.height);
    }, 0);

    const availableArea = Math.max(0, wallArea - obstaclesArea);

    // 2. Packing Efficiency Adjustment
    // Rectangles in a rectangle usually cap out around 80-90% unless perfectly tiled.
    // We'll be conservative to avoid over-promising.
    const PACKING_EFFICIENCY = 0.85;
    const effectiveLimit = availableArea * PACKING_EFFICIENCY;

    // 3. Expand Inventory
    const expanded: RecommenderFrame[] = inventory.flatMap(item => Array(item.count).fill(item));

    // 4. Sort small to large to see "max count" (optimistic)?
    // User wants "max number of frames", not "max number of BIG frames".
    // If we sort by smallest area first, we get the absolute theoretical max count of *any* combination.
    // If we want to check if the *current* set fits, we should just sum them all.
    // But the question is: "What is the max capacity threshold?" 

    // If we want to clamp the "passingThreshold", we should calculate how many of the INPUT set fit.
    // So we don't sort. We just iterate the inventory as given (or arbitrary order).
    // Actually, to find "how many of THOSE frames can fit", we should assume best case (smallest first)?
    // No, the generated solution picks random frames.
    // A safe heuristic for "passing threshold" is to stop count when area fills up.
    // But which frames?

    // Let's sort by Area ASCENDING to determine the "Theoretical Max Count" possible from this inventory.
    // This ensures that if we say "10 frames fit", it's physically possible (using the smallest 10).
    const sortedFrames = [...expanded].sort((a, b) => (a.width * a.height) - (b.width * b.height));

    let usedArea = 0;
    let count = 0;

    for (const frame of sortedFrames) {
        // Effective area of a frame includes half-spacing around it?
        // Simpler: (w + s) * (h + s)
        const frameArea = (frame.width + spacing) * (frame.height + spacing);

        if (usedArea + frameArea <= effectiveLimit) {
            usedArea += frameArea;
            count++;
        } else {
            break;
        }
    }

    return count;
}

/**
 * Strict check: Is the total raw area of all frames > wall area?
 * Returns true if definitely impossible.
 */
export function isPhysicallyImpossible(input: RecommenderInput): boolean {
    const { wall, inventory, obstacles, config } = input;
    const margin = config.margin || 0;

    const wallArea = (wall.width - (margin * 2)) * (wall.height - (margin * 2));
    const obstArea = obstacles.reduce((sum, o) => sum + (o.width * o.height), 0);
    const available = Math.max(0, wallArea - obstArea);

    const totalFrameArea = inventory.reduce((sum, item) => {
        return sum + (item.width * item.height * item.count);
    }, 0);

    return totalFrameArea > available;
}
