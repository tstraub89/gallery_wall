/**
 * Parses a string dimension like "16 1/4", "5.5", "10" into a float.
 * @param {string} dimStr 
 * @returns {number|null}
 */
const parseDimensionValue = (dimStr) => {
    if (!dimStr) return null;
    dimStr = dimStr.trim();

    // Check for "16 1/4" pattern
    const fractionRegex = /^(\d+)\s+(\d+)\/(\d+)$/;
    const fractionMatch = dimStr.match(fractionRegex);
    if (fractionMatch) {
        const whole = parseInt(fractionMatch[1], 10);
        const num = parseInt(fractionMatch[2], 10);
        const den = parseInt(fractionMatch[3], 10);
        return whole + (num / den);
    }

    // Check for "1/4" pattern (no whole number)
    const pureFractionRegex = /^(\d+)\/(\d+)$/;
    const pureMatch = dimStr.match(pureFractionRegex);
    if (pureMatch) {
        const num = parseInt(pureMatch[1], 10);
        const den = parseInt(pureMatch[2], 10);
        return num / den;
    }

    // Standard float/int
    const val = parseFloat(dimStr);
    return isNaN(val) ? null : val;
};

/**
 * Parses a line from the text file.
 * Formats:
 * "5 x 7"
 * "8x10"
 * "16 1/4 x 20 matted to 12 1/4 x 16"
 * 
 * @param {string} line 
 * @returns {object|null} { width, height, mattedTo: { width, height } | null, originalString }
 */
export const parseFrameLine = (line) => {
    if (!line || !line.trim()) return null;
    const lowerLine = line.toLowerCase();
    const cleanLine = line.trim();

    // Check for "round", "oval", and "matted" keywords
    const isRound = lowerLine.includes('round') || lowerLine.includes('oval');
    const isMatted = lowerLine.includes('matted');

    // Split by "matted" to separate main dimensions from potential opening dimensions
    const mattedSplit = lowerLine.split(/matted/i);
    const mainPart = mattedSplit[0];
    const mattedPartRaw = mattedSplit.length > 1 ? mattedSplit[1] : null;

    const extractDims = (str) => {
        // Find the separator (x or X)
        const parts = str.split(/[xX]/);
        if (parts.length === 2) {
            // Sanitize: keep only numbers, spaces, dots, and slashes for dimension values
            const clean = (s) => s.replace(/[^0-9\s./]/g, '').trim();
            const w = parseDimensionValue(clean(parts[0]));
            const h = parseDimensionValue(clean(parts[1]));
            return { w, h };
        }
        return null;
    };

    const mainDims = extractDims(mainPart);
    if (!mainDims || mainDims.w === null || mainDims.h === null) return null;

    let result = {
        width: mainDims.w,
        height: mainDims.h,
        shape: isRound ? 'round' : 'rect',
        displayString: cleanLine, // Keep original for reference
        matted: null
    };

    if (mattedPartRaw) {
        const mattedDims = extractDims(mattedPartRaw);
        if (mattedDims && mattedDims.w !== null && mattedDims.h !== null) {
            result.matted = {
                width: mattedDims.w,
                height: mattedDims.h
            };
        }
    }

    // Default if keyword present but no dims found (1 inch border)
    if (isMatted && !result.matted) {
        result.matted = {
            width: Math.max(0.5, result.width - 2),
            height: Math.max(0.5, result.height - 2)
        };
    }

    return result;
};

export const parseFrameFile = (fileContent) => {
    const lines = fileContent.split(/\r?\n/);
    const frames = [];
    const errors = [];

    lines.forEach((line, index) => {
        if (!line.trim()) return;
        const frame = parseFrameLine(line);
        if (frame) {
            frames.push(frame);
        } else {
            errors.push({ line: index + 1, content: line, error: "Invalid format" });
        }
    });

    return { frames, errors };
};
