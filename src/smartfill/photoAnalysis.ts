
import { ColorProfile, CompositionProfile } from './types';

// Simple edge complexity check: standard deviation of brightness at edges
function calculateEdgeComplexity(imageData: ImageData): number {
    const { width, height, data } = imageData;
    const stride = 4;
    // Sample top, bottom, left, right edges (10px depth)
    const edgeDepth = 10;

    let sumBrightness = 0;
    let sumSquares = 0;
    let count = 0;

    // Top and Bottom strips
    for (let y = 0; y < height; y++) {
        if (y < edgeDepth || y > height - edgeDepth) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * stride;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                sumBrightness += brightness;
                sumSquares += brightness * brightness;
                count++;
            }
        }
    }

    // Left and Right strips (excluding corners already counted)
    for (let x = 0; x < width; x++) {
        if (x < edgeDepth || x > width - edgeDepth) {
            for (let y = edgeDepth; y < height - edgeDepth; y++) {
                const idx = (y * width + x) * stride;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                sumBrightness += brightness;
                sumSquares += brightness * brightness;
                count++;
            }
        }
    }

    if (count === 0) return 0;

    const mean = sumBrightness / count;
    const variance = (sumSquares / count) - (mean * mean);
    return Math.min(100, Math.sqrt(Math.max(0, variance))); // Cap at 100
}


// Quantize colors using Median Cut algorithm (simplified)
function quantizeColors(imageData: ImageData, maxColors: number): string[] {
    const { data } = imageData;
    const pixels: { r: number, g: number, b: number }[] = [];

    // Subsample for performance (every 10th pixel)
    for (let i = 0; i < data.length; i += 40) {
        if (data[i + 3] > 128) { // Ignore transparent
            pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    // Recursive median cut
    // (Implementation omitted for brevity, using simple histogram binning for v1 speed)
    // Actually, let's do a simple histogram binning instead for V1 velocity

    const colorMap = new Map<string, number>();

    pixels.forEach(p => {
        // Bin to 32-step values
        const r = Math.floor(p.r / 32) * 32;
        const g = Math.floor(p.g / 32) * 32;
        const b = Math.floor(p.b / 32) * 32;
        const key = `${r},${g},${b}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
    });

    // Sort by frequency
    const sorted = [...colorMap.entries()].sort((a, b) => b[1] - a[1]);

    return sorted.slice(0, maxColors).map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    });
}

export function analyzeImageColors(imageData: ImageData): ColorProfile {
    const dominantColors = quantizeColors(imageData, 5);

    // Calculate avg metrics
    let totalSat = 0;
    let totalBri = 0;
    let count = 0;

    for (let i = 0; i < imageData.data.length; i += 40) { // Subsample
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;
        const s = max === 0 ? 0 : d / max;
        const v = max / 255;

        totalSat += s;
        totalBri += v;
        count++;
    }

    const avgSat = (totalSat / count) * 100;
    const avgBri = (totalBri / count) * 100;

    let harmony: ColorProfile['harmony'] = 'neutral';
    if (avgSat > 60) harmony = 'vibrant';
    else if (avgSat < 20) harmony = 'muted';
    else if (avgBri > 70) harmony = 'warm'; // approximate
    else if (avgBri < 30) harmony = 'cool'; // Added 'cool' based on low brightness

    return {
        dominantColors,
        saturation: avgSat,
        brightness: avgBri,
        isGreyscale: avgSat < 10,
        harmony
    };
}

export function createCompositionProfile(
    width: number,
    height: number,
    imageData?: ImageData
): CompositionProfile {
    return {
        orientation: width > height ? 'landscape' : width < height ? 'portrait' : 'square',
        edgeComplexity: imageData ? calculateEdgeComplexity(imageData) : 50 // Default if no data
    };
}
