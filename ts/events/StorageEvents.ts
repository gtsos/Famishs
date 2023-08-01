import { ItemIds } from "../enums/ItemIds";
import { MathUtils } from "../math/MathUtils";
import { ConnectionPlayer } from "../network/ConnectionPlayer";
import { Utils } from "../utils/Utils";
import { ItemUtils } from "../utils/itemsmanager";
import { Player } from "../entity/Player"
import { EntityType } from "../enums/EntityType"


export class StorageEvents {
    public static takeItemFromChest (packetData_: any, cn: ConnectionPlayer) {
        const chestPlayerId = packetData_[0],
              chestId = packetData_[1];
        
        const chest = cn.gameServer.getEntity(chestId);
        
        if(!chest) return;
        if (Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150) return;
    
        const currentContent = chest.data[0];
    
        if(currentContent[1] <= 0) 
            return;
        
        if(chest.is_locked && !(chest.playerId == cn.sourcePlayer.id || (cn.sourcePlayer.totemFactory && Utils.isContains(cn.sourcePlayer.id, cn.sourcePlayer.totemFactory.data)))) return;
    
        if(cn.sourcePlayer.inventory.isInventoryFull(currentContent[0])) {
            return;
        }

        if(currentContent[1] <= 255) {
            cn.sourcePlayer.inventory.addItem(currentContent[0], currentContent[1]);
            currentContent[0] = 1024;
            currentContent[1] = 0;
            return;
        }
        currentContent[1] -= 255;
    
        cn.sourcePlayer.inventory.addItem(currentContent[0], 255);
        
        
    }

    public static addItemChest (packetData_: any, cn: ConnectionPlayer) {
        let itemId = packetData_[0],
                amount = packetData_[1],
                chestPlayerId = packetData_[2],
                chestId = packetData_[3];
        
        
        if(amount != 1 && amount != 10) return;
        
    
        const chest = cn.gameServer.getEntity(chestId);
    
        if(!chest) return;
        if (Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150) return;
    
        //const asItem = ItemUtils.getItemById(itemId);
    
        if(!cn.sourcePlayer.inventory.containsItem(itemId)) return;
    
        const currentContent = chest.data[0];
    
        if(currentContent[1] >= 8000) return;
        if(!cn.sourcePlayer.inventory.containsItem(itemId, 1)) return;
    
        if(cn.sourcePlayer.inventory.countItem(itemId) < amount) amount = cn.sourcePlayer.inventory.countItem(itemId);
        if(currentContent[0] == 1024) {
            currentContent[0] = itemId;
            
        }else if(currentContent[0] != itemId) return;
    
        const cb = MathUtils.getItemCountCallback(amount, currentContent[1], 8000)
    
        currentContent[1] = cb[1];
    
        cn.sourcePlayer.inventory.removeItem(itemId , cb[0] ,true)
        
        if(!cn.sourcePlayer.inventory.containsItem(itemId, 1)) {
            if(cn.sourcePlayer.hat == itemId) cn.sourcePlayer.hat = 0;
            if(cn.sourcePlayer.right == itemId) cn.sourcePlayer.right = ItemIds.HAND;
            if(cn.sourcePlayer.extra == itemId) cn.sourcePlayer.extra = 0;
    
            cn.sourcePlayer.updateInfo();
        }
    
    }

    public static take_rescource_extractor(data: any, player: Player) {
        let [entityPlayerId, entityId, entityType] = data;

        let _entity = player.gameServer.getEntity(entityId);
        if(!_entity || _entity.data[0][0] <= 0) return;
        if(Utils.distanceSqrt(player.x, player.y, _entity.x, _entity.y) > 200) return;

        let item = Utils.getItemInStorage(_entity.type);
        if(item == -1 || player.inventory.isInventoryFull(item)) return;

        let count = Math.min(255, _entity.data[0][0]);

        _entity.data[0][0] -= count;

        player.inventory.addItem(item, count);
    }

