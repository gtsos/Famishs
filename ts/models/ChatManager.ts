import { Player } from "../entity/Player";
import { ServerPacketTypeJson } from "../enums/PacketType"
import { Logger, Loggers } from "../logs/Logger";

export class ChatManager {
    public readonly sourcePlayer: Player;
    private messagesCounter: number = 0;
    private chatTimestamp: number = -1;
    private mutedUntil: number = -1;

    public constructor(sourcePlayer: Player) {
        this.sourcePlayer = sourcePlayer;
    }

    public get isMuted() { return Date.now() < this.mutedUntil; }
    public mute() { this.mutedUntil = Date.now() + 60000; }

    public onMessage(message: string) {
        if(this.isMuted) return;
        if(message.length > 200) return this.mute();

        const playersArr = this.sourcePlayer.gameServer.queryManager.queryPlayers(this.sourcePlayer.x, this.sourcePlayer.y, 2000);
        for (const player of playersArr) {
            
            if (player.playerId == this.sourcePlayer.playerId) continue;
            player.controller.sendJSON([
                ServerPacketTypeJson.Chat,
                this.sourcePlayer.playerId,
                message
            ]);
        }
        
        this.messagesCounter++;
        this.chatUpdate();

        Loggers.game.info(this.sourcePlayer.gameProfile.name + ": " + message)
    }////////

    public chatUpdate() {
        const now = Date.now();
        if (Math.abs(now - this.chatTimestamp) > 3000) {
            this.chatTimestamp = Date.now();
            this.messagesCounter = 0;
        }

        if (this.messagesCounter >= 3 && !this.isMuted) {
            this.sourcePlayer.controller.sendJSON([ ServerPacketTypeJson.Muted ]);
            this.mute();
        }
    }
}