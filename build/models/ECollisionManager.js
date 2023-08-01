"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECollisionManager = void 0;
const Action_1 = require("../enums/Action");
const Utils_1 = require("../utils/Utils");
const itemsmanager_1 = require("../utils/itemsmanager");
const ObjectType_1 = require("../enums/ObjectType");
const EntityType_1 = require("../enums/EntityType");
const Biomes_1 = require("../enums/Biomes");
const ItemIds_1 = require("../enums/ItemIds");
const bufferReader_1 = require("../utils/bufferReader");
const PacketType_1 = require("../enums/PacketType");
class ECollisionManager {
    player;
    spikeInfo;
    ticks;
    spikeHurt;
    lastGsTicks = -1;
    ticksInSpike = 0;
    lastSpikeHurt = -1;
    constructor(playerOwn) {
        this.player = playerOwn;
        this.spikeInfo = {
            isInside: false,
            insideTimestamp: -1
        };
        this.ticks = {
            inFireHurt: -1,
            inThornbushHurt: -1
        };
        this.spikeHurt = 0; // ticks behind
        this.lastGsTicks = -1;
    }
    updateCollides() {
        const now = +new Date();
        if (this.player.buildingManager.emeraldMachineId != -1 && now - this.lastGsTicks >= 1000) {
            this.lastGsTicks = now;
            this.player.gameProfile.score += 15;
        }
        let isInBridge = false;
        let isInWorkbench = false;
        let isInIsland = false;
        let isInBed = false;
        let isInRoof = false;
        let isInSea = false;
        let isInWater = false;
        let isInFire = false;
        let isInSand = false;
        let isInRiver = false;
        const queryEntities = this.player.gameServer.queryManager.queryCircle(this.player.x, this.player.y, this.player.radius + 150);
        const spikedEntities = [];
        const fireEntities = [];
        const thornbushEntities = [];
        isInSand = Utils_1.Utils.isInIsland(this.player);
        isInSea = this.player.biomeIn == Biomes_1.Biomes.SEA && !this.player.stateManager.isInSand;
        isInWater = !this.player.stateManager.isInIsland && !this.player.stateManager.isInBridge && this.player.extra != ItemIds_1.ItemIds.BOAT && this.player.biomeIn == Biomes_1.Biomes.SEA;
        this.player.stateManager.isCollides = false;
        for (let i = 0; i < queryEntities.length; i++) {
            let e = queryEntities[i];
            if (Utils_1.Utils.isMapObject(e)) {
                switch (e.type) {
                    case ObjectType_1.ObjectType.ISLAND: {
                        if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius - 2))
                            continue;
                        isInIsland = true;
                        break;
                    }
                    case ObjectType_1.ObjectType.RIVER: {
                        if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius - 2))
                            continue;
                        isInRiver = true;
                        break;
                    }
                }
            }
            if (Utils_1.Utils.isBuilding(e)) {
                e = e;
                if (e.isSolid && Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius + 15))
                    this.player.stateManager.isCollides = true;
                if (e.type == EntityType_1.EntityType.BRIDGE) {
                    if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius))
                        continue;
                    isInBridge = true;
                }
                ;
                if (e.type == EntityType_1.EntityType.BED) {
                    if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius + 5))
                        continue;
                    isInBed = true;
                }
                if (e.type == EntityType_1.EntityType.ROOF) {
                    if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.radius))
                        continue;
                    isInRoof = true;
                }
                if (e.type == EntityType_1.EntityType.THORNBUSH_SEED) {
                    if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius + 5, e.ownerClass.metaData.collideResolveRadius))
                        continue;
                    if (!e.isSolid || e.playerId == this.player.id ||
                        this.player.totemFactory && Utils_1.Utils.isContains(e.playerId, this.player.totemFactory.data))
                        continue;
                    thornbushEntities.push(e.ownerClass);
                }
                if (e.type == EntityType_1.EntityType.WORKBENCH)
                    isInWorkbench = true;
                switch (e.ownerClass.metaType) {
                    case itemsmanager_1.ItemMetaType.SPIKED_DOOR: {
                        if (e.isSolid) {
                            if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.ownerClass.metaData.collideResolveRadius + 15))
                                continue;
                            if (e.playerId == this.player.id ||
                                this.player.totemFactory && Utils_1.Utils.isContains(e.playerId, this.player.totemFactory.data))
                                continue;
                            spikedEntities.push(e.ownerClass);
                        }
                        break;
                    }
                    case itemsmanager_1.ItemMetaType.SPIKED_WALL: {
                        if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, e.x, e.y, this.player.radius, e.ownerClass.metaData.collideResolveRadius + 15))
                            continue;
                        if (e.playerId == this.player.id ||
                            this.player.totemFactory && Utils_1.Utils.isContains(e.playerId, this.player.totemFactory.data))
                            continue;
                        spikedEntities.push(e.ownerClass);
                        break;
                    }
                    case itemsmanager_1.ItemMetaType.FIRE: {
                        fireEntities.push(e.ownerClass);
                        isInFire = true;
                        break;
                    }
                    case itemsmanager_1.ItemMetaType.STORAGE: {
                        if (e.type == EntityType_1.EntityType.FURNACE &&
                            e.ownerClass.data[0][0] > 0) {
                            isInFire = true;
                        }
                        break;
                    }
                }
            }
        }
        if (this.player.stateManager.isInFire != isInFire) {
            const writer = new bufferReader_1.BufferWriter(2);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Fire);
            writer.writeUInt8(+isInFire);
            this.player.controller.sendBinary(writer.toBuffer());
        }
        if (this.player.stateManager.isWorkbench != isInWorkbench) {
            const writer = new bufferReader_1.BufferWriter(2);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Workbench);
            writer.writeUInt8(+isInWorkbench);
            this.player.controller.sendBinary(writer.toBuffer());
        }
        if (this.player.stateManager.isInSea != isInSea) {
            const writer = new bufferReader_1.BufferWriter(2);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Water);
            writer.writeUInt8(+isInSea);
            this.player.controller.sendBinary(writer.toBuffer());
        }
        this.player.stateManager.isInBridge = isInBridge;
        this.player.stateManager.isWorkbench = isInWorkbench;
        this.player.stateManager.isInIsland = isInIsland;
        this.player.stateManager.isInBed = isInBed;
        this.player.stateManager.isInFire = isInFire;
        this.player.stateManager.isInRiver = isInRiver;
        this.player.stateManager.isInWater = isInWater;
        this.player.stateManager.isInSand = isInSand;
        this.player.stateManager.isInSea = isInSea;
        this.player.stateManager.isInRoof = isInRoof;
        let damage = { d: -1, e: null };
        if (thornbushEntities.length > 0) {
            const nearest = Utils_1.Utils.getNearest(this.player, thornbushEntities);
            if (Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, nearest.entity.x, nearest.entity.y, this.player.radius + 5, nearest.entity.metaData.collideResolveRadius)) {
                if (now - this.ticks.inThornbushHurt > 1400) {
                    this.ticks.inThornbushHurt = now;
                    this.player.receiveHit(nearest.entity, nearest.entity.metaData.collideDamage);
                }
            }
            ;
        }
        if (fireEntities.length > 0) {
            const nearest = Utils_1.Utils.getNearest(this.player, fireEntities);
            if (!Utils_1.Utils.isCirclesCollides(this.player.x, this.player.y, nearest.entity.x, nearest.entity.y, this.player.radius, nearest.entity.metaData.collideResolveRadius)) {
                this.ticks.inFireHurt = now;
            }
            else {
                if (now - this.ticks.inFireHurt > 1400) {
                    this.ticks.inFireHurt = now;
                    this.player.receiveHit(nearest.entity, nearest.entity.metaData.collideDamage);
                    if (this.player.gaugesManager.warm > 0) {
                        this.player.gaugesManager.warm += 25;
                    }
                    else {
                        this.player.gaugesManager.cold += 20;
                    }
                    this.player.gaugesManager.update();
                }
            }
        }
        if (spikedEntities.length > 0) {
            for (let i = 0; i < spikedEntities.length; i++) {
                const spike = spikedEntities[i];
                if (damage.d < spike.metaData.collideDamage)
                    damage.d = spike.metaData.collideDamage, damage.e = spike;
            }
            this.ticksInSpike++;
            if (now - this.lastSpikeHurt >= 1000 && this.ticksInSpike > 3) {
                this.ticksInSpike = 0;
                this.lastSpikeHurt = +new Date();
                this.player.health -= damage.d;
                this.player.action |= Action_1.Action.HURT;
                this.player.gaugesManager.update();
                this.player.updateHealth(null);
                // this.player.action |= Action.HURT;
            }
            else {
                if (this.ticksInSpike >= 10) {
                    this.ticksInSpike = 0;
                    this.lastSpikeHurt = +new Date();
                    this.player.health -= damage.d;
                    this.player.action |= Action_1.Action.HURT;
                    this.player.gaugesManager.update();
                    this.player.updateHealth(null);
                }
            }
        }
        else {
            this.lastSpikeHurt = -1, this.ticksInSpike = 0;
        }
        //console.log(this.player.stateManager.isInWater);
        // console.log(this.player.stateManager.isInBridge , this.player.stateManager.isWorkbench , this.player.stateManager.isInWater, this.player.stateManager.isInFire)
    }
}
exports.ECollisionManager = ECollisionManager;