    public static add_wood_extractor(data: any, player: Player) {
        let [amount, entityPlayerId, entityId, entityType] = data;

        if(isNaN(amount) || amount < 0) return;

        let _entity = player.gameServer.getEntity(entityId);
        if(!_entity || _entity.data[0][1] >= 255) return;
        if(Utils.distanceSqrt(player.x, player.y, _entity.x, _entity.y) > 200) return;

        if(!player.inventory.containsItem(ItemIds.WOOD)) return;
        
        let itemsIn = player.inventory.countItem(ItemIds.WOOD);
        let itemsCount = Math.min(itemsIn, amount);

        let count = MathUtils.getItemCountCallback(itemsCount, _entity.data[0][1], 255);
        _entity.data[0][1] = count[1];

        player.inventory.removeItem(ItemIds.WOOD, count[0], true);

    }

    public static add_wood_oven(data: any, player: Player) {
        let [amount, entityPlayerId, entityId] = data;

        if(isNaN(amount) || amount < 0) return;

        let entity = player.gameServer.getEntity(entityId);

        if(!entity || entity.data[0][0] >= 31) return;
        if(!player.inventory.containsItem(ItemIds.WOOD) || Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        let itemsIn = player.inventory.countItem(ItemIds.WOOD);
        let itemsCount = Math.min(itemsIn, amount);

        let count = MathUtils.getItemCountCallback(itemsCount, entity.data[0][0], 31);
        entity.data[0][0] = count[1];

        player.inventory.removeItem(ItemIds.WOOD, count[0], true);
    }

    public static add_flour_oven(data: any, player: Player) {
        let [amount, entityPlayerId, entityId] = data;

        if(isNaN(amount) || amount < 0) return;

        let entity = player.gameServer.getEntity(entityId);
        if(!entity || entity.data[0][1] >= 31) return;
        if(!player.inventory.containsItem(ItemIds.FLOUR) || Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        let itemsIn = player.inventory.countItem(ItemIds.FLOUR);
        let itemsCount = Math.min(itemsIn, amount);

        let count = MathUtils.getItemCountCallback(itemsCount, entity.data[0][1], 31);
        entity.data[0][1] = count[1];

        player.inventory.removeItem(ItemIds.FLOUR, count[0], true);
    }

    public static take_bread_oven(data: any, player: Player) {
        let [entityPlayerId, entityId] = data;


        let entity = player.gameServer.getEntity(entityId);
        if(!entity || entity.data[0][2] <= 0) return;
        if(Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        if(player.inventory.isInventoryFull(ItemIds.BREAD)){
            return;
        }

        let amount = entity.data[0][2];
        entity.data[0][2] -= amount;

        player.inventory.addItem(ItemIds.BREAD, amount);
    }

    public static add_wheat_windmill(data: any, player: Player) {
        let [amount, entityPlayerId, entityId] = data;

        let entity = player.gameServer.getEntity(entityId);
        if(!entity || entity.data[0][1] >= 255) return;
        if(Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        let itemsIn = player.inventory.countItem(ItemIds.WILD_WHEAT);
        let itemsCount = Math.min(itemsIn, amount);

        let count = MathUtils.getItemCountCallback(itemsCount, entity.data[0][1], 255);
        entity.data[0][1] = count[1];

        player.inventory.removeItem(ItemIds.WILD_WHEAT, count[0], true);
    }

    public static take_flour_windmill(data: any, player: Player) {
        let [entityPlayerId, entityId] = data;

        let entity = player.gameServer.getEntity(entityId);
        if(!entity || entity.data[0][0] <= 0) return;
        if(Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        if(player.inventory.isInventoryFull(ItemIds.FLOUR)) {
            return;
        }

        let amount = entity.data[0][0];
        entity.data[0][0] -= amount;

        player.inventory.addItem(ItemIds.FLOUR, amount);
    }

    public static give_wood_furnace(data: any, player: Player) {
        let [amount, entityPlayerId, entityId] = data;

        let entity = player.gameServer.getEntity(entityId);
        if(!entity) return;
        if(Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200) return;

        let count = Math.min(player.inventory.countItem(ItemIds.WOOD), amount);
        entity.data[0][0] += count;

        player.inventory.removeItem(ItemIds.WOOD, count, true);
    }

}
 