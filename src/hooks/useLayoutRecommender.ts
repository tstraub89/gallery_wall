
import { useState, useCallback, useRef, useEffect } from 'react';
import { RecommenderInput, LayoutSolution, WorkerResponse, WorkerMessage } from '../recommender/types';
import { trackEvent, PRO_EVENTS } from '../utils/analytics';

export function useLayoutRecommender() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [solutions, setSolutions] = useState<LayoutSolution[]>([]);
    const [progress, setProgress] = useState(0);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../recommender/recommender.worker.ts', import.meta.url), {
            type: 'module'
        });

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type } = event.data;

            if (type === 'SOLUTION_FOUND') {
                const solution = (event.data as any).payload;
                setSolutions(prev => [...prev, solution].sort((a, b) => b.score - a.score));
            } else if (type === 'DONE') {
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
        setSolutions([]);
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
