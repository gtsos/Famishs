"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketObscure = void 0;
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
const PacketType_1 = require("../enums/PacketType");
class PacketObscure {
    connection;
    lastDropItemPacket = -1;
    totalPacketsIn = 0;
    lastPacketRestore = -1;
    violates = 0;
    isBanned = false;
    constructor(cn) {
        this.connection = cn;
    }
    updateViolates() {
    }
    updatePacketData() {
        const now = +new Date();
        this.totalPacketsIn++;
        if (now - this.lastPacketRestore >= 1000) {
            this.lastPacketRestore = now;
            this.totalPacketsIn = 0;
        }
        if (this.totalPacketsIn >= 40) {
            this.connection.sendJSON([PacketType_1.ServerPacketTypeJson.AlertMessage, "EAC | Spam Packets Detection"]);
            this.connection.closeSocket();
            return false;
        }
        return true;
    }
    watchDropPacket(now) {
        if (now - this.lastDropItemPacket <= serverconfig_json_1.default.other.dropCooldown)
            return false;
        this.lastDropItemPacket = now;
        return true;
    }
}
exports.PacketObscure = PacketObscure;
