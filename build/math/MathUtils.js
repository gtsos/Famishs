"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathUtils = void 0;
class MathUtils {
    static getItemCountCallback(amountIn, storageIn, max) {
        if (storageIn + amountIn <= max)
            return [amountIn, storageIn + amountIn];
        const diff = Math.abs(max - (storageIn + amountIn));
        return [amountIn - diff, max];
    }
    static lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }
}
exports.MathUtils = MathUtils;
