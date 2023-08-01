"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerAPI = void 0;
const ws_1 = __importDefault(require("ws"));
const Logger_1 = require("../logs/Logger");
const devconfig_json_1 = __importDefault(require("../staticSettings/devconfig.json"));
const bufferReader_1 = require("../utils/bufferReader");
const PacketType_1 = require("../enums/PacketType");
const MASTER_MODE = "prod";
class ServerAPI {
    gameServer;
    isUp = false;
    pendingRequests;
    //@ts-ignore
    socket;
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.pendingRequests = [];
        this.tryConnection();
        setInterval(() => {
            // return
            if (!this.isUp)
                this.tryConnection();
            else
                this.update();
        }, 1500);
    }
    onPlayerJoin(player) {
        return;
        if (!this.isUp) {
            this.pendingRequests.push(player);
            return Logger_1.Loggers.game.info(`Couldnt registerplayer with google acc`);
            return;
        }
        const googleToken = player.gameProfile.googleToken;
        /**
         * var id = ui8[1];
        var player = world.players[id];
        player.skin = ui8[2];
        player.accessory = ui8[3];
        player.baglook = ui8[4];
        player.book = ui8[5];
        player.crate = ui8[6];
        player.dead = ui8[7];
        player.level = ui8[8];
         */
        this.socket.send(JSON.stringify([
            100,
            googleToken,
            player.id,
            player.gameProfile.skin,
            player.gameProfile.accessory,
            player.gameProfile.baglook,
            player.gameProfile.book,
            player.gameProfile.box,
            player.gameProfile.deadBox
        ]));
    }
    update() {
        if (!this.isUp)
            return;
        if (this.pendingRequests.length > 0) {
            const elemt = this.pendingRequests.pop();
            this.socket.send(JSON.stringify([
                100,
                elemt.googleToken,
                elemt.id,
                elemt.gameProfile.skin,
                elemt.gameProfile.accessory,
                elemt.gameProfile.baglook,
                elemt.gameProfile.book,
                elemt.gameProfile.box,
                elemt.gameProfile.deadBox
            ]));
        }
        //245 - update
        this.socket.send(JSON.stringify([
            245,
            this.gameServer.gameConfiguration.server.name,
            this.gameServer.gameConfiguration.server.region ?? "eu",
            this.gameServer.players.size ?? 0,
            this.gameServer.gameConfiguration.server.playerLimit,
        ]));
    }
    onPlayerDied(player) {
        //fallback data
        if (!this.isUp)
            return Logger_1.Loggers.game.info(`Couldnt register ${player.gameProfile.name} with score= ${player.gameProfile.score} and kills= ${player.gameProfile.kills} due to server down`);
    }
    tryConnection() {
        this.socket = new ws_1.default(MASTER_MODE == "dev" ? "ws://localhost:8082/serverAPI" : "wss://portal.evelteam.su/serverAPI");
        this.socket.onopen = () => {
            Logger_1.Loggers.app.info(`Master connection is opened`);
            this.isUp = true;
            //194 - handshake
            this.socket.send(JSON.stringify([
                194,
                this.gameServer.gameConfiguration.server.name,
                this.gameServer.gameConfiguration.server.region ?? "eu",
                this.gameServer.players.size ?? 0,
                this.gameServer.gameConfiguration.server.playerLimit,
                "Oo0AZ0kzlvo0AOZOCVaiw2i878ZVY7g8a8zg78G87GQW78G7*G8g78v7g7GW7G3GJFUa78vg7837g8F78GIAWQPOB09U89",
                -1,
                devconfig_json_1.default.socket_link,
                devconfig_json_1.default.mode,
                devconfig_json_1.default.websocket_port,
                devconfig_json_1.default.isSSL
            ]));
        };
        this.socket.binaryType = 'arraybuffer';
        this.socket.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            const packetData = data.slice(1);
            const packetId = data[0];
            switch (packetId) {
                case 2:
                    this.gameServer.socketServer.ipAdress[packetData[3]] = true;
                    this.gameServer.tokens_allowed.push({ t: packetData[0], w: packetData[1], h: packetData[2] });
                    break;
                case 1: {
                    const [level, skin, accessory, bag, book, crate, deadBox, id] = packetData;
                    console.log(level, skin, accessory, bag, book, crate, deadBox, id);
                    const writer = new bufferReader_1.BufferWriter(9);
                    writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.VerifiedAccount);
                    writer.writeUInt8(id);
                    writer.writeUInt8(skin);
                    writer.writeUInt8(accessory);
                    writer.writeUInt8(bag);
                    writer.writeUInt8(book);
                    writer.writeUInt8(crate);
                    writer.writeUInt8(deadBox);
                    writer.writeUInt8(level);
                    //
                    for (const player of this.gameServer.players.values()) {
                        if (player.id == id) {
                            player.gameProfile.skin = skin;
                            player.gameProfile.accessory = accessory;
                            player.gameProfile.baglook = bag;
                            player.gameProfile.book = book;
                            player.gameProfile.box = crate;
                            player.gameProfile.deadBox = deadBox;
                            player.gameProfile.level = level;
                        }
                        player.controller.sendBinary(writer.toBuffer());
                    }
                    break;
                }
            }
        };
        this.socket.onclose = () => {
            Logger_1.Loggers.app.info(`Master connection is opened`);
            this.isUp = false;
        };
        this.socket.onerror = (e) => {
            Logger_1.Loggers.app.info(`Master connection is errored with error {e}`, e);
            this.isUp = false;
        };
    }
}
exports.ServerAPI = ServerAPI;
