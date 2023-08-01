import { Action } from "../enums/Action";
import { EntityType } from "../enums/EntityType";
import { ItemIds } from "../enums/ItemIds";
import { ObjectType } from "../enums/ObjectType";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { CollideResult } from "../exec/CollideResolver";
import { GameServer } from "../GameServer";
import { CollisionUtils } from "../math/CollisionUtils";
import Vector2D from "../math/Vector2D";
import serverSettings from "../settings/serverconfig.json";
import { BufferWriter } from "../utils/bufferReader";
import { EntityAbstractType } from "../utils/EntityUtils";
import { ItemMetaType, ItemType, ItemUtils } from "../utils/itemsmanager";
import { Utils } from "../utils/Utils";
import { WorldEvents } from "../world/WorldEvents";
import { Animal } from "./Animal";
import { MapObject } from "./MapObject";
import { Player } from "./Player";
import { resolveKill } from "../exec/PvPTime"
import { CYCLE } from "../world/WorldCycle";
import { WorldBiomeResolver } from "../world/WorldBiomeResolver";
import { Biomes } from "../enums/Biomes";
import { Building } from "./Building";
import { getItemByChance } from "../exec/ItemByChance";
import { QuestType } from "../enums/QuestType";


export class Entity {

    public spawnTime: number = +new Date();

    public id: number;
    public playerId: number = 0;
    public x: number = 2500;
    public y: number = 2500;
    public radius: number = 30;
    public angle: number = 0;

    public extra: number = 0;
    public speed: number = 24;
    public max_speed: number = 24;
    public action: number = 0;

    public info: number = 0;
    public type: EntityType = 0;
    public gameServer: GameServer;

    public direction: number = 0;

    public oldX: number = 0;
    public oldY: number = 0;
    public health: number = 200;
    public max_health: number = 200;
    public old_health: number = 200;
    public old_speed: number = 24;
    public isSolid: boolean = true;
    public collideSpeed: number = 1;
    public collidesRiver: boolean = false;
    public ownerClass: any;
    public abstractType: EntityAbstractType = EntityAbstractType.DEFAULT;
    public isDestroyed: boolean = false;
    public god: boolean = false;
    public oldDirection: number = -1;
    public isFly: boolean = false;
    public vector: Vector2D = new Vector2D(0,0);
    public collideCounter: number = 0;
    
    public dist_winter = -1000000;
    public dist_dragon = -1000000;
    public dist_forest = -1000000;
    public dist_sand = -1000000;
    public dist_desert = -1000000;
    public dist_lava= -1000000;
    public dist_water = -1000000;
    public biomeIn: Biomes = Biomes.SEA;



    public constructor (id: number, playerId: number, gameServer: GameServer) {
        this.id = id;
        this.playerId = playerId;
        this.gameServer = gameServer;
    }

    public initEntityData (x: number , y: number , angle: number, type: EntityType, isSolid: boolean = true) {
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.type = type;
        this.isSolid = isSolid;

       
    }
    public initOwner( owner: any) {
        this.ownerClass = owner;

    }

    public isCollides(x: number = this.x, y: number = this.y, radius: number = this.radius) {
        const entities = this.gameServer.queryManager.queryCircle(x, y, radius);

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];

