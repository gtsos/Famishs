import { GameServer } from "../GameServer";
import fs from "fs";
import path from "path";
import evtslt from "../settings/events.json";
import { getNodeParams } from "./EventUtils";
import { Loggers } from "../logs/Logger";
import { EventErrors, constructError } from "./EventErrorLogger";
import { Event, EventType } from "./Event";
import { Player } from "../entity/Player";
export class EventManager {
    gameServer: GameServer;
    events: Event[];
    dirStat: any;

    constructor(gameServer: GameServer, dirStat: any) {
        this.gameServer = gameServer;
        this.events = [];
        this.dirStat = dirStat;

        this.updateConfig();
    }
    loop() {
        const date = +new Date();

        for(let i = 0; i < this.events.length; i++) {
            if(this.events[i].type == EventType.INTERVAL)
               this.events[i].update(date);
        }
    }
    onKill(thatDead: Player, thatKilled: Player) {
        const now = +new Date();

        const eventsFiltered = this.events.filter (e => e.type == (EventType.KILL));
        
        for(let i = 0; i < eventsFiltered.length; i++) {
            const evt = eventsFiltered[i];

            evt.update(now, {
                killer: thatDead,
                killed: thatKilled
            })
        }
    }
    updateConfig () {
        const fsstat = fs.readFileSync(this.dirStat + "/settings/events.json");

        //@ts-ignore
        const data = JSON.parse(fsstat);

        for(let i = 0; i < data.length; i++) {
            const eventData = data[i];
        
            const nodeName = eventData.name;
            const nodeType = (EventType as any)[eventData.type.toUpperCase()];
            
         
            if(!nodeType) {
                constructError(EventErrors.NODE_NOT_FOUND, nodeName, `EventType with ${eventData.type} not Found`)
                return;
            }
            
            const nodeParams = getNodeParams(eventData.params);

            const eventParams = [];
            for(let j = 0; j < nodeParams.length; j++) {
                const firstOne = nodeParams[j].split(" ")[0];
                const secondOne = nodeParams[j].split(" ")[1];

                if(!firstOne || !secondOne) {
                   constructError(EventErrors.PARAMS_PARSE_FAIL, nodeName, `Params Iterate Error at ${j}`,`Your params has invalid index`)
                   return;
                }
                eventParams.push([firstOne,secondOne]);

            }

            const condition = eventData.condition;
            const commands = eventData.commands;

            Loggers.game.info(`--------------`);
            Loggers.game.warn(`Event ${eventData.name} is Initialized!`)
            Loggers.game.info(`--------------`);
            
            this.events.push(new Event(nodeName,nodeType, eventParams, condition, commands, this));

        }
    }
}