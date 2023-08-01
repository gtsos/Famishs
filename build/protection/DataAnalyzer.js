"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataAnalyzer = void 0;
const Logger_1 = require("../logs/Logger");
class DataAnalyzer {
    iConnection;
    constructor(iCn) {
        this.iConnection = iCn;
    }
    analyzeRequest(packetName) {
        let responseState = true;
        const request = this.iConnection.request;
        const splObscured = request.url?.split("/");
        if (splObscured.length < 2) {
            this.iConnection.gameServer.globalAnalyzer.addToBlackList(this.iConnection.userIp);
            Logger_1.Loggers.game.info(`Banned Bot Attempt from ${this.iConnection.userIp} with name ${packetName}`);
            return false;
        }
        const requestData = splObscured[1];
        return responseState;
    }
}
exports.DataAnalyzer = DataAnalyzer;
