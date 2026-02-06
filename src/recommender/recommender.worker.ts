
import { WorkerMessage, WorkerResponse, RecommenderInput } from './types';
import { MonteCarloGenerator } from './generators/MonteCarloGenerator';
import { GridGenerator } from './generators/GridGenerator';
import { SpiralGenerator } from './generators/SpiralGenerator';
import { MasonryGenerator } from './generators/MasonryGenerator';
import { SkylineGenerator } from './generators/SkylineGenerator';
import { isPhysicallyImpossible } from './utils/heuristics';

// Type the global worker scope
const ctx = self as unknown as Worker;

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    if (type === 'GENERATE') {
        const payload = event.data.payload;
        try {
            runGeneration(payload);
        } catch (e) {
            console.error('Worker Error:', e);
            const errorResponse: WorkerResponse = { type: 'ERROR', message: (e as Error).message };
            ctx.postMessage(errorResponse);
        }
    }
};

function runGeneration(input: RecommenderInput) {
    // Optimization: If no items to place, return 0 solutions immediately
    if (!input.inventory || input.inventory.length === 0) {
        ctx.postMessage({ type: 'DONE', count: 0 });
        return;
    }

    // Fail Fast: If requiring all frames but they simply don't fit
    if (input.config.forceAll && isPhysicallyImpossible(input)) {
        // 0 solutions implies "None found".
        ctx.postMessage({ type: 'DONE', count: 0 });
        return;
    }

    // Select Generator
    let generator;
    switch (input.config.algorithm) {
        case 'monte_carlo':
            generator = new MonteCarloGenerator();
            break;
        case 'grid':
            generator = new GridGenerator();
            break;
        case 'spiral':
            generator = new SpiralGenerator();
            break;
        case 'masonry':
            generator = new MasonryGenerator();
            break;
        case 'skyline':
            generator = new SkylineGenerator();
            break;
        default:
            generator = new MonteCarloGenerator();
            break;
    }

    // Generate solutions
    const solutions = generator.generate(input); // Generate attempts internally

    // Send back top 10 unique solutions
    solutions.slice(0, 10).forEach(solution => {
        const response: WorkerResponse = { type: 'SOLUTION_FOUND', payload: solution };
        ctx.postMessage(response);
    });

    const doneResponse: WorkerResponse = { type: 'DONE', count: solutions.length };
    ctx.postMessage(doneResponse);
}
