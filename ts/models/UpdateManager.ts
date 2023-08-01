import { Animal } from "../entity/Animal";
import { Entity } from "../entity/Entity";
import { MapObject } from "../entity/MapObject";
import { Player } from "../entity/Player";
import { Action } from "../enums/Action";
import { EntityType } from "../enums/EntityType";
import { Utils } from "../utils/Utils";

export class UpdateManager {
    public player: Player;

    public oldList: Map<any, any> = new Map<any,any>();

    constructor (player: Player) {
        this.player = player;

    }
    public containsInArray(array: any[] , id: any): any {
        return array.find((elem: any) => elem.id == id);
    }
    public isUpdatedBefore (obj1: any) {
        return this.oldList.has(obj1.id) && Utils.objectEquals(obj1, this.oldList.get(obj1.id) , this);
    }
    public getEntities(ishard:boolean = false): any[] {
        const newList = this.player.gameServer.queryManager.queryRectLiving(this.player.x , this.player.y , this.player.width , this.player.height);
        
        /**
         * Hard update to encounter some troubles
         */
        if(ishard) {
            this.oldList.clear();
            return newList;
        }
        /**
         * Default update , checks every data in object and defines if it same to update
         */
        const entityList = [];
        for(const oldEntity of this.oldList.values()) {
            if(!this.containsInArray(newList , oldEntity.id)) {
                oldEntity.action |= Action.DELETE;
                entityList.push(oldEntity);
                this.oldList.delete(oldEntity.id);
            }
        }
        for(let i = 0; i < newList.length; i++) {
            const entity = newList[i];
            const copyOf = this.createObjectEntity(entity);

            if(this.oldList.has(entity.id)) {
                const copyOfOld = this.oldList.get(entity.id);

                if(this.isObjectSame(copyOf, copyOfOld) && copyOf.id == this.player.id) {//&& copyOf.id == this.player.id
                    continue;
                }
            }

            this.oldList.set(entity.id , copyOf);
            entityList.push(copyOf);
        }
        return entityList;
    }
    public isObjectSame (obj1: any, obj2: any) {
        for(let prop in obj1) {
            if(obj1[prop] != obj2[prop]) 
                return false;
        }
        return true;
    }
    public createObjectEntity(instance : any) {
        const entity = {
            playerId: Number(instance.playerId),
            angle: Number(instance.angle),
            action: Number(instance.action),
            type: Number(instance.type),
            x: Number(instance.x),
            y: Number(instance.y),
            id: Number(instance.id),
            info: Number(instance.info),
            speed: Number(instance.speed),
            extra: Number(instance.extra)
        }
        return entity;
    }
}