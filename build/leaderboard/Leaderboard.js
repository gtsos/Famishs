"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leaderboard = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Leaderboard {
    leaderboard;
    gameServer;
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.leaderboard = []; // Change the initialization to an empty array
        this.init();
    }
    init() {
        let data = fs_1.default.readFileSync(path_1.default.resolve(__dirname, "./leaderboard.json"));
        this.leaderboard = JSON.parse(data);
    }
    writeLb(data, range = 0) {
        this.leaderboard[range].push(data);
        this.sortLb(range);
        let leaderboard = this.leaderboard[range];
        if (leaderboard.length > 200) {
            this.leaderboard[range].splice(leaderboard.length - 1, 1);
        }
        fs_1.default.writeFileSync(path_1.default.resolve(__dirname, "./leaderboard.json"), JSON.stringify(this.leaderboard));
    }
    sortLb(range) {
        this.leaderboard[range].sort((p1, p2) => p2.score - p1.score);
    }
    toJson(range = 0) {
        return JSON.stringify(this.leaderboard[range]);
    }
}
exports.Leaderboard = Leaderboard;
