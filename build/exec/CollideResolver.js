"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollideResult = void 0;
class CollideResult {
    collidesWith;
    newPos;
    dist;
    constructor(collidesWith, newPos, dist) {
        this.collidesWith = collidesWith;
        this.newPos = newPos;
        this.dist = dist;
    }
}
exports.CollideResult = CollideResult;
