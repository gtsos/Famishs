"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemAction = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const itemsmanager_1 = require("../utils/itemsmanager");
class ItemAction {
    sourcePlayer;
    lastHelmetEquip;
    lastSwordEquip;
    constructor(sourcePlayer) {
        this.sourcePlayer = sourcePlayer;
        this.lastHelmetEquip = -1;
        this.lastSwordEquip = -1;
    }
    manageAction(itemId) {
        let now = +new Date();
        if (itemId == ItemIds_1.ItemIds.HAND) {
            if (now - this.lastSwordEquip < 10000)
                return;
            this.sourcePlayer.right = ItemIds_1.ItemIds.HAND;
            this.sourcePlayer.updateInfo();
            return;
        }
        const item = itemsmanager_1.ItemUtils.getItemById(itemId);
        if (!item)
            return;
        switch (item.type) {
            case itemsmanager_1.ItemType.EQUIPPABLE: {
                if (item.meta_type == itemsmanager_1.ItemMetaType.SWORD) {
                    if (now - this.lastSwordEquip < 10000)
                        return;
                    this.lastSwordEquip = now;
                }
                switch (item.meta_type) {
                    case itemsmanager_1.ItemMetaType.BOW:
                    case itemsmanager_1.ItemMetaType.SHIELD:
                    case itemsmanager_1.ItemMetaType.WRENCHABLE:
                    case itemsmanager_1.ItemMetaType.SHOVEL:
                    case itemsmanager_1.ItemMetaType.PICKAXE:
                    case itemsmanager_1.ItemMetaType.HAMMER:
                    case itemsmanager_1.ItemMetaType.SWORD: {
                        if (item.meta_type != itemsmanager_1.ItemMetaType.SWORD && now - this.lastSwordEquip < 10000)
                            return;
                        this.sourcePlayer.right = item.id;
                        this.sourcePlayer.updateInfo();
                        break;
                    }
                    case itemsmanager_1.ItemMetaType.RIDING: {
                        if (this.sourcePlayer.isFly)
                            return;
                        if (item.id == this.sourcePlayer.extra) {
                            if (this.sourcePlayer.speed > 5)
                                return;
                            this.sourcePlayer.extra = 0;
                            this.sourcePlayer.max_speed = 24;
                            //this.sourcePlayer.ridingType = null;
                            this.sourcePlayer.isFly = false;
                        }
                        else {
                            this.sourcePlayer.extra = item.id;
                            this.sourcePlayer.max_speed = item.data.maxSpeed;
                            this.sourcePlayer.speed = item.data.startSpeed;
                            //this.sourcePlayer.ridingType = (RideType as any)[item.data.rideType.toUpperCase()];
                        }
                        break;
                    }
                    case itemsmanager_1.ItemMetaType.HAT: {
                        if (now - this.lastHelmetEquip < 5000)
                            return;
                        if (itemId == this.sourcePlayer.hat) {
                            this.sourcePlayer.hat = 0;
                            this.sourcePlayer.updateInfo();
                            return;
                        }
                        this.sourcePlayer.hat = item.id;
                        this.sourcePlayer.updateInfo();
                        if (item.data.withoutCooldown)
                            return;
                        this.lastHelmetEquip = now;
                        break;
                    }
                }
                break;
            }
            case itemsmanager_1.ItemType.FOOD: {
                switch (item.meta_type) {
                    case itemsmanager_1.ItemMetaType.REGENERABLE: {
                        if (this.sourcePlayer.gaugesManager.bandage >= 20) {
                            return;
                        }
                        this.sourcePlayer.inventory.removeItem(itemId, 1);
                        this.sourcePlayer.gaugesManager.bandage += 20;
                        this.sourcePlayer.gaugesManager.bandage = Math.min(20, this.sourcePlayer.gaugesManager.bandage);
                        this.sourcePlayer.gaugesManager.update();
                        break;
                    }
                    default: {
                        this.sourcePlayer.gaugesManager.food += item.data.value;
                        if (item.data.poison) {
                            this.sourcePlayer.health -= item.data.poison;
                            this.sourcePlayer.updateHealth(null);
                        }
                        if (item.data.water) {
                            this.sourcePlayer.gaugesManager.thirst += item.data.water;
                        }
                        if (itemId == ItemIds_1.ItemIds.BOTTLE_FULL) {
                            this.sourcePlayer.inventory.addItem(ItemIds_1.ItemIds.BOTTLE_EMPTY, 1);
                        }
                        this.sourcePlayer.gaugesManager.update();
                        this.sourcePlayer.inventory.removeItem(itemId, 1);
                        break;
                    }
                }
                break;
            }
        }
    }
}
exports.ItemAction = ItemAction;
/**
 * if(g_mode || entityMeta.id == EntityType.PLOT || entityMeta.id == EntityType.ROOF) {
            angle = Math.PI / 2;
            var sx = Math.floor(Math.cos(build_angle) * 145 + this.player.entity.x) ,
                sy = Math.floor(Math.sin(build_angle) * 145 + this.player.entity.y);

                sx = ((sx - (sx % 100))) + 50
                sy = ((sy - (sy % 100))) + 50
        }else {
            var sx = Math.cos(this.player.entity.angle) * 145 + this.player.entity.x ,
                sy = Math.sin(this.player.entity.angle) * 145 + this.player.entity.y;
        }
 */ 
