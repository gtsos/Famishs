"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryManager = void 0;
const Utils_1 = require("./Utils");
class QueryManager {
    gameServer;
    constructor(gameServer) {
        this.gameServer = gameServer;
    }
    pointInRect(x, y, x1, x2, y1, y2) {
        return (x > x1 && x < x2) && (y > y1 && y < y2);
    }
    queryRectLiving(x, y, width, height) {
        const arrayWithObjects = [];
        const px = x - width / 2;
        const py = y - height / 2;
        for (const entity of this.gameServer.updatableEntities) {
            if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
                arrayWithObjects.push(entity);
        }
        return arrayWithObjects;
    }
    queryRectPlayers(x, y, width, height) {
        const arrayWithObjects = [];
        const px = x - width / 2;
        const py = y - height / 2;
        for (const entity of this.gameServer.players.values()) {
            if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
                arrayWithObjects.push(entity);
        }
        return arrayWithObjects;
    }
    queryRect(x, y, width, height) {
        const arrayWithObjects = [];
        const px = x - width / 2;
        const py = y - height / 2;
        for (const entity of this.gameServer.entities) {
            if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
                arrayWithObjects.push(entity);
        }
        return arrayWithObjects;
    }
    queryCircle(x, y, radius) {
        const arr = [];
        for (let i = 0; i < this.gameServer.entities.length; i++) {
            const obj = this.gameServer.entities[i];
            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);
            if (Math.hypot(dx, dy) <= (radius + obj.radius))
                arr.push(obj);
        }
        return arr;
    }
    queryBuildings(x, y, radius) {
        const arr = [];
        for (let i = 0; i < this.gameServer.entities.length; i++) {
            const obj = this.gameServer.entities[i];
            if (!Utils_1.Utils.isBuilding(obj))
                continue;
            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);
            //@ts-ignore
            if (Math.hypot(dx, dy) <= (radius + obj.radius))
                arr.push(obj);
        }
        return arr;
    }
    queryPlayers(x, y, radius) {
        const playersArr = [];
        for (const obj of this.gameServer.players.values()) {
            const dx = Math.abs(x - obj.x);
            const dy = Math.abs(y - obj.y);
            if (Math.hypot(dx, dy) <= (radius + obj.radius))
                playersArr.push(obj);
        }
        return playersArr;
    }
}
exports.QueryManager = QueryManager;
