
import { useState, useCallback, useRef, useEffect } from 'react';
import { RecommenderInput, LayoutSolution, WorkerResponse, WorkerMessage } from '../recommender/types';
import { trackEvent, PRO_EVENTS } from '../utils/analytics';

export function useLayoutRecommender() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [solutions, setSolutions] = useState<LayoutSolution[]>([]);
    const [progress, setProgress] = useState(0);
    const workerRef = useRef<Worker | null>(null);
    const pendingBuffer = useRef<LayoutSolution[]>([]);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../recommender/recommender.worker.ts', import.meta.url), {
            type: 'module'
        });

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type } = event.data;

            if (type === 'SOLUTION_FOUND') {
                const solution = (event.data as any).payload;
                pendingBuffer.current.push(solution);
            } else if (type === 'DONE') {
                // Done! Swap the buffer into state all at once
                setSolutions(pendingBuffer.current.sort((a, b) => b.score - a.score));
                setIsGenerating(false);
            } else if (type === 'ERROR') {
                console.error('Recommender Error:', (event.data as any).message);
                setIsGenerating(false);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const generateLayouts = useCallback((input: RecommenderInput) => {
        trackEvent(PRO_EVENTS.SMART_LAYOUT);
        setIsGenerating(true);
        // Do NOT clear solutions here. Keep the old ones visible until new ones are ready.
        // setSolutions([]); 

        // Reset Buffer
        pendingBuffer.current = [];
        setProgress(0);

        // Post message to worker
        workerRef.current?.postMessage({
            type: 'GENERATE',
            payload: input
        } as WorkerMessage);

    }, []);

    const cancelGeneration = useCallback(() => {
        // In a real implementation we might want to kill and restart the worker
        // to truly cancel if it's stuck in a loop.
        setIsGenerating(false);
    }, []);

    return {
        generateLayouts,
        cancelGeneration,
        isGenerating,
        solutions,
        progress
    };
}
