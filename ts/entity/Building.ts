import { GameServer } from "../GameServer";
import { Utils } from "../utils/Utils";
import { ItemMetaType, ItemUtils } from "../utils/itemsmanager";
import { Entity } from "./Entity";
import { Player } from "./Player";
import { EntityType } from "../enums/EntityType";
import { BufferWriter } from "../utils/bufferReader";
import { ServerPacketTypeBinary, ServerPacketTypeJson } from "../enums/PacketType";
import { WorldEvents } from "../world/WorldEvents";
import { ItemIds } from "../enums/ItemIds";
import { Action } from "../enums/Action";
import serverConfig from "../settings/serverconfig.json";
import { findCraftByItemId, findCraftIdFromItem } from "../craft/CraftTranslator";

export class Building extends Entity {
    public damageProtection: number = 0;
    public metaData: any = null;
    public metaType: ItemMetaType;
    public itemName: string;

    public data: any;
    public owner: any;

    public isGrown: boolean = false;
    public isDrained: boolean = false;
    public owningPlot: any = null;
    public lastDrain: number = +new Date();
    public fruits: number = 0;
    public maxFruits: number = 0;
    public growBoost: number = 0;
    public fruitItem!: ItemIds;
    
    containsPlant: boolean = false;

    public is_locked: any;

    public lastUpdate: number = -1;
    public ticks: number = 0;

    public factoryOf: string = "building";
    public spawnTime: number = +new Date();
    constructor(
        owner: any,
        id: number,
        ownerId: number,
        gameServer: GameServer,
        damageProtection: number,
        metaData: any = null,
        metaType: ItemMetaType,
        itemName: string
    ) {
        super(id, ownerId, gameServer);

        this.damageProtection = damageProtection;

        this.metaData = metaData;
        this.metaType = metaType;
        this.itemName = itemName;

        this.owner = owner;

        this.containsPlant = false;

        if(this.metaType == ItemMetaType.PLANT) this.info = 10;
    }

    public getInfo() {
        let info = 0;

        if(this.isGrown) info = this.fruits;
        if(this.isDrained) info |= 16;

        this.info = info;
    }

    public setup() {
        switch (this.metaType) {
            case ItemMetaType.TOTEM:
                this.is_locked = false;

                this.data = [];
                this.data.push(this.owner);

                break;
            case ItemMetaType.STORAGE:
                switch (this.type) {
                    case EntityType.CHEST: {
                        this.data = [];

                        this.data.push([1024, 0]);
                        this.is_locked = false;
                        break;
                    }

                    case EntityType.EXTRACTOR_MACHINE_STONE:
                    case EntityType.EXTRACTOR_MACHINE_GOLD:
                    case EntityType.EXTRACTOR_MACHINE_DIAMOND:
                    case EntityType.EXTRACTOR_MACHINE_AMETHYST:
                    case EntityType.EXTRACTOR_MACHINE_REIDITE: 
                    case EntityType.WINDMILL: {
                        
                        this.data = [[0, 0]];
                        break;
                    }

                    case EntityType.BREAD_OVEN: {
                        this.data = [[0, 0, 0]];

                        break;
                    }

                    case EntityType.FURNACE: {
                        this.data = [[0]];
                        break;
                    }
                }
                break;
            case ItemMetaType.PLANT: {

                this.maxFruits = (this.type == EntityType.TOMATO_SEED || this.type == EntityType.SEED) ? 3 : 1;

                this.fruitItem = 
                    this.type == EntityType.WHEAT_SEED ? ItemIds.WILD_WHEAT :
                    this.type == EntityType.CARROT_SEED ? ItemIds.CARROT :
                    this.type == EntityType.GARLIC_SEED ? ItemIds.GARLIC :
                    this.type == EntityType.TOMATO_SEED ? ItemIds.TOMATO :
                    this.type == EntityType.PUMPKIN_SEED ? ItemIds.PUMPKIN :
                    this.type == EntityType.THORNBUSH_SEED ? ItemIds.THORNBUSH :
                    this.type == EntityType.WATERMELON_SEED ? ItemIds.WATERMELON :
                    this.type == EntityType.ALOE_VERA_SEED ? ItemIds.ALOE_VERA : ItemIds.PLANT;
            
                this.health = this.metaData.health;

                break;
            }
        }
    }

