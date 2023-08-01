import { Player } from "../entity/Player";
import { ItemIds } from "../enums/ItemIds";
import { ItemMetaType, ItemType, ItemUtils } from "../utils/itemsmanager";
import serverSettings from "../settings/serverconfig.json";
export class ItemAction {

    public sourcePlayer: Player;
    public lastHelmetEquip: number;
    public lastSwordEquip: number;

    constructor(sourcePlayer: Player) {

        
        this.sourcePlayer = sourcePlayer;
        this.lastHelmetEquip = -1;
        this.lastSwordEquip = -1;
    }

    manageAction(itemId: number) {
        let now = +new Date();

        if(itemId == ItemIds.HAND) {
            if(now - this.lastSwordEquip < 10000) return;
            
            this.sourcePlayer.right = ItemIds.HAND;
            this.sourcePlayer.updateInfo();
            return;
         }
       
         const item = ItemUtils.getItemById(itemId);

         
         if(!item) return;

        
         switch(item.type) {
            case ItemType.EQUIPPABLE: {

                if(item.meta_type == ItemMetaType.SWORD) {
                    if(now - this.lastSwordEquip < 10000) return;
            
                    this.lastSwordEquip = now;
                }
                
                switch(item.meta_type) {
                    case ItemMetaType.BOW:
                    case ItemMetaType.SHIELD:
                    case ItemMetaType.WRENCHABLE:
                    case ItemMetaType.SHOVEL:
                    case ItemMetaType.PICKAXE:
                    case ItemMetaType.HAMMER:
                    case ItemMetaType.SWORD: {
                        if(item.meta_type != ItemMetaType.SWORD && now - this.lastSwordEquip < 10000) return;
            
                        this.sourcePlayer.right = item.id;
                        this.sourcePlayer.updateInfo();
                        break;
                    }
                    case ItemMetaType.RIDING: {
                        if(this.sourcePlayer.isFly) return;
                        
                        if(item.id == this.sourcePlayer.extra) {
                            if(this.sourcePlayer.speed > 5) return;
                            this.sourcePlayer.extra = 0;
                            this.sourcePlayer.max_speed = 24;
                            //this.sourcePlayer.ridingType = null;
                            this.sourcePlayer.isFly = false;
                        }else {
                            this.sourcePlayer.extra = item.id;
                            this.sourcePlayer.max_speed = item.data.maxSpeed;
                            this.sourcePlayer.speed = item.data.startSpeed;
                            //this.sourcePlayer.ridingType = (RideType as any)[item.data.rideType.toUpperCase()];

                        }
                        break;
                    }
                    case ItemMetaType.HAT: {
                        if(now - this.lastHelmetEquip < 5000) return;
                
                       if(itemId == this.sourcePlayer.hat) {
                         
                            this.sourcePlayer.hat = 0;
                            this.sourcePlayer.updateInfo();
                
                            return;
                        }

                        this.sourcePlayer.hat = item.id;
                        this.sourcePlayer.updateInfo();

                        if(item.data.withoutCooldown) return;
                        
                        this.lastHelmetEquip = now;
                        break;
                    }
                }

                break;
            }
            case ItemType.FOOD: {
                switch(item.meta_type) {
                    case ItemMetaType.REGENERABLE: {
                        if(this.sourcePlayer.gaugesManager.bandage >= 20) {
                            return;
                        }
                        this.sourcePlayer.inventory.removeItem(itemId , 1);
                        this.sourcePlayer.gaugesManager.bandage += 20;

                        this.sourcePlayer.gaugesManager.bandage = Math.min(20 , this.sourcePlayer.gaugesManager.bandage);
                        
                        this.sourcePlayer.gaugesManager.update();
                        
                        break;
                    }
                    default: {
                        this.sourcePlayer.gaugesManager.food += item.data.value;

                        if(item.data.poison) {
                            this.sourcePlayer.health -= item.data.poison;
                            this.sourcePlayer.updateHealth(null);
                        }
                        if(item.data.water) {
                            this.sourcePlayer.gaugesManager.thirst += item.data.water;
                        }

                        if(itemId == ItemIds.BOTTLE_FULL) {
                            this.sourcePlayer.inventory.addItem(ItemIds.BOTTLE_EMPTY, 1);
                        }

                        this.sourcePlayer.gaugesManager.update();

                        this.sourcePlayer.inventory.removeItem(itemId , 1);
                        break;
                    }
                }
                break;
            }
         }
    }
}
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