"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovementDirection = void 0;
var MovementDirection;
(function (MovementDirection) {
    MovementDirection[MovementDirection["LEFT"] = 1] = "LEFT";
    MovementDirection[MovementDirection["RIGHT"] = 2] = "RIGHT";
    MovementDirection[MovementDirection["TOP"] = 4] = "TOP";
    MovementDirection[MovementDirection["BOTTOM"] = 8] = "BOTTOM";
    MovementDirection[MovementDirection["LEFT_TOP"] = 9] = "LEFT_TOP";
    MovementDirection[MovementDirection["LEFT_BOTTOM"] = 5] = "LEFT_BOTTOM";
    MovementDirection[MovementDirection["RIGHT_TOP"] = 10] = "RIGHT_TOP";
    MovementDirection[MovementDirection["RIGHT_BOTTOM"] = 6] = "RIGHT_BOTTOM";
    MovementDirection[MovementDirection["NONE"] = 7] = "NONE";
})(MovementDirection = exports.MovementDirection || (exports.MovementDirection = {}));
//x <- ->
//y top down
//55
