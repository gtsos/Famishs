"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bullet = void 0;
const Entity_1 = require("./Entity");
class Bullet extends Entity_1.Entity {
    asItem;
    createdAt;
    velocity = {
        x: 0,
        y: 0
    };
    constructor(id, playerId, gameServer, asItem) {
        super(id, playerId, gameServer);
        this.asItem = asItem;
        this.createdAt = +new Date();
    }
    onDeadEvent() {
        this.health = 0;
        this.updateHealth(null);
    }
    onEntityUpdate() {
        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;
    }
}
exports.Bullet = Bullet;
