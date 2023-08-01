"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const ws_1 = require("ws");
const Logger_1 = require("../logs/Logger");
const devconfig_json_1 = __importDefault(require("../staticSettings/devconfig.json"));
const ConnectionPlayer_1 = require("./ConnectionPlayer");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
let logsCoung = 0;
let logLast = +new Date(); //
class SocketServer {
    gameServer;
    server;
    lastConnectionLoopReset = -1;
    connectionAmount = 0;
    activeWebSockets = 0;
    serverElapsedAt = +new Date();
    ipAdress = [];
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.server = new ws_1.WebSocketServer({
            port: devconfig_json_1.default.websocket_port,
            host: '0.0.0.0'
        });
        this.server.addListener('connection', (_socket, request) => {
            let otherIp = request.headers['x-forwarded-for']?.toString() || request.connection.localAddress || "";
            let ip = request.headers["cf-connecting-ip"]?.toString() || otherIp;
            if (!this.ipAdress[ip]) {
                console.log(this.ipAdress.length);
                console.log(`IP ADRESS NOT ALLOWED: ${ip}`);
                _socket.close(1014);
                return;
            }
            _socket.binaryType = "arraybuffer";
            console.log(`connection`);
            /*if(this.gameServer.globalAnalyzer.isBlackListed(otherIp as any)) {
                _socket.close(1014);
                return;
            }*/
            const now = +new Date();
            if (now - this.lastConnectionLoopReset > serverconfig_json_1.default.protection.throttleDelay) {
                this.lastConnectionLoopReset = now;
                this.connectionAmount = 0;
            }
            //
            //Fd
            if (this.isNodeConnection(request.headers, request.rawHeaders))
                return _socket.close(1000);
            const connectionPlayer = new ConnectionPlayer_1.ConnectionPlayer(this.gameServer, _socket, request);
            this.connectionAmount++;
            this.activeWebSockets += 1;
            _socket.on("message", (msg) => {
                try {
                    if (typeof msg === 'object' || typeof msg === "string") {
                        const data = JSON.parse(msg);
                        if (connectionPlayer.packetCounter < 1) {
                            connectionPlayer.receiveOurBinary(data);
                        }
                        else {
                            connectionPlayer.onPacketReceived(data);
                        }
                        /*
                        if(devConfig.env_mode == "TEST") {
                            const packetData = JSON.parse(msg);
                            if(connectionPlayer.packetCounter < 1) {
                                connectionPlayer.receiveOurBinary(packetData);
                            }else {
                                connectionPlayer.onPacketReceived(packetData);
                            }
                        }else {
                            const buffer = Buffer.from(msg);
                            const uint16Array = new Uint16Array(buffer.length / 2);
    
                            for (let i = 0; i < buffer.length; i += 2) {
                                const value = buffer.readUInt16LE(i);
                                uint16Array[i / 2] = value;
                            }
                            const packetData = JSON.parse(convertToString(decode(uint16Array)));
                        
                            if(connectionPlayer.packetCounter < 1) {
                                connectionPlayer.receiveOurBinary(packetData);
                            }else {
                                connectionPlayer.onPacketReceived(packetData);
                            }
                        }*/
                    }
                }
                catch (e) {
                    if (+new Date() - logLast > 1000) {
                        logsCoung = 0;
                    }
                    if (logsCoung <= 5) {
                        logsCoung += 1;
                        if (connectionPlayer.sourcePlayer != null) {
                            Logger_1.Loggers.game.info(`Error parsing message from ${connectionPlayer.sourcePlayer.gameProfile.name} with {0}`, e);
                        }
                        else {
                            Logger_1.Loggers.game.info("Error parsing message {0}", e);
                            //if(ENV_MODE != MODES.DEV) this.gameServer.globalAnalyzer.addToBlackList(otherIp);
                        }
                    }
                }
            });
            _socket.on('close', () => {
                this.activeWebSockets -= 1;
            });
            _socket.on('error', () => {
                this.activeWebSockets -= 1;
            });
        });
        Logger_1.Loggers.app.info("Running socket cheap on::{0}", devconfig_json_1.default.websocket_port);
    }
    isNodeConnection(headers, rawHeaders) {
        if (!headers.origin || !headers['user-agent'] || !rawHeaders[13])
            return true;
        if (rawHeaders[13] == "http://famishs.io" || rawHeaders[13] == "http://mirror.famishs.io" || rawHeaders[13] == "https://famishs.io" || rawHeaders[13] == "https://famishs.io/" || rawHeaders[13] == "http://famishs.io/" || rawHeaders[13] == "http://localhost" || rawHeaders[13] == "https://localhost:80")
            return false;
        return false;
    }
}
exports.SocketServer = SocketServer;
