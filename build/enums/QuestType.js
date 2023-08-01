"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestStateType = exports.QuestType = void 0;
var QuestType;
(function (QuestType) {
    QuestType[QuestType["NONE"] = -1] = "NONE";
    QuestType[QuestType["DRAGON_ORB"] = 0] = "DRAGON_ORB";
    QuestType[QuestType["DRAGON_CUBE"] = 1] = "DRAGON_CUBE";
    QuestType[QuestType["GREEN_CROWN"] = 2] = "GREEN_CROWN";
    QuestType[QuestType["ORANGE_CROWN"] = 3] = "ORANGE_CROWN";
    QuestType[QuestType["BLUE_CROWN"] = 4] = "BLUE_CROWN";
})(QuestType = exports.QuestType || (exports.QuestType = {}));
var QuestStateType;
(function (QuestStateType) {
    QuestStateType[QuestStateType["FAILED"] = 0] = "FAILED";
    QuestStateType[QuestStateType["SUCCED"] = 1] = "SUCCED";
    QuestStateType[QuestStateType["CLAIMED"] = 2] = "CLAIMED";
})(QuestStateType = exports.QuestStateType || (exports.QuestStateType = {}));
