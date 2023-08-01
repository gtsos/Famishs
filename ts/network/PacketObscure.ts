import { ConnectionPlayer } from "./ConnectionPlayer";
import serverSettings from "../settings/serverconfig.json";
import { ServerPacketTypeJson } from "../enums/PacketType";
import { Loggers } from "../logs/Logger";
import { EntityType } from "../enums/EntityType";
import { ItemIds } from "../enums/ItemIds";

export class PacketObscure {
    connection: ConnectionPlayer;

  
   
    lastDropItemPacket: number = -1;
    totalPacketsIn: number = 0;
    lastPacketRestore: number = -1;

    violates: number = 0;

    isBanned: boolean = false;

    constructor(cn: ConnectionPlayer) {
        this.connection = cn;
    }

    updateViolates() {

    }

    updatePacketData (): boolean {

        const now = +new Date();
        this.totalPacketsIn++;


     
        if(now - this.lastPacketRestore >= 1000) {
            this.lastPacketRestore = now
            
            this.totalPacketsIn = 0;
        }

        if(this.totalPacketsIn >= 40) {
            this.connection.sendJSON([ServerPacketTypeJson.AlertMessage, "EAC | Spam Packets Detection"]);
            this.connection.closeSocket();
            
            return false;
        }

        return true;
    }
    watchDropPacket (now: number): boolean {
        if(now - this.lastDropItemPacket <= serverSettings.other.dropCooldown) return false;

        this.lastDropItemPacket = now;
        return true;
    }
}