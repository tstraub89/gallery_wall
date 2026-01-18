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
    const cleanLine = line.trim();

    // Check for "matted to"
    const mattedSplit = cleanLine.split(/matted to/i);
    const mainPart = mattedSplit[0];
    const mattedPart = mattedSplit.length > 1 ? mattedSplit[1] : null;

    const extractDims = (str) => {
        // defined broadly as:  (numberlike) [xX by space] (numberlike)
        // numberlike can be "16 1/4" or "5.5" or "10"

        // This regex attempts to split by 'x' or 'X', allowing surrounding spaces.
        // But "16 1/4" contains spaces. So we need to be careful.
        // Usually the format is Width X Height

        // Let's try matching the delimiter "x" or "X" surrounded by optional spaces, 
        // but ensure we don't break " 1/4 ". 
        // A simple split by "x" or "X" might work if we re-join widely.

        // Better strategy: Find the X that separates two numbers.
        // regex: /^(.*?)[\sxX]+(.*?)$/ might be too greedy.

        // Let's assume the separator is an x/X.
        // If there is no x/X, maybe it's invalid? The prompt says "Spaces or 'x'". 
        // "8 10" might be ambiguous with "8 1/2".
        // Let's assume 'x' is present for now based on examples, or standard space separation if no fraction mechanism interferes.
        // Prompt examples: "5 x 7", "12 x 16", "8x10". All have x.

        const parts = str.split(/[xX]/);
        if (parts.length === 2) {
            return {
                w: parseDimensionValue(parts[0]),
                h: parseDimensionValue(parts[1])
            };
        }
        return null;
    };

    const mainDims = extractDims(mainPart);
    if (!mainDims || mainDims.w === null || mainDims.h === null) return null;

    let result = {
        width: mainDims.w,
        height: mainDims.h,
        displayString: cleanLine, // Keep original for reference
        matted: null
    };

    if (mattedPart) {
        const mattedDims = extractDims(mattedPart);
        if (mattedDims && mattedDims.w !== null && mattedDims.h !== null) {
            result.matted = {
                width: mattedDims.w,
                height: mattedDims.h
            };
        }
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
