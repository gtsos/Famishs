"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Animal = void 0;
const EntityType_1 = require("../enums/EntityType");
const Utils_1 = require("../utils/Utils");
const Entity_1 = require("./Entity");
const Action_1 = require("../enums/Action");
const EntityUtils_1 = require("../utils/EntityUtils");
const Biomes_1 = require("../enums/Biomes");
class Animal extends Entity_1.Entity {
    lastMove = -1;
    lastStay = -1;
    stayCooldown = -1;
    lastInfoUpdate = -1;
    lastUpdate = -1;
    target;
    isMobStay = false;
    entitySettings;
    old_x = 0;
    old_y = 0;
    factoryOf = "animal";
    constructor(id, gameServer) {
        super(id, 0, gameServer);
    }
    onEntityUpdate(now) {
        switch (this.type) {
            case EntityType_1.EntityType.KRAKEN: {
                if (now - this.lastUpdate > 950) {
                    this.lastUpdate = now;
                    const entities = this.gameServer.queryManager.queryBuildings(this.x, this.y, this.radius);
                    for (let i = 0; i < entities.length; i++) {
                        const _entity = entities[i];
                        _entity.receiveHit(this, this.entitySettings.damage);
                    }
                }
                break;
            }
        }
        if (this.isMobStay && now - this.lastMove > (this.target ? 220 : 1000)) {
            this.target = Utils_1.Utils.getNearestInRange(this, 250);
            if (this.target != null) {
                let entity = this.target.entity;
                let angleDiff = Utils_1.Utils.angleDiff(this.x, this.y, entity.x, entity.y);
                let correctAngle = ((angleDiff) - (this.type === EntityType_1.EntityType.RABBIT ? Math.PI / 2 : -Math.PI / 2));
                this.angle = Utils_1.Utils.calculateAngle255(correctAngle);
                if (!entity.isFly) {
                    if (this.type == EntityType_1.EntityType.SPIDER) {
                        if (!entity.isStunned && this.target.dist < 170) {
                            if (Math.random() > .9) {
                                entity.isStunned = true;
                                entity.lastStun = now;
                                entity.action |= Action_1.Action.WEB;
                            }
                        }
                    }
                    if (this.type != EntityType_1.EntityType.RABBIT && now - entity.stateManager.lastAnimalsHit[this.type] > 500)
                        this.onAttack(now);
                }
            }
            else {
                this.angle = Utils_1.Utils.randomMaxMin(0, 255);
            }
            this.lastStay = now;
            this.isMobStay = false;
        }
        if (!this.isMobStay && now - this.lastStay > this.stayCooldown) {
            this.stayCooldown = this.target ? 430 : Utils_1.Utils.randomMaxMin(0, 1000);
            this.isMobStay = true;
            this.lastMove = now;
        }
        this.updateMovement();
    }
    ;
    onAttack(now) {
        const entity = this.target.entity;
        if (!Utils_1.Utils.isCirclesCollides(this.x, this.y, entity.x, entity.y, this.radius, entity.radius + 15)) {
            return;
        }
        entity.receiveHit(this, this.entitySettings.damage); //
        entity.stateManager.lastAnimalsHit[this.type] = now;
    }
    updateMovement() {
        if (this.isMobStay ||
            this.target && Utils_1.Utils.distanceSqrt(this.x, this.y, this.target.entity.x, this.target.entity.y) < this.entitySettings.hitbox_size)
            return;
        let angle = Utils_1.Utils.referenceAngle(this.angle) + Math.PI / 2;
        let x = this.x + Math.cos(angle) * this.speed;
        let y = this.y + Math.sin(angle) * this.speed;
        if (this.isCollides(x, y, this.entitySettings.hitbox_size)) {
            this.angle = Utils_1.Utils.randomMaxMin(0, 255);
            return;
        }
        if (Utils_1.Utils.isInIsland(this)) {
            let angleDiff = Utils_1.Utils.angleDiff(this.x, this.y, this.old_x, this.old_y);
            this.angle = Utils_1.Utils.calculateAngle255(angleDiff);
            angle = angleDiff + Math.PI / 2;
            x = this.x + Math.cos(angle) * 80;
            y = this.y + Math.sin(angle) * 80;
        }
        this.old_x = this.x;
        this.old_y = this.y;
        this.x = x;
        this.y = y;
    }
    isAllowedBiome(type) {
        for (let i = 0; i < this.entitySettings.allowedBiomes.length; i++) {
            let biome = this.entitySettings.allowedBiomes[i];
            //@ts-ignore
            if (Biomes_1.Biomes[biome] == type)
                return true;
        }
        return false;
    }
    onSpawn(x, y, angle, type) {
        this.initEntityData(x, y, angle, type, false);
        this.info = 1;
        ////
        this.entitySettings = (0, EntityUtils_1.getEntity)(type);
        this.old_x = x;
        this.old_y = y;
        switch (type) {
            case EntityType_1.EntityType.RABBIT:
                this.max_speed = 32;
                this.speed = this.max_speed;
                this.radius = 15;
                this.health = 60;
                this.max_health = this.health;
                break;
            case EntityType_1.EntityType.WOLF:
                this.max_speed = 23;
                this.speed = this.max_speed;
                this.radius = 30;
                this.health = 300;
                this.max_health = this.health;
                break;
            case EntityType_1.EntityType.SPIDER:
                this.max_speed = 24;
                this.speed = this.max_speed;
                this.radius = 30;
                this.health = 120;
                this.max_health = this.health;
                break;
            case EntityType_1.EntityType.BOAR:
                this.max_speed = 27;
                this.speed = this.max_speed;
                this.radius = 50;
                this.health = 600;
                this.old_health = this.health;
                this.max_health = this.health;
                break;
            case EntityType_1.EntityType.KRAKEN:
                this.max_speed = 24;
                this.speed = this.max_speed;
                this.radius = 100;
                this.health = 8000;
                this.max_health = this.health;
                break;
            case EntityType_1.EntityType.PIRANHA:
                this.max_speed = 30;
                this.speed = this.max_speed;
                this.radius = 29;
                this.health = 350;
                this.max_health = this.health;
                break;
        }
    }
}
exports.Animal = Animal;
