"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
const fs_1 = __importDefault(require("fs"));
const EventUtils_1 = require("./EventUtils");
const Logger_1 = require("../logs/Logger");
const EventErrorLogger_1 = require("./EventErrorLogger");
const Event_1 = require("./Event");
class EventManager {
    gameServer;
    events;
    dirStat;
    constructor(gameServer, dirStat) {
        this.gameServer = gameServer;
        this.events = [];
        this.dirStat = dirStat;
        this.updateConfig();
    }
    loop() {
        const date = +new Date();
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].type == Event_1.EventType.INTERVAL)
                this.events[i].update(date);
        }
    }
    onKill(thatDead, thatKilled) {
        const now = +new Date();
        const eventsFiltered = this.events.filter(e => e.type == (Event_1.EventType.KILL));
        for (let i = 0; i < eventsFiltered.length; i++) {
            const evt = eventsFiltered[i];
            evt.update(now, {
                killer: thatDead,
                killed: thatKilled
            });
        }
    }
    updateConfig() {
        const fsstat = fs_1.default.readFileSync(this.dirStat + "/settings/events.json");
        //@ts-ignore
        const data = JSON.parse(fsstat);
        for (let i = 0; i < data.length; i++) {
            const eventData = data[i];
            const nodeName = eventData.name;
            const nodeType = Event_1.EventType[eventData.type.toUpperCase()];
            if (!nodeType) {
                (0, EventErrorLogger_1.constructError)(EventErrorLogger_1.EventErrors.NODE_NOT_FOUND, nodeName, `EventType with ${eventData.type} not Found`);
                return;
            }
            const nodeParams = (0, EventUtils_1.getNodeParams)(eventData.params);
            const eventParams = [];
            for (let j = 0; j < nodeParams.length; j++) {
                const firstOne = nodeParams[j].split(" ")[0];
                const secondOne = nodeParams[j].split(" ")[1];
                if (!firstOne || !secondOne) {
                    (0, EventErrorLogger_1.constructError)(EventErrorLogger_1.EventErrors.PARAMS_PARSE_FAIL, nodeName, `Params Iterate Error at ${j}`, `Your params has invalid index`);
                    return;
                }
                eventParams.push([firstOne, secondOne]);
            }
            const condition = eventData.condition;
            const commands = eventData.commands;
            Logger_1.Loggers.game.info(`--------------`);
            Logger_1.Loggers.game.warn(`Event ${eventData.name} is Initialized!`);
            Logger_1.Loggers.game.info(`--------------`);
            this.events.push(new Event_1.Event(nodeName, nodeType, eventParams, condition, commands, this));
        }
    }
}
exports.EventManager = EventManager;
