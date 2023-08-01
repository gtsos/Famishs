"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeIp = void 0;
const Logger_1 = require("../../logs/Logger");
const IP_1 = require("./IP");
function analyzeIp(globalAnalyzer, connectionHashList, ip) {
    const ipInst = connectionHashList.find(f => f.ip == ip);
    if (!ipInst) {
        globalAnalyzer.hashedIpsList.push(new IP_1.IP(ip));
        return;
    }
    if (ipInst.connectionCount > 10) {
        globalAnalyzer.tempBlockList.push(ip);
        Logger_1.Loggers.game.info(`[Global Analyzer Thread#${~~(Math.random() * 59)}]: Blocked attack attempt from Following ip: ${ip} | #ee2 | ${ipInst.connectionCount}`);
        const newList = connectionHashList.filter(e => e.ip != ip);
        globalAnalyzer.hashedIpsList = newList;
        return;
    }
    if (+new Date() - ipInst.connectionTimestamp > 1000 * 3) {
        ipInst.connectionTimestamp = +new Date();
        ipInst.connectionCount = 0;
    }
}
exports.analyzeIp = analyzeIp;
