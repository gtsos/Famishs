"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatManager = void 0;
const PacketType_1 = require("../enums/PacketType");
const Logger_1 = require("../logs/Logger");
class ChatManager {
    sourcePlayer;
    messagesCounter = 0;
    chatTimestamp = -1;
    mutedUntil = -1;
    constructor(sourcePlayer) {
        this.sourcePlayer = sourcePlayer;
    }
    get isMuted() { return Date.now() < this.mutedUntil; }
    mute() { this.mutedUntil = Date.now() + 60000; }
    onMessage(message) {
        if (this.isMuted)
            return;
        if (message.length > 200)
            return this.mute();
        const playersArr = this.sourcePlayer.gameServer.queryManager.queryPlayers(this.sourcePlayer.x, this.sourcePlayer.y, 2000);
        for (const player of playersArr) {
            if (player.playerId == this.sourcePlayer.playerId)
                continue;
            player.controller.sendJSON([
                PacketType_1.ServerPacketTypeJson.Chat,
                this.sourcePlayer.playerId,
                message
            ]);
        }
        this.messagesCounter++;
        this.chatUpdate();
        Logger_1.Loggers.game.info(this.sourcePlayer.gameProfile.name + ": " + message);
    } ////////
    chatUpdate() {
        const now = Date.now();
        if (Math.abs(now - this.chatTimestamp) > 3000) {
            this.chatTimestamp = Date.now();
            this.messagesCounter = 0;
        }
        if (this.messagesCounter >= 3 && !this.isMuted) {
            this.sourcePlayer.controller.sendJSON([PacketType_1.ServerPacketTypeJson.Muted]);
            this.mute();
        }
    }
}
exports.ChatManager = ChatManager;
