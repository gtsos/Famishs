"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Box = void 0;
const Entity_1 = require("./Entity");
const EntityType_1 = require("../enums/EntityType");
const Utils_1 = require("../utils/Utils");
const ItemIds_1 = require("../enums/ItemIds");
class Box extends Entity_1.Entity {
    livingTime = -1;
    spawnTime = -1;
    loot;
    owner;
    factoryOf = "box";
    constructor(id, owner, gameServer) {
        super(id, 0, gameServer);
        this.owner = owner;
        this.loot = [];
    }
    onEntityUpdate() {
        if (Date.now() - this.spawnTime > this.livingTime * 1000) {
            this.gameServer.worldDeleter.initEntity(this, "living");
        }
    }
    onDead(damager) {
        if (!damager)
            return;
        let gatherIncrease = 1;
        if (damager.right == ItemIds_1.ItemIds.MACHETE && Utils_1.Utils.isMob(this.owner)) {
            gatherIncrease = 2;
        }
        for (let i = 0; i < this.loot.length; i++) {
            const loot = this.loot[i];
            damager.inventory.addItem(loot[0], loot[1] * gatherIncrease);
        }
        ;
    }
    setLoot(item, count) {
        if (count <= 0)
            return;
        switch (this.type) {
            case EntityType_1.EntityType.CRATE:
                this.loot.push([item, count]);
                break;
            case EntityType_1.EntityType.DEAD_BOX:
                this.loot.push([item, count > 255 ? 255 : count < 0 ? 0 : count]);
                break;
        }
    }
    ;
    onSpawn(x, y, angle, type, info) {
        this.initEntityData(x, y, angle, type, false);
        this.spawnTime = Date.now();
        this.info = info;
        switch (type) {
            case EntityType_1.EntityType.CRATE:
                this.livingTime = 16;
                this.max_health = 30;
                this.health = this.max_health;
                break;
            case EntityType_1.EntityType.DEAD_BOX:
                this.livingTime = 240;
                this.max_health = 240;
                this.health = this.max_health;
                break;
        }
    }
}
exports.Box = Box;
