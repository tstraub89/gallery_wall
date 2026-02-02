
import { WallConfig } from '../types';

export interface RecommenderInput {
    wall: WallConfig;
    inventory: RecommenderFrame[]; // Frames available to place
    obstacles: RecommenderObstacle[]; // Existing frames on wall to avoid
    config: RecommenderConfig;
}

export interface RecommenderFrame {
    id: string; // Library Item ID
    width: number;
    height: number;
    count: number; // How many of this frame type available
    priority?: number; // 1-5?
    borderWidth?: number;
}

export interface RecommenderObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RecommenderConfig {
    algorithm: 'monte_carlo' | 'grid' | 'spiral' | 'masonry' | 'skyline'; // Strategy
    spacing: number; // Gap between frames
    margin: number; // Margin from wall edges
    forceAll: boolean; // Must use all inventory?
    vibe: 'structured' | 'organic'; // 0-1 or enum?
    shelfCount?: number; // For Skyline
}

export interface PlacedFrame {
    id: string; // unique instance ID
    libraryId: string; // reference to inventory
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number; // 0 or 90
}

export interface LayoutSolution {
    id: string;
    frames: PlacedFrame[];
    score: number;
    metadata?: {
        coverage: number;
        alignment: number;
        balance: number;
    };
}

export type WorkerMessage =
    | { type: 'GENERATE'; payload: RecommenderInput }
    | { type: 'CANCEL' };

export type WorkerResponse =
    | { type: 'SOLUTION_FOUND'; payload: LayoutSolution }
    | { type: 'DONE'; count: number }
    | { type: 'ERROR'; message: string };
