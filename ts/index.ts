import * as http from 'http';
import * as path from 'path';
import express from 'express';
import cors from 'cors';
import ws from "ws";
import process from 'node:process';

import "./types/env.mode";
import devConfig from "./staticSettings/devconfig.json";
import { Loggers } from './logs/Logger';
import { GameServer } from './GameServer';
import { MODES } from './types/env.mode';
import fs from "fs";
import { Leaderboard } from './leaderboard/Leaderboard';

const MODE = (MODES as any)[devConfig.env_mode];
export const ENV_MODE = MODE;

class WebServer {

    public readonly app: express.Express;
    public readonly server: http.Server;
    gameServer: GameServer;
    public constructor() {
        this.app = express();

        this.server = http.createServer(this.app);

        /** Init HTTP Server */
        this.listen(devConfig.http_port);

        this.setupRoutes();
            
        try {

        }catch(err) {

        }finally {
        
        this.gameServer = new GameServer(this);
        }
        
    }

    private setupRoutes() {
        this.app.use(cors());

        console.log(`setup`);

        this.app.get('/leaderboard', (req, res) => {
            const range = req.query.range || '';
            const mode = req.query.mode || '';
            const sort = req.query.sort || '';
            const season = req.query.season || '';

            switch(mode) {
                case "total": {
                    res.json(this.gameServer.leaderboard.leaderboard[0]);
                    res.status(200);
                    break;
                }
                default: {
                    res.json([]);
                    res.status(200);
                }
            }

            

            // console.log(req);

            

           

            // res.json(JSON.stringify(0));
            // res.sendStatus(200);
        });
    }

    private listen(port: number) {
        this.server.listen(port, () => Loggers.app.info(`Running http on basehead::{0}`, devConfig.http_port));
    };
}

new WebServer();
//


/*
process.on('error', (error) => {
    fs.writeFileSync('dump-' + Date.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
});
process.on('unhandledRejection', (error: any) => {
    fs.writeFileSync('dump-' + Date.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
});
process.on('uncaughtException', (error) => {
    fs.writeFileSync('dump-' + Date.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})
process.on('uncaughtExceptionMonitor', (error) => {
    fs.writeFileSync('dump-' + Date.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})
process.on('SIGINT', (error) => {
    fs.writeFileSync('dump-' + Date.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})*/