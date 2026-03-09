/**
 * Generates a valid 24-character Hex MongoDB ObjectId from any string or number.
 * This is deterministic: the same input will always produce the same ObjectId.
 * 
 * @param {string|number} id - The input ID (e.g., "123", "Ratnadeep Store")
 * @returns {string} - A 24-character Hex String
 */
export const generateObjectId = (id) => {
    if (!id) return "000000000000000000000000"; // Null ObjectId

    const str = id.toString();

    // If it's already a valid ObjectId (24 hex chars), return it
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
        return str;
    }

    // Attempt to keep numeric IDs simple by padding
    // e.g. "123" -> "000000000000000000000123"
    if (/^\d+$/.test(str) && str.length <= 24) {
        return str.padStart(24, '0');
    }

    // For non-numeric strings, generate a hash-based hex string
    let hex = "";
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16);
    }

    // Pad or truncate to 24 chars
    if (hex.length < 24) {
        return hex.padEnd(24, '0');
    } else {
        return hex.substring(0, 24);
    }
};
