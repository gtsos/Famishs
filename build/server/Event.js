"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = exports.EventType = void 0;
const EventCommands_1 = require("./EventCommands");
var EventType;
(function (EventType) {
    EventType["INTERVAL"] = "INTERVAL";
    EventType["KILL"] = "KILL";
    EventType["SCORE"] = "SCORE";
    EventType["CRAFT"] = "CRAFT";
    EventType["NEW_PLAYER"] = "NEW_PLAYER";
    EventType["PLAYER_DIED"] = "PLAYER_DIED";
    EventType["INVENTORY_OBTAIN"] = "INVENTORY_OPENED";
    EventType["PLAYER_TEXT"] = "PLAYER_TEXT";
})(EventType = exports.EventType || (exports.EventType = {}));
//@ts-ignore
class Event {
    name;
    type;
    params;
    condition;
    commands;
    eventManager;
    inst;
    constructor(name, type, params, condition, commands, eventManager) {
        this.type = type;
        this.name = name;
        this.params = params;
        this.eventManager = eventManager;
        this.condition = condition;
        this.commands = commands;
        this.inst = this;
        this.resolveType();
    }
    update(now, data = {}) {
        switch (this.type) {
            case EventType.INTERVAL: {
                if (now - this.inst.lastInterval > this.inst.repeatTime) {
                    for (let i = 0; i < this.commands.length; i++) {
                        (0, EventCommands_1.executeCommand)(this.commands[i], this.eventManager.gameServer);
                    }
                }
                break;
            }
            case EventType.KILL: {
                const killer = data.killer;
                const valueParam = this.params.find(p => p[0] == 'value');
                if (valueParam && valueParam[1] == killer.gameProfile.kills)
                    if (valueParam[1] != killer.gameProfile.kills)
                        return;
                for (let i = 0; i < this.commands.length; i++) {
                    let cmd = this.commands[i];
                    cmd = cmd.replaceAll("{kills}", killer.gameProfile.kills);
                    cmd = cmd.replaceAll("{player}", killer.id);
                    cmd = cmd.replaceAll("{name}", killer.gameProfile.name);
                    (0, EventCommands_1.executeCommand)(cmd, this.eventManager.gameServer);
                }
                break;
            }
        }
    }
    resolveType() {
        switch (this.type) {
            case EventType.INTERVAL: {
                this.inst.lastInterval = +new Date();
                const param = this.params.find(p => p[0] == "interval");
                this.inst.repeatTime = Number(param[1]);
                break;
            }
        }
    }
}
exports.Event = Event;