    public onEntityUpdate(now: number) {
        // if (
        //     this.type == EntityType.GOLD_SPIKE ||
        //     this.type == EntityType.DIAMOND_SPIKE ||
        //     this.type == EntityType.AMETHYST_SPIKE ||
        //     this.type == EntityType.SPIKE ||
        //     this.type == EntityType.WALL
        // ) {
        //     if (now - this.spawnTime >= 1000 * 60 * 10) {
        //         this.health = 0;
        //         this.updateHealth(null);
        //     }
        // }

        if(this.metaType == ItemMetaType.PLANT) {
            if(now - this.spawnTime > serverConfig.other.plantLifetime) {
                this.health = 0;
                this.updateHealth(null);
            }
        }

        switch (this.metaType) {
            case ItemMetaType.TOTEM: {
                this.info = +this.data.length;
                this.extra = +this.is_locked;

                if (now - this.lastUpdate > 3000) {
                    this.lastUpdate = now;

                    const data = [];
                    for (let i = 0; i < this.data.length; i++) {
                        const player = this.data[i];

                        data.push(player.x);
                        data.push(player.y);
                    } 
    
                    const players = this.data;
                    for (const player of players) {
                        player.controller.sendJSON([ServerPacketTypeJson.Minimap, ...data])
                    }
                }
                break;
            }
            case ItemMetaType.STORAGE: {
                switch(this.type) {
                    case EntityType.CHEST: {
                        const item = this.data[0][0];
                        const amount = this.data[0][1];
        
                        this.extra = item ?? 0;
                        this.info = (amount ?? 0) + (this.is_locked ? 8192 : 0);
                        break;
                    }

                    case EntityType.EXTRACTOR_MACHINE_STONE:
                    case EntityType.EXTRACTOR_MACHINE_GOLD:
                    case EntityType.EXTRACTOR_MACHINE_DIAMOND:
                    case EntityType.EXTRACTOR_MACHINE_AMETHYST:
                    case EntityType.EXTRACTOR_MACHINE_REIDITE:
                    case EntityType.WINDMILL: {

                        if(now - this.lastUpdate > 10000) {
                            this.lastUpdate = now;

                            let amountIn = this.data[0][1];
                            if(amountIn <= 0 || this.data[0][0] >= 255) return; 

                            amountIn -= (this.type == EntityType.WINDMILL ? 1 : 2);
                            this.data[0][1] = Math.max(0, amountIn);

                            this.data[0][0] += 1;
                        }
    
                        this.extra = +this.data[0][0];
                        this.info = +this.data[0][1];
                        break;
                    }

                    case EntityType.BREAD_OVEN: {

                        if(now - this.lastUpdate > 10000) {
                            this.lastUpdate = now;

                            if(this.data[0][0] <= 0 || this.data[0][1] <= 0 || this.data[0][2] >= 31) return;

                            this.data[0][0] -= 1;
                            this.data[0][1] -= 1;

                            this.data[0][2] += 1;
                        }
                
                        let woodIn = +this.data[0][0];
                        let flourIn = +this.data[0][1];
                        let breadIn = +this.data[0][2];

                        this.info = (woodIn | (flourIn << 5) | (breadIn << 10));

                        break;
                    }

                    case EntityType.FURNACE: {

                        if (now - this.lastUpdate > 5000) {
                            this.lastUpdate = now;

                            let amountIn = this.data[0][0];
                            if(amountIn <= 0) {
                                return;
                            }

                            amountIn -= 1;
                            this.data[0][0] = amountIn;
                        }

                        this.info = +this.data[0][0];
                        break;
                    }
                }
            }

            case ItemMetaType.FIRE: {
                if(now - this.spawnTime > this.metaData.aliveTime) {
                    this.health = 0;
                    this.updateHealth(null);
                }
                break;
            }

            case ItemMetaType.PLANT: {

                let growDecrease = (this.owningPlot ? 1.5 : 1)+ this.growBoost;

                if(!this.isGrown) {
                    if(now - this.spawnTime > this.metaData.born_time / growDecrease) {
                        this.isGrown = true;
                        this.lastUpdate = now;
                        this.lastDrain = now;
                    }
                    return;
                }

                if(!this.isDrained && now - this.lastUpdate > this.metaData.grow_time / growDecrease) {
                    this.lastUpdate = now;

                    if(this.maxFruits > this.fruits) {
                        this.fruits++;

                        if(!this.isSolid && (this.type == EntityType.TOMATO_SEED ||
                            this.type == EntityType.THORNBUSH_SEED ||
                            this.type == EntityType.CARROT_SEED ||
                            this.type == EntityType.GARLIC_SEED ||
                            this.type == EntityType.PUMPKIN_SEED ||
                            this.type == EntityType.WATERMELON_SEED)
                        ) this.isSolid = true;

                    }
                }

                let drainIncrease = this.owningPlot ? 1.6 : 1;
                if(!this.isDrained && now - this.lastDrain > this.metaData.drain_time * drainIncrease) {
                    this.isDrained = true;//
                }

                this.getInfo();

                break;
            }
        }
    }

