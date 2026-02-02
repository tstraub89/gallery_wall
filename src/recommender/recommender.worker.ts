
import { WorkerMessage, RecommenderInput } from './types';
import { MonteCarloGenerator } from './generators/MonteCarloGenerator';
import { GridGenerator } from './generators/GridGenerator';
import { SpiralGenerator } from './generators/SpiralGenerator';
import { MasonryGenerator } from './generators/MasonryGenerator';
import { SkylineGenerator } from './generators/SkylineGenerator';

const ctx: Worker = self as any;

ctx.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    if (type === 'GENERATE') {
        const input = (event.data as any).payload as RecommenderInput;
        try {
            runGeneration(input);
        } catch (e) {
            console.error('Worker Error:', e);
            ctx.postMessage({ type: 'ERROR', message: (e as Error).message });
        }
    }
};

function runGeneration(input: RecommenderInput) {
    // Optimization: If no items to place, return 0 solutions immediately
    if (!input.inventory || input.inventory.length === 0) {
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
    // We can stream them or return all at once.
    // For now, let's generate a batch and return the top ones.
    const solutions = generator.generate(input); // Generate attempts internally

    // Send back top 10 unique solutions
    solutions.slice(0, 10).forEach(solution => {
        ctx.postMessage({ type: 'SOLUTION_FOUND', payload: solution });
    });

    ctx.postMessage({ type: 'DONE', count: solutions.length });
}
