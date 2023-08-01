"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Action = void 0;
var Action;
(function (Action) {
    Action[Action["DELETE"] = 1] = "DELETE";
    Action[Action["HURT"] = 2] = "HURT";
    Action[Action["COLD"] = 4] = "COLD";
    Action[Action["HUNGER"] = 8] = "HUNGER";
    Action[Action["ATTACK"] = 16] = "ATTACK";
    Action[Action["WALK"] = 32] = "WALK";
    Action[Action["IDLE"] = 64] = "IDLE";
    Action[Action["HEAL"] = 128] = "HEAL";
    Action[Action["WEB"] = 256] = "WEB";
})(Action = exports.Action || (exports.Action = {}));
