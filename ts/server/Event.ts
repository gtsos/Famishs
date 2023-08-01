import { Logger, Loggers } from "../logs/Logger";
import { executeCommand } from "./EventCommands";
import { EventManager } from "./EventManager";

export enum EventType {
    INTERVAL = 'INTERVAL', // looped event , requires param -interval [ms]
    KILL = 'KILL', // happens when player get this amount of kills ( required param = "-value [number]")
    SCORE = 'SCORE', // happens when player reach amount of score ( required param = "-value [number]" )
    CRAFT = 'CRAFT', // happens when someone ends craft , returns to condition {itemName}
    NEW_PLAYER = 'NEW_PLAYER', // happens when someone joins to server , returns to condiction {playerName} {id} {x} {y}
    PLAYER_DIED = 'PLAYER_DIED', // happens when someone died in server , returns to condiction {playerName} {id} {x} {y} {killerId} {killerName}
    INVENTORY_OBTAIN = 'INVENTORY_OPENED', // happens when someone getting item, for make proper item count need do param "-value [number]" returns {Id} 
    PLAYER_TEXT = 'PLAYER_TEXT', // happens when someone chat in the server , returns {playerName} {playerId} {msg}
}

//@ts-ignore
export class Event {
    name: any;
    type: EventType;
    params: any[];
    condition: string;
    commands: any[];
    eventManager: EventManager;
    inst: any;
    constructor(name: any, type: EventType, params: any[], condition: string, commands: any[], eventManager: EventManager) {
        this.type = type;
        this.name = name;
        this.params = params;
        this.eventManager = eventManager;
        this.condition = condition;
        this.commands = commands;

        this.inst = this as any;

        this.resolveType();
    }
    update (now: number, data: any = {}) {
        switch(this.type) {
            case EventType.INTERVAL: {
                if(now - this.inst.lastInterval > this.inst.repeatTime) {
                    
                    for(let i = 0; i < this.commands.length; i++) {
                        executeCommand(this.commands[i], this.eventManager.gameServer);
                    }
                }
                break;
            }
            case EventType.KILL: {
                const killer = data.killer;

                const valueParam = this.params.find(p => p[0] == 'value');

                if(valueParam && valueParam[1] == killer.gameProfile.kills) 
                    if(valueParam[1] != killer.gameProfile.kills) return;
                
                
                for(let i = 0; i < this.commands.length; i++) {
                    let cmd = this.commands[i];

                    cmd = cmd.replaceAll("{kills}", killer.gameProfile.kills);
                    cmd = cmd.replaceAll("{player}", killer.id);
                    cmd = cmd.replaceAll("{name}" , killer.gameProfile.name);
                    
                    executeCommand(cmd, this.eventManager.gameServer);
                }
                break;
            }
        }
    }

    resolveType() {
        switch(this.type) {
            case EventType.INTERVAL: {
                this.inst.lastInterval = +new Date();

                const param = this.params.find(p => p[0] == "interval");

                this.inst.repeatTime = Number(param[1]);
                break;
            }
        }
    }
}