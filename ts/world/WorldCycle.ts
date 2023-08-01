import { GameServer } from "../GameServer";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";

export const CYCLE = {
    DAY: 0,
    NIGHT: 1
}
export class WorldCycle {
    gameInst: GameServer;
    time: number;
    cycle: number;
    lastCycleChange: number;
    sent: boolean;
    constructor(gameInst: GameServer) {
        this.gameInst = gameInst;
        this.time = 0;

        this.cycle = CYCLE.DAY;
        
        this.lastCycleChange = +new Date();


        this.sent = false;
    }
    isDay () {
        return this.cycle == CYCLE.DAY;
    }

    update() {
        const now = +new Date();
        this.time = now - this.lastCycleChange;

     //   this.time += 1000;
  
        if(this.time > 240000 && !this.sent) {
            this.cycle = CYCLE.NIGHT;
            this.sendCycleUpdate();
            this.sent = true;
        }
        if(this.time > 480000) {
            this.sent = false;
            this.cycle = CYCLE.DAY;
            this.sendCycleUpdate();
            this.lastCycleChange = +new Date();
            this.time = 0;
        }
      
    }

    sendCycleUpdate() {
        ////
        const buffer = new BufferWriter(2);
        buffer.writeUInt8(22)
        buffer.writeUInt8(this.cycle);

        for(const player of this.gameInst.players.values()) {
            player.controller.sendBinary(buffer.toBuffer());
        }
    }
}