    public onDead(damager: any) {
        if (this.type == EntityType.TOTEM) {
            WorldEvents.onTotemBreak(this);
        }

        if(this.metaType == ItemMetaType.PLANT && this.owningPlot) {
            this.owningPlot.containsPlant = false;
        }

        if(damager && damager.type == EntityType.PLAYERS) {
            let craftId = findCraftByItemId((ItemIds as any)[this.ownerClass.itemName.toUpperCase()]);
            let craftItem = this.gameServer.crafts.find(c => craftId == findCraftIdFromItem((c.itemName)));
    
            if(craftItem) {
                let recipes = craftItem.recipe;
    
                for (let i = 0; i < recipes.length; i++) {
                    let item = recipes[i];
    
                    let itemId: any = ItemIds[item[0].toUpperCase()];
                    let count = ~~Math.max(0, item[1] * .6);
    
                    if(!count) continue;
    
                    damager.inventory.addItem(itemId, count);
                }
            }
        }
    }

    public onCollides(entityCollides: Entity) {}

    public onHitReceive(damager: Player) {
        if(this.metaType == ItemMetaType.PLANT) {

            if(damager.right == ItemIds.WATERING_CAN_FULL && this.isGrown) {
                this.lastDrain = +new Date();
                this.isDrained = false;
                this.getInfo();
            }

            if(this.fruits <= 0) return;

            if(this.type == EntityType.THORNBUSH_SEED &&
                (damager.right != ItemIds.PITCHFORK && 
                damager.right != ItemIds.PITCHFORK2 ||
                damager.inventory.isInventoryFull(this.fruitItem))
             ) {
                if(!(damager.playerId == this.owner.playerId ||
                    this.owner.totemFactory && Utils.isContains(damager.playerId, this.owner.totemFactory.data))) {

                        damager.health -= 20;
                        damager.action |= Action.HURT;
                        damager.gaugesManager.update();
                        damager.updateHealth(null);
                    }
             }

            if(damager.inventory.isInventoryFull(this.fruitItem) || damager.right == ItemIds.WATERING_CAN_FULL) return;

            this.fruits--;            
            this.getInfo();

            if(this.fruits <= 0 && 
                (this.type == EntityType.TOMATO_SEED ||
                this.type == EntityType.THORNBUSH_SEED ||
                this.type == EntityType.CARROT_SEED ||
                this.type == EntityType.GARLIC_SEED ||
                this.type == EntityType.WATERMELON_SEED ||
                this.type == EntityType.PUMPKIN_SEED)
            ) this.isSolid = false;
            
            let toGive = 
                damager.right == ItemIds.PITCHFORK ? 2 : 
                damager.right == ItemIds.PITCHFORK2 ? 3 : 1;
                
            damager.inventory.addItem(this.fruitItem, toGive);

            damager.gameProfile.score += this.metaData.score_give ?? 0;
            return;
        }

        if (
            this.metaType == ItemMetaType.DOOR ||
            this.metaType == ItemMetaType.SPIKED_DOOR
        ) {
            const damagerItem = ItemUtils.getItemById(damager.right);

            if (
                damagerItem != null &&
                damagerItem.meta_type == ItemMetaType.WRENCHABLE
            ) {
            } else {
                if (
                    damager.id == this.playerId ||
                    (damager.totemFactory &&
                        Utils.isContains(
                            this.playerId,
                            damager.totemFactory.data
                        ))
                ) {
                    let counter = 0;

                    if (this.extra) {
                        const queryEntities = this.gameServer.queryManager.queryCircle(
                                this.x,
                                this.y,
                                this.radius - 3
                            );

                        for (let i = 0; i < queryEntities.length; i++) {
                            if (queryEntities[i].isSolid || queryEntities[i].type == EntityType.PLAYERS)
                                counter++;
                        }
                        if (counter == 0) this.extra = 0;
                    } else this.extra = 1;

                    if (this.extra) {
                        if (counter == 0) this.isSolid = false;
                    } else {
                        this.isSolid = true;
                    }
                }
            }
        }

        if (this.metaData.hitDamage != null && this.playerId != damager.id) {
            if (this.metaType == ItemMetaType.SPIKED_DOOR && !this.isSolid)
                return;

            if (
                damager.totemFactory &&
                Utils.isContains(this.playerId, damager.totemFactory.data)
            )
                return;

            const now = +new Date();
            if (now - damager.lastHittenBuildDamager > 250) {
                damager.health -= this.metaData.hitDamage ?? 1;
                damager.action |= Action.HURT;
                damager.gaugesManager.update();
                damager.updateHealth(null);
                damager.lastHittenBuildDamager = now;
            }
        }
    }
}
