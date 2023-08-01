"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldCycle = exports.CYCLE = void 0;
const bufferReader_1 = require("../utils/bufferReader");
exports.CYCLE = {
    DAY: 0,
    NIGHT: 1
};
class WorldCycle {
    gameInst;
    time;
    cycle;
    lastCycleChange;
    sent;
    constructor(gameInst) {
        this.gameInst = gameInst;
        this.time = 0;
        this.cycle = exports.CYCLE.DAY;
        this.lastCycleChange = +new Date();
        this.sent = false;
    }
    isDay() {
        return this.cycle == exports.CYCLE.DAY;
    }
    update() {
        const now = +new Date();
        this.time = now - this.lastCycleChange;
        //   this.time += 1000;
        if (this.time > 240000 && !this.sent) {
            this.cycle = exports.CYCLE.NIGHT;
            this.sendCycleUpdate();
            this.sent = true;
        }
        if (this.time > 480000) {
            this.sent = false;
            this.cycle = exports.CYCLE.DAY;
            this.sendCycleUpdate();
            this.lastCycleChange = +new Date();
            this.time = 0;
        }
    }
    sendCycleUpdate() {
        ////
        const buffer = new bufferReader_1.BufferWriter(2);
        buffer.writeUInt8(22);
        buffer.writeUInt8(this.cycle);
        for (const player of this.gameInst.players.values()) {
            player.controller.sendBinary(buffer.toBuffer());
        }
    }
}
exports.WorldCycle = WorldCycle;
