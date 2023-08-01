"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalDataAnalyzer = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Logger_1 = require("../logs/Logger");
class GlobalDataAnalyzer {
    blacListedData;
    gameServer;
    hashedIpsList;
    tempBlockList;
    constructor(gameServer) {
        this.blacListedData = [];
        this.gameServer = gameServer;
        this.hashedIpsList = [];
        this.tempBlockList = [];
        this.getListData();
    }
    addToBlackList(ip) {
        this.blacListedData.push(ip);
    }
    updateListData() {
        fs_1.default.writeFileSync(path_1.default.resolve(__dirname, './data/blacklist.json'), JSON.stringify(this.blacListedData));
    }
    getListData() {
        try {
            const data = fs_1.default.readFileSync(path_1.default.resolve(__dirname, './data/blacklist.json'));
            let jsonData = null;
            if (data)
                jsonData = JSON.parse(data);
            Logger_1.Loggers.game.info(`Loaded IP-BlackList within ${jsonData.length} blocked IPs`);
            this.blacListedData = jsonData;
        }
        catch (err) {
            fs_1.default.writeFileSync(path_1.default.resolve(__dirname, './data/blacklist.json'), JSON.stringify([]));
            this.getListData();
        }
    }
    removeBlackList(ip) {
        const nList = this.blacListedData.filter((a) => a != ip);
        ////
        this.blacListedData = nList;
    }
    isBlackListed(ip) {
        return this.tempBlockList.includes(ip) || this.blacListedData.includes(ip);
    }
}
exports.GlobalDataAnalyzer = GlobalDataAnalyzer;
