import { EntityType } from "../enums/EntityType";
import { GameServer } from "../GameServer";
import { Utils } from "../utils/Utils";
import { Entity } from "./Entity";
import { Action } from "../enums/Action";
import { getEntity } from "../utils/EntityUtils";
import { Player } from "./Player";
import { CollisionUtils } from "../math/CollisionUtils";
import { Building } from "./Building";
import { Biomes } from "../enums/Biomes";
import { ItemIds } from "../enums/ItemIds";

export class Animal extends Entity {
    private lastMove: number = -1;
    private lastStay: number = -1;
    private stayCooldown: number = -1;
    private lastInfoUpdate: number = -1;
    private lastUpdate: number = -1;
    
    private target: any;

    private isMobStay: boolean = false;
    private entitySettings: any;

    private old_x: number = 0;
    private old_y: number = 0;

    public factoryOf: string = "animal";

    constructor(id: number, gameServer: GameServer) {
        super(id, 0, gameServer);

    }

    public onEntityUpdate(now: number) {

        switch(this.type) {
            case EntityType.KRAKEN: {
                if(now - this.lastUpdate > 950) {
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

        if(this.isMobStay && now - this.lastMove > (this.target ? 220 : 1000)) {
            this.target = Utils.getNearestInRange(this,  250);

            if(this.target != null) {
                
                let entity = this.target.entity;

                let angleDiff = Utils.angleDiff(this.x, this.y, entity.x, entity.y);
                let correctAngle = ((angleDiff) - (this.type === EntityType.RABBIT ? Math.PI / 2 : -Math.PI / 2));

                this.angle = Utils.calculateAngle255(correctAngle);

                if(!entity.isFly) {
                    if(this.type == EntityType.SPIDER) {
                        if (!entity.isStunned && this.target.dist < 170) {
                            if (Math.random() > .9) {
                                entity.isStunned = true;
                                entity.lastStun = now;
                                entity.action |= Action.WEB;
                            }
                        } 
                    }
                    
                    if(this.type != EntityType.RABBIT && now - entity.stateManager.lastAnimalsHit[this.type] > 500)
                        this.onAttack(now);
                }

            }else {
                this.angle = Utils.randomMaxMin(0, 255);
            }

            this.lastStay = now; 
            this.isMobStay = false;
        }

        if (!this.isMobStay && now - this.lastStay > this.stayCooldown) {
            this.stayCooldown = this.target ? 430 : Utils.randomMaxMin(0, 1000);
            this.isMobStay = true;
            this.lastMove = now;
        }
        
        this.updateMovement();
    };

    public onAttack(now: number) {
        
        const entity = this.target.entity;

        if(!Utils.isCirclesCollides(this.x, this.y, entity.x, entity.y, this.radius, entity.radius + 15)) {
            return; 
        }

        entity.receiveHit(this, this.entitySettings.damage); //
        entity.stateManager.lastAnimalsHit[this.type] = now;
    }


    public updateMovement() {
        if (
            this.isMobStay || 
            this.target && Utils.distanceSqrt(this.x, this.y, this.target.entity.x, this.target.entity.y) < this.entitySettings.hitbox_size
        ) return;

        let angle = Utils.referenceAngle(this.angle) + Math.PI / 2;

        let x = this.x + Math.cos(angle) * this.speed;
        let y = this.y + Math.sin(angle) * this.speed;

        if(this.isCollides(x, y, this.entitySettings.hitbox_size)) {
            this.angle = Utils.randomMaxMin(0, 255);
            return
        }

        if(Utils.isInIsland(this)) {
            let angleDiff = Utils.angleDiff(this.x, this.y, this.old_x, this.old_y);
            this.angle = Utils.calculateAngle255(angleDiff);

            angle = angleDiff + Math.PI / 2;

            x = this.x + Math.cos(angle) * 80;
            y = this.y + Math.sin(angle) * 80;
        }

        this.old_x = this.x;
        this.old_y = this.y;

        this.x = x;
        this.y = y;
    }

    public isAllowedBiome(type: Biomes) {
        for (let i = 0; i < this.entitySettings.allowedBiomes.length; i++) {
            let biome = this.entitySettings.allowedBiomes[i];

            //@ts-ignore
            if(Biomes[biome] == type) return true;
        }
        return false
    }

    public onSpawn(x: number, y: number, angle: number, type: number) {
        this.initEntityData(x, y, angle, type, false);
        this.info = 1;
////
        this.entitySettings = getEntity(type);

        this.old_x = x;
        this.old_y = y;
                
        switch(type) {
            case EntityType.RABBIT:
                this.max_speed = 32;
                this.speed = this.max_speed;
                this.radius = 15;
                this.health = 60;
                this.max_health = this.health;
                break;
            case EntityType.WOLF:
                this.max_speed = 23;
                this.speed = this.max_speed;
                this.radius = 30;
                this.health = 300;
                this.max_health = this.health;
                break;
            case EntityType.SPIDER:
                this.max_speed = 24;
                this.speed = this.max_speed;
                this.radius = 30;
                this.health = 120;
                this.max_health = this.health;
                break;
            case EntityType.BOAR:
                this.max_speed = 27;
                this.speed = this.max_speed;
                this.radius = 50;
                this.health = 600;
                this.old_health = this.health;
                this.max_health = this.health;
                break;
            case EntityType.KRAKEN:
                this.max_speed = 24;
                this.speed = this.max_speed
                this.radius = 100;
                this.health = 8000;
                this.max_health = this.health;
                break;
            case EntityType.PIRANHA:
                this.max_speed = 30;
                this.speed = this.max_speed;
                this.radius = 29;
                this.health = 350;
                this.max_health = this.health;
                break;
        }
    }
}