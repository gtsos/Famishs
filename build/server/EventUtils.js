"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeParams = void 0;
function getNodeParams(params) {
    const obData = params.split("-");
    const finalArray = [];
    for (let i = 1; i < obData.length; i++)
        finalArray.push(obData[i]);
    return finalArray;
}
exports.getNodeParams = getNodeParams;
