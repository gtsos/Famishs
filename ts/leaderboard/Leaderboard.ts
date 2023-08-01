import fs from "fs";
import path, { dirname } from 'path';

export class Leaderboard {
    public leaderboard: any[];
    public gameServer: any;

    constructor(gameServer: any) {
        this.gameServer = gameServer;
        this.leaderboard = []; // Change the initialization to an empty array
        this.init();
    }

    private init() {
        let data: any = fs.readFileSync(path.resolve(__dirname, "./leaderboard.json"));
        this.leaderboard = JSON.parse(data);
    }
    public writeLb(data: any, range: number = 0) {
        this.leaderboard[range].push(data);

        this.sortLb(range);

        let leaderboard = this.leaderboard[range];
        if (leaderboard.length > 200) {
            this.leaderboard[range].splice(leaderboard.length - 1, 1);
        }

        fs.writeFileSync(path.resolve(__dirname, "./leaderboard.json"), JSON.stringify(this.leaderboard));
    }

    public sortLb(range: number) {
        this.leaderboard[range].sort(
            (p1: any, p2: any) => p2.score - p1.score
        );
    }

    public toJson(range: number = 0) {
        return JSON.stringify(this.leaderboard[range]);
    }
}

