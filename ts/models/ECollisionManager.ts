import { Building } from "../entity/Building";
import { Entity } from "../entity/Entity";
import { Player } from "../entity/Player";
import { Action } from "../enums/Action";
import { Utils } from "../utils/Utils";
import { ItemMetaType } from "../utils/itemsmanager";
import { MapObject } from "../entity/MapObject";
import { ObjectType } from "../enums/ObjectType";
import { EntityType } from "../enums/EntityType";
import { Biomes } from "../enums/Biomes";
import { ItemIds } from "../enums/ItemIds";
import { BufferWriter } from "../utils/bufferReader";
import { ServerPacketTypeBinary } from "../enums/PacketType"

export class ECollisionManager {
    player: Player;
    
    spikeInfo: any;
    ticks: any;
    spikeHurt: number;
    lastGsTicks: number = -1;
    ticksInSpike: number = 0;
    lastSpikeHurt: number = -1;
    constructor(playerOwn: Player) {
        this.player = playerOwn;

        this.spikeInfo = {
            isInside: false,
            insideTimestamp: -1
        }
        this.ticks = {
            inFireHurt: -1,
            inThornbushHurt: -1
        }
        this.spikeHurt = 0; // ticks behind
        this.lastGsTicks = -1;
    }

    updateCollides() {
        const now = +new Date();

        if(this.player.buildingManager.emeraldMachineId != -1 && now - this.lastGsTicks >= 1000) {
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

        const queryEntities = this.player.gameServer.queryManager.queryCircle(this.player.x , this.player.y , this.player.radius + 150);

        const spikedEntities:Building[] = [];
        const fireEntities:Building[] = [];
        const thornbushEntities:Building[] = [];

        isInSand = Utils.isInIsland(this.player);
        isInSea = this.player.biomeIn == Biomes.SEA && !this.player.stateManager.isInSand;
        isInWater = !this.player.stateManager.isInIsland && !this.player.stateManager.isInBridge && this.player.extra != ItemIds.BOAT && this.player.biomeIn == Biomes.SEA

        this.player.stateManager.isCollides = false;

        for(let i = 0; i < queryEntities.length; i++) {
            let e = queryEntities[i];

            if(Utils.isMapObject(e)) {
                
                switch(e.type) {
                    case ObjectType.ISLAND: {
                        if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius - 2)) continue;

                        isInIsland = true;
                        break;
                    }
                    case ObjectType.RIVER: {
                        if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius - 2)) continue;
                   
                        isInRiver = true;
                        break;
                    }
                }
            }

            if(Utils.isBuilding(e)) {
               e = e as Entity;

               if(
                    e.isSolid && Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius + 15)
                ) this.player.stateManager.isCollides = true;
                

               if(e.type == EntityType.BRIDGE) {
                    if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius)) continue;
                    isInBridge = true;
               };

               if(e.type == EntityType.BED) {
                    if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius + 5)) continue;
                    isInBed = true;
               }

               if(e.type == EntityType.ROOF) {
                    if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.radius)) continue;
                    isInRoof = true;
                }

                if(e.type == EntityType.THORNBUSH_SEED) {
                    if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius + 5, e.ownerClass.metaData.collideResolveRadius)) continue;
                    if(!e.isSolid || e.playerId == this.player.id ||
                        this.player.totemFactory && Utils.isContains(e.playerId, this.player.totemFactory.data)) continue;
                    
                    thornbushEntities.push(e.ownerClass);
                }

               if(e.type == EntityType.WORKBENCH) isInWorkbench = true;
               
               switch(e.ownerClass.metaType) {
                    case ItemMetaType.SPIKED_DOOR: {
                        
                        if(e.isSolid) {
                            if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.ownerClass.metaData.collideResolveRadius + 15)) continue;
                            if(e.playerId == this.player.id ||
                                this.player.totemFactory && Utils.isContains(e.playerId, this.player.totemFactory.data)) continue;

                            spikedEntities.push(e.ownerClass);
                        }
                        break;
                    }
                    case ItemMetaType.SPIKED_WALL: {
                        if(!Utils.isCirclesCollides(this.player.x , this.player.y, e.x , e.y, this.player.radius, e.ownerClass.metaData.collideResolveRadius + 15)) continue;

                        if(e.playerId == this.player.id ||
                            this.player.totemFactory && Utils.isContains(e.playerId, this.player.totemFactory.data)) continue;

                        spikedEntities.push(e.ownerClass);

                        break
                    }
                    case ItemMetaType.FIRE: {
                        fireEntities.push(e.ownerClass);

                        isInFire = true;
                        break;
                    }
                    case ItemMetaType.STORAGE: {
                        if (
                            e.type == EntityType.FURNACE && 
                            e.ownerClass.data[0][0] > 0
                        ) {
                            isInFire = true;
                        }
                        break;
                    }
               }
            }
        }

        if(this.player.stateManager.isInFire != isInFire) {

            const writer = new BufferWriter(2);
            writer.writeUInt8(ServerPacketTypeBinary.Fire);
            writer.writeUInt8(+isInFire);

            this.player.controller.sendBinary(writer.toBuffer());
        }

        if(this.player.stateManager.isWorkbench != isInWorkbench) {

            const writer = new BufferWriter(2);
            writer.writeUInt8(ServerPacketTypeBinary.Workbench);
            writer.writeUInt8(+isInWorkbench);

            this.player.controller.sendBinary(writer.toBuffer());
        }

        if(this.player.stateManager.isInSea != isInSea) {

            const writer = new BufferWriter(2);
            writer.writeUInt8(ServerPacketTypeBinary.Water);
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


        let damage:any = {d: -1, e: null};

        if(thornbushEntities.length > 0) {
            const nearest = Utils.getNearest(this.player, thornbushEntities);

            if(
                Utils.isCirclesCollides(this.player.x, this.player.y, nearest.entity.x, nearest.entity.y, this.player.radius + 5, nearest.entity.metaData.collideResolveRadius)
            ) {
                if(now - this.ticks.inThornbushHurt > 1400) {
                    this.ticks.inThornbushHurt = now;
    
                    this.player.receiveHit(nearest.entity, nearest.entity.metaData.collideDamage);
                } 
            };
        }

        if(fireEntities.length > 0) {            
            const nearest = Utils.getNearest(this.player, fireEntities);
            
            if(
                !Utils.isCirclesCollides(this.player.x, this.player.y, nearest.entity.x, nearest.entity.y, this.player.radius, nearest.entity.metaData.collideResolveRadius)
            ) {
                this.ticks.inFireHurt = now;
            }else {
                if(now - this.ticks.inFireHurt > 1400) {
                    this.ticks.inFireHurt = now;

                    this.player.receiveHit(nearest.entity, nearest.entity.metaData.collideDamage);

                    if(this.player.gaugesManager.warm > 0) {
                        this.player.gaugesManager.warm += 25;
                        
                    }else {
                        this.player.gaugesManager.cold += 20;
                    }

                    this.player.gaugesManager.update();
                }
            }
        }

        if(spikedEntities.length > 0) {

            for(let i = 0; i < spikedEntities.length; i++) {
                const spike = spikedEntities[i];

                if(damage.d < spike.metaData.collideDamage) damage.d = spike.metaData.collideDamage, damage.e = spike;

            }


            this.ticksInSpike++;


            if(now - this.lastSpikeHurt >= 1000 && this.ticksInSpike > 3) {
                this.ticksInSpike = 0;
             
                this.lastSpikeHurt = +new Date();

                this.player.health -= damage.d;
                this.player.action |= Action.HURT;
                this.player.gaugesManager.update();
                this.player.updateHealth(null);
               
               // this.player.action |= Action.HURT;
            }else {
                if(this.ticksInSpike >= 10) {
                    this.ticksInSpike = 0;
                    this.lastSpikeHurt = +new Date();
    
                    this.player.health -= damage.d;
                    this.player.action |= Action.HURT;
                    this.player.gaugesManager.update();
                    this.player.updateHealth(null);
                }
            }
          
        }else {
            this.lastSpikeHurt = -1, this.ticksInSpike = 0;
        }

        //console.log(this.player.stateManager.isInWater);

        
        // console.log(this.player.stateManager.isInBridge , this.player.stateManager.isWorkbench , this.player.stateManager.isInWater, this.player.stateManager.isInFire)
    }
}