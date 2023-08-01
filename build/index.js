"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_MODE = void 0;
const http = __importStar(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("./types/env.mode");
const devconfig_json_1 = __importDefault(require("./staticSettings/devconfig.json"));
const Logger_1 = require("./logs/Logger");
const GameServer_1 = require("./GameServer");
const env_mode_1 = require("./types/env.mode");
const MODE = env_mode_1.MODES[devconfig_json_1.default.env_mode];
exports.ENV_MODE = MODE;
class WebServer {
    app;
    server;
    gameServer;
    constructor() {
        this.app = (0, express_1.default)();
        this.server = http.createServer(this.app);
        /** Init HTTP Server */
        this.listen(devconfig_json_1.default.http_port);
        this.setupRoutes();
        try {
        }
        catch (err) {
        }
        finally {
            this.gameServer = new GameServer_1.GameServer(this);
        }
    }
    setupRoutes() {
        this.app.use((0, cors_1.default)());
        console.log(`setup`);
        this.app.get('/leaderboard', (req, res) => {
            const range = req.query.range || '';
            const mode = req.query.mode || '';
            const sort = req.query.sort || '';
            const season = req.query.season || '';
            switch (mode) {
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
    listen(port) {
        this.server.listen(port, () => Logger_1.Loggers.app.info(`Running http on basehead::{0}`, devconfig_json_1.default.http_port));
    }
    ;
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