            if (entity.id != this.id && entity.isSolid) return true;
        }

        return false;
    }
    
    public receiveHit (damager: Entity | Animal | Player | Building, damage: number = -1) {

        if(this.isDestroyed || this.god) return;

        let finalDamage = damage;

        let imt = null;

        if(damager instanceof Player) {

            if(this.type == EntityType.PLAYERS) {
                
                if(
                    damager.right == ItemIds.HAND && damager.hat == ItemIds.HOOD && 
                    !this.ownerClass.isInFire && (this.ownerClass.hat != ItemIds.PEASANT && this.ownerClass.hat != ItemIds.WINTER_PEASANT) &&
                    this.gameServer.worldCycle.cycle == CYCLE.DAY &&
                    +new Date() - damager.lastHoodCooldown > 8000
                ) {
                    let itemsArray = this.ownerClass.inventory.toArray();
                    let randomItem = itemsArray[~~(Math.random() * itemsArray.length)];

                    let item = randomItem[0];
                    let count = Math.min(255, randomItem[1]);
                    
                    this.ownerClass.inventory.removeItem(item, count);

                    damager.inventory.addItem(item, count);
                    damager.lastHoodCooldown = +new Date();
                }
            }

            const itemInHand = ItemUtils.getItemById((damager as Player).right);
            imt = itemInHand;

            if(itemInHand != null && itemInHand.meta_type != ItemMetaType.WRENCHABLE) {
                if(itemInHand.type == ItemType.EQUIPPABLE) {
    
                    if(Utils.isBuilding(this)) {
                        finalDamage = Math.max(0 , itemInHand.data.building_damage - this.ownerClass.damageProtection);
                        this.ownerClass.onHitReceive(damager);
        
                    }else finalDamage = itemInHand.data.damage;
                }else {
                    if(Utils.isBuilding(this)) {
                        finalDamage = Math.max(0 , 2 - this.ownerClass.damageProtection);
                        this.ownerClass.onHitReceive(damager);
    
                    }
                    else finalDamage = 5;
                }
            }

            if(this.type == EntityType.PLAYERS) {
                if(this.ownerClass.hat != 0) {
                    const hatItem = ItemUtils.getItemById(this.ownerClass.hat);
                    const protectionSuffler = hatItem.data.protection;
    
                    finalDamage -= protectionSuffler;
                }
                if(this.ownerClass.right != 0) {
                    const rightItem = ItemUtils.getItemById(this.ownerClass.right);
    
                    if(rightItem != null && rightItem.meta_type == ItemMetaType.SHIELD) {
                        const protectionSuffler = rightItem.data.protection ?? 0;
    
                        finalDamage -= protectionSuffler;
                    }
                }
            }
            
        }

        if(Utils.isMob(damager)) {
            if(this.type == EntityType.PLAYERS) {
                if(this.ownerClass.hat != 0) {
                    const hatItem = ItemUtils.getItemById(this.ownerClass.hat);
                    const protectionSuffler = hatItem.data.animal_protection ?? 9;
    
                    finalDamage -= protectionSuffler;
                }
                if(this.ownerClass.right != 0) {
                    const rightItem = ItemUtils.getItemById(this.ownerClass.right);
    
                    if(rightItem != null && rightItem.meta_type == ItemMetaType.SHIELD) {
                        const protectionSuffler = rightItem.data.protection;
    
                        finalDamage -= protectionSuffler;
                    }
                }
            }
        }

         if (this.type == EntityType.PLAYERS && damager instanceof Player && 
             damager.totemFactory && Utils.isContains(this.id, damager.totemFactory.data)) {
             finalDamage = ~~(finalDamage / 6);
         };

        if(imt != null && imt.meta_type == ItemMetaType.WRENCHABLE && Utils.isBuilding(this) && this.ownerClass.metaData.healthSendable){
            finalDamage = -(imt.data.building_damage as any);
        }
        else finalDamage = Math.max(0, finalDamage);

        this.action |= Action.HURT;
        this.health = Math.max(0 , Math.min(this.max_health , this.health - finalDamage));
           
        switch(this.type) {
            
            case EntityType.PLAYERS: {
                
                this.ownerClass.gaugesManager.healthUpdate();
                this.ownerClass.lastHoodCooldown = +new Date();

                break;
            }

        }

        if(this.ownerClass != null && this.ownerClass.factoryOf && this.ownerClass.factoryOf == "building") {
            if(this.ownerClass.metaData.healthSendable) {
                this.info = Utils.InMap(this.health , 0 , this.max_health , 0 , 100);
            }
            
            const data = new BufferWriter(8);
            data.writeUInt16(ServerPacketTypeBinary.HittenOther);
            data.writeUInt16(this.id);
            data.writeUInt16(this.playerId);
            data.writeUInt16(damager.angle);

            const playersArr = this.gameServer.queryManager.queryRectPlayers(this.x , this.y , 2560 , 1440);

            for(let i = 0; i < playersArr.length; i++) {
                const player_ = playersArr[i];

                player_.controller.sendBinary(data.toBuffer());
            }

            
        }

        if (this.type == EntityType.BOAR || 
            this.type == EntityType.BABY_DRAGON ||
            this.type == EntityType.LAVA_DRAGON ||
            this.type == EntityType.HAWK) 
            this.info = 1;

        this.updateHealth(damager);
      
    }
    public updateHealth (damager: any) {

        if (this.type == EntityType.PLAYERS) {
            if (this.health != this.max_health && !this.ownerClass.questManager.checkQuestState(QuestType.GREEN_CROWN)) {
                this.ownerClass.questManager.failQuest(QuestType.GREEN_CROWN);
            } 
        }

        if(this.god) return;
        
        if(this.health <= 0) {            
            if (Utils.isBox(this) || Utils.isBuilding(this)) {
                this.ownerClass.onDead(damager);

                if(this.type == EntityType.EMERALD_MACHINE) {
                    this.ownerClass.owner.health = 0;
                    this.ownerClass.owner.updateHealth(null);

                    if(damager && damager.type == EntityType.PLAYERS) {
                        if(damager.playerId != this.playerId) {
                            damager.gameProfile.score += (~~(this.ownerClass.owner.gameProfile.score / 5));
                        }
                    }
                }
            }

            if(this.type == EntityType.TREASURE_CHEST) {
                let itemByChance = getItemByChance(damager);
                let itemId = ItemIds[itemByChance];

                damager.inventory.addItem(itemId, 1);
                damager.gameProfile.score += 400;

                let killed = damager.stateManager.killedEntities[this.type]++;
                if (killed >= 5 && !damager.questManager.checkQuestState(QuestType.ORANGE_CROWN)) {
                    damager.questManager.succedQuest(QuestType.ORANGE_CROWN);
                }
            }

            if(Utils.isMob(this)) {
                if(damager && damager.type == EntityType.PLAYERS) {
                    let scoreGive = this.ownerClass.entitySettings.give_score ?? 0;
                    damager.gameProfile.score += scoreGive;
                }
            }
             
             if(this.type == EntityType.PLAYERS) {
                if(damager && damager.type == EntityType.PLAYERS) {
                   // damager.gameProfile.kills++;

                   // this.gameServer.eventManager.onKill(damager as Player, this.ownerClass as Player);
                    //resolveKill(damager as Player, this.ownerClass as Player)
                

                    damager.gameProfile.kills++;
                    damager.gameProfile.score += (~~(this.ownerClass.gameProfile.score / 5));
                }
                
                WorldEvents.playerDied(this.gameServer , this.ownerClass);
             }else {
                WorldEvents.entityDied(this.gameServer , this);
             }
 
             this.isDestroyed = true;

             switch(this.type) {
                 case EntityType.WOLF:
                     this.gameServer.worldSpawner.wolfs--;
                     break;
                 case EntityType.SPIDER:
                     this.gameServer.worldSpawner.spiders--;
                     break;
                 case EntityType.RABBIT:
                     this.gameServer.worldSpawner.rabbits--;
                     break;
                 case EntityType.BOAR:
                     this.gameServer.worldSpawner.boars--;
                     break;
                case EntityType.TREASURE_CHEST:
                    this.gameServer.worldSpawner.treasure--;
                    break;
             };

         }
    }
    public updateBefore () {

        if(this.action & Action.HURT) this.action &= ~Action.HURT;
        if(this.action & Action.COLD) this.action &= ~Action.COLD;
        if(this.action & Action.HEAL) this.action &= ~Action.HEAL;
        if(this.action & Action.HUNGER) this.action &= ~Action.HUNGER;
        if(this.action & Action.WEB) this.action &= ~Action.WEB;
    }
    public lerp (start: number, end: number, amt: number) {
        return (1-amt)*start+amt*end
    }
    public updateSpeed () {
        this.speed = Math.max(1, this.speed);
    }

    public update () {

        if(this.oldX != this.x) this.oldX = this.x;
        if(this.oldY != this.y) this.oldY = this.y;

        if (this.ownerClass) this.ownerClass.onEntityUpdate(+new Date());
        if (Utils.isPlayer(this)) {
            this.ownerClass.tickUpdate();
        }

        if (Utils.isPlayer(this) && !this.ownerClass.isStunned) {
            
           
            if(this.vector.x != 0 || this.vector.y != 0) {
                this.ownerClass.updateStun();

                this.x += this.vector.x;
                this.y += this.vector.y;
                
                CollisionUtils.scheduleCollision(this);
            }
        }

        if(this.oldX != this.x || this.oldY != this.y) {
            WorldBiomeResolver.update_dist_in_biomes(this);
            this.biomeIn = WorldBiomeResolver.get_biome_id(this);
        }
        this.updateBounds();
        this.updateSpeed();
    }

    public updateBounds () {
        const map = {
            maxx: serverSettings.world.Width - 15,
            maxy: serverSettings.world.Height - 15,
            minx: 15,
            miny: 15 
        }

        // if (this.type === EntityType.WOLF || this.type === EntityType.RABBIT || this.type === EntityType.SPIDER) {
        //    map.maxx -= 300;
        //    map.maxy -= 300;

        //    map.minx += 300;
        //    map.miny += 300;
        // }
        
        this.x = ~~Math.min(map.maxx , Math.max(map.minx, this.x));
        this.y = ~~Math.min(map.maxy, Math.max(map.miny , this.y));
        
    }
  
} 