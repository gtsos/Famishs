"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgentBlackListed = void 0;
const blockedList = ['yusukedao', 'electron'];
// Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) yusukedao-famishs/1.0.0 Chrome/112.0.5615.183 Electron/24.3.1 Safari/537.36]
function isAgentBlackListed(agent) {
    for (let i = 0; i < blockedList.length; i++) {
        const rule = blockedList[i];
        if (agent.toLowerCase().includes(rule))
            return true;
    }
    return false;
}
exports.isAgentBlackListed = isAgentBlackListed;
