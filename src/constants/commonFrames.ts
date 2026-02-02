export interface CommonFrameSize {
    width: number;
    height: number;
    label: string;
}

export const COMMON_SIZES: CommonFrameSize[] = [
    { width: 4, height: 6, label: '4" x 6"' },
    { width: 5, height: 7, label: '5" x 7"' },
    { width: 6, height: 4, label: '6" x 4"' },
    { width: 7, height: 5, label: '7" x 5"' },
    { width: 8, height: 10, label: '8" x 10"' },
    { width: 10, height: 8, label: '10" x 8"' },
    { width: 11, height: 14, label: '11" x 14"' },
    { width: 16, height: 20, label: '16" x 20"' },
    { width: 12, height: 12, label: '12" x 12"' },
    { width: 18, height: 24, label: '18" x 24"' },
    { width: 24, height: 36, label: '24" x 36"' },
];
