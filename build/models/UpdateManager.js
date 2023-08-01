"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateManager = void 0;
const Action_1 = require("../enums/Action");
const Utils_1 = require("../utils/Utils");
class UpdateManager {
    player;
    oldList = new Map();
    constructor(player) {
        this.player = player;
    }
    containsInArray(array, id) {
        return array.find((elem) => elem.id == id);
    }
    isUpdatedBefore(obj1) {
        return this.oldList.has(obj1.id) && Utils_1.Utils.objectEquals(obj1, this.oldList.get(obj1.id), this);
    }
    getEntities(ishard = false) {
        const newList = this.player.gameServer.queryManager.queryRectLiving(this.player.x, this.player.y, this.player.width, this.player.height);
        /**
         * Hard update to encounter some troubles
         */
        if (ishard) {
            this.oldList.clear();
            return newList;
        }
        /**
         * Default update , checks every data in object and defines if it same to update
         */
        const entityList = [];
        for (const oldEntity of this.oldList.values()) {
            if (!this.containsInArray(newList, oldEntity.id)) {
                oldEntity.action |= Action_1.Action.DELETE;
                entityList.push(oldEntity);
                this.oldList.delete(oldEntity.id);
            }
        }
        for (let i = 0; i < newList.length; i++) {
            const entity = newList[i];
            const copyOf = this.createObjectEntity(entity);
            if (this.oldList.has(entity.id)) {
                const copyOfOld = this.oldList.get(entity.id);
                if (this.isObjectSame(copyOf, copyOfOld) && copyOf.id == this.player.id) { //&& copyOf.id == this.player.id
                    continue;
                }
            }
            this.oldList.set(entity.id, copyOf);
            entityList.push(copyOf);
        }
        return entityList;
    }
    isObjectSame(obj1, obj2) {
        for (let prop in obj1) {
            if (obj1[prop] != obj2[prop])
                return false;
        }
        return true;
    }
    createObjectEntity(instance) {
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
        };
        return entity;
    }
}
exports.UpdateManager = UpdateManager;
