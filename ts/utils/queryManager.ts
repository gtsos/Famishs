import { Animal } from "../entity/Animal";
import { Entity } from "../entity/Entity";
import { MapObject } from "../entity/MapObject";
import { Player } from "../entity/Player";
import { ObjectType } from "../enums/ObjectType";
import { GameServer } from "../GameServer";
import { Utils } from "./Utils"

import { Building } from "../entity/Building"

export class QueryManager {
    public gameServer: GameServer;

    constructor (gameServer: GameServer) {
        this.gameServer = gameServer;
    }
    public pointInRect (x: number , y: number, x1: number , x2: number, y1: number , y2: number): boolean {
        return (x > x1 && x < x2) && (y > y1 && y < y2)
    }
    public queryRectLiving(x: number , y: number , width: number , height: number): Entity [] {
        const arrayWithObjects: Entity[] = [];
        const px = x - width / 2;
        const py = y - height / 2;
        for(const entity of this.gameServer.updatableEntities) {
            if(entity.x >= px && entity.x <= px + width  && entity.y >= py && entity.y <= py + height) arrayWithObjects.push(entity);
        }

        return arrayWithObjects;
    }
    public queryRectPlayers(x: number , y: number , width: number , height: number): Player [] {
        const arrayWithObjects: Player[] = [];
        const px = x - width / 2;
        const py = y - height / 2;
        for(const entity of this.gameServer.players.values()) {
            if(entity.x >= px && entity.x <= px + width  && entity.y >= py && entity.y <= py + height) arrayWithObjects.push(entity);
        }

        return arrayWithObjects;
    }
    public queryRect(x: number, y: number, width: number, height: number): (Entity | MapObject | Animal) [] {
        const arrayWithObjects: (Entity | MapObject) [] = [];
        const px = x - width / 2;
        const py = y - height / 2;

        for(const entity of this.gameServer.entities) {
            if(entity.x >= px && entity.x <= px + width  && entity.y >= py && entity.y <= py + height) arrayWithObjects.push(entity);
        }

        return arrayWithObjects;
    }

    public queryCircle(x: number, y: number, radius: number): (Entity | MapObject | Animal)[] {
        const arr = [];
        
        for(let i = 0; i < this.gameServer.entities.length; i++) {
            const obj = this.gameServer.entities[i];

            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);
            if(Math.hypot(dx, dy) <= (radius + obj.radius)) arr.push(obj);

         
        }

        return arr;
    }

    public queryBuildings(x: number, y: number, radius: number): Building[] {
        const arr: Building[] = [];
        
        for(let i = 0; i < this.gameServer.entities.length; i++) {
            const obj = this.gameServer.entities[i];

            if(!Utils.isBuilding(obj)) continue;

            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);

            //@ts-ignore
            if(Math.hypot(dx, dy) <= (radius + obj.radius)) arr.push(obj);
        }

        return arr;
    }

    public queryPlayers(x: number , y: number , radius: number): Player[] {
        const playersArr: Player[] = [];

        for(const obj of this.gameServer.players.values()) {
            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);
            if(Math.hypot(dx, dy) <= (radius + obj.radius)) playersArr.push(obj);
        }

        return playersArr;
    }
}