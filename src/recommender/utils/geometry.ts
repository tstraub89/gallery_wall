
import { RecommenderObstacle, PlacedFrame } from '../types';

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Returns true if two rectangles intersect
 */
export function doRectsIntersect(r1: Rect, r2: Rect): boolean {
    return !(
        r2.x >= r1.x + r1.width ||
        r2.x + r2.width <= r1.x ||
        r2.y >= r1.y + r1.height ||
        r2.y + r2.height <= r1.y
    );
}

/**
 * Returns true if the rect is completely within the bounds
 */
export function isWithinBounds(rect: Rect, bounds: Rect): boolean {
    return (
        rect.x >= bounds.x &&
        rect.y >= bounds.y &&
        rect.x + rect.width <= bounds.x + bounds.width &&
        rect.y + rect.height <= bounds.y + bounds.height
    );
}

/**
 * Returns true if the candidate rect intersects with any of the obstacles or existing frames
 * Padding is applied to the candidate 
 */
export function hasCollision(
    candidate: Rect,
    others: (PlacedFrame | RecommenderObstacle)[],
    gap: number
): boolean {
    // We expand the candidate by 'gap' for the check to ensure spacing
    // Actually, simpler: check if (candidate + gap) intersects existing.

    // Effective candidate rect for spacing checks needs to handle the gap.
    // If we want 'gap' spacing between frames, we can treat each frame as being 'gap' larger
    // or just check intersection with expanded rects.

    const candidateWithGap = {
        x: candidate.x - gap / 2,
        y: candidate.y - gap / 2,
        width: candidate.width + gap,
        height: candidate.height + gap
    };

    for (const other of others) {
        // Expand the other as well to be safe, or just one? 
        // If we expand both by gap/2, they touch if distance < gap.
        const otherWithGap = {
            x: other.x - gap / 2,
            y: other.y - gap / 2,
            width: other.width + gap,
            height: other.height + gap
        };

        if (doRectsIntersect(candidateWithGap, otherWithGap)) {
            return true;
        }
    }
    return false;
}
