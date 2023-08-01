"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageEvents = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const MathUtils_1 = require("../math/MathUtils");
const Utils_1 = require("../utils/Utils");
class StorageEvents {
    static takeItemFromChest(packetData_, cn) {
        const chestPlayerId = packetData_[0], chestId = packetData_[1];
        const chest = cn.gameServer.getEntity(chestId);
        if (!chest)
            return;
        if (Utils_1.Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150)
            return;
        const currentContent = chest.data[0];
        if (currentContent[1] <= 0)
            return;
        if (chest.is_locked && !(chest.playerId == cn.sourcePlayer.id || (cn.sourcePlayer.totemFactory && Utils_1.Utils.isContains(cn.sourcePlayer.id, cn.sourcePlayer.totemFactory.data))))
            return;
        if (cn.sourcePlayer.inventory.isInventoryFull(currentContent[0])) {
            return;
        }
        if (currentContent[1] <= 255) {
            cn.sourcePlayer.inventory.addItem(currentContent[0], currentContent[1]);
            currentContent[0] = 1024;
            currentContent[1] = 0;
            return;
        }
        currentContent[1] -= 255;
        cn.sourcePlayer.inventory.addItem(currentContent[0], 255);
    }
    static addItemChest(packetData_, cn) {
        let itemId = packetData_[0], amount = packetData_[1], chestPlayerId = packetData_[2], chestId = packetData_[3];
        if (amount != 1 && amount != 10)
            return;
        const chest = cn.gameServer.getEntity(chestId);
        if (!chest)
            return;
        if (Utils_1.Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150)
            return;
        //const asItem = ItemUtils.getItemById(itemId);
        if (!cn.sourcePlayer.inventory.containsItem(itemId))
            return;
        const currentContent = chest.data[0];
        if (currentContent[1] >= 8000)
            return;
        if (!cn.sourcePlayer.inventory.containsItem(itemId, 1))
            return;
        if (cn.sourcePlayer.inventory.countItem(itemId) < amount)
            amount = cn.sourcePlayer.inventory.countItem(itemId);
        if (currentContent[0] == 1024) {
            currentContent[0] = itemId;
        }
        else if (currentContent[0] != itemId)
            return;
        const cb = MathUtils_1.MathUtils.getItemCountCallback(amount, currentContent[1], 8000);
        currentContent[1] = cb[1];
        cn.sourcePlayer.inventory.removeItem(itemId, cb[0], true);
        if (!cn.sourcePlayer.inventory.containsItem(itemId, 1)) {
            if (cn.sourcePlayer.hat == itemId)
                cn.sourcePlayer.hat = 0;
            if (cn.sourcePlayer.right == itemId)
                cn.sourcePlayer.right = ItemIds_1.ItemIds.HAND;
            if (cn.sourcePlayer.extra == itemId)
                cn.sourcePlayer.extra = 0;
            cn.sourcePlayer.updateInfo();
        }
    }
    static take_rescource_extractor(data, player) {
        let [entityPlayerId, entityId, entityType] = data;
        let _entity = player.gameServer.getEntity(entityId);
        if (!_entity || _entity.data[0][0] <= 0)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, _entity.x, _entity.y) > 200)
            return;
        let item = Utils_1.Utils.getItemInStorage(_entity.type);
        if (item == -1 || player.inventory.isInventoryFull(item))
            return;
        let count = Math.min(255, _entity.data[0][0]);
        _entity.data[0][0] -= count;
        player.inventory.addItem(item, count);
    }
    static add_wood_extractor(data, player) {
        let [amount, entityPlayerId, entityId, entityType] = data;
        if (isNaN(amount) || amount < 0)
            return;
        let _entity = player.gameServer.getEntity(entityId);
        if (!_entity || _entity.data[0][1] >= 255)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, _entity.x, _entity.y) > 200)
            return;
        if (!player.inventory.containsItem(ItemIds_1.ItemIds.WOOD))
            return;
        let itemsIn = player.inventory.countItem(ItemIds_1.ItemIds.WOOD);
        let itemsCount = Math.min(itemsIn, amount);
        let count = MathUtils_1.MathUtils.getItemCountCallback(itemsCount, _entity.data[0][1], 255);
        _entity.data[0][1] = count[1];
        player.inventory.removeItem(ItemIds_1.ItemIds.WOOD, count[0], true);
    }
    static add_wood_oven(data, player) {
        let [amount, entityPlayerId, entityId] = data;
        if (isNaN(amount) || amount < 0)
            return;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity || entity.data[0][0] >= 31)
            return;
        if (!player.inventory.containsItem(ItemIds_1.ItemIds.WOOD) || Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        let itemsIn = player.inventory.countItem(ItemIds_1.ItemIds.WOOD);
        let itemsCount = Math.min(itemsIn, amount);
        let count = MathUtils_1.MathUtils.getItemCountCallback(itemsCount, entity.data[0][0], 31);
        entity.data[0][0] = count[1];
        player.inventory.removeItem(ItemIds_1.ItemIds.WOOD, count[0], true);
    }
    static add_flour_oven(data, player) {
        let [amount, entityPlayerId, entityId] = data;
        if (isNaN(amount) || amount < 0)
            return;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity || entity.data[0][1] >= 31)
            return;
        if (!player.inventory.containsItem(ItemIds_1.ItemIds.FLOUR) || Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        let itemsIn = player.inventory.countItem(ItemIds_1.ItemIds.FLOUR);
        let itemsCount = Math.min(itemsIn, amount);
        let count = MathUtils_1.MathUtils.getItemCountCallback(itemsCount, entity.data[0][1], 31);
        entity.data[0][1] = count[1];
        player.inventory.removeItem(ItemIds_1.ItemIds.FLOUR, count[0], true);
    }
    static take_bread_oven(data, player) {
        let [entityPlayerId, entityId] = data;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity || entity.data[0][2] <= 0)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        if (player.inventory.isInventoryFull(ItemIds_1.ItemIds.BREAD)) {
            return;
        }
        let amount = entity.data[0][2];
        entity.data[0][2] -= amount;
        player.inventory.addItem(ItemIds_1.ItemIds.BREAD, amount);
    }
    static add_wheat_windmill(data, player) {
        let [amount, entityPlayerId, entityId] = data;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity || entity.data[0][1] >= 255)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        let itemsIn = player.inventory.countItem(ItemIds_1.ItemIds.WILD_WHEAT);
        let itemsCount = Math.min(itemsIn, amount);
        let count = MathUtils_1.MathUtils.getItemCountCallback(itemsCount, entity.data[0][1], 255);
        entity.data[0][1] = count[1];
        player.inventory.removeItem(ItemIds_1.ItemIds.WILD_WHEAT, count[0], true);
    }
    static take_flour_windmill(data, player) {
        let [entityPlayerId, entityId] = data;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity || entity.data[0][0] <= 0)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        if (player.inventory.isInventoryFull(ItemIds_1.ItemIds.FLOUR)) {
            return;
        }
        let amount = entity.data[0][0];
        entity.data[0][0] -= amount;
        player.inventory.addItem(ItemIds_1.ItemIds.FLOUR, amount);
    }
    static give_wood_furnace(data, player) {
        let [amount, entityPlayerId, entityId] = data;
        let entity = player.gameServer.getEntity(entityId);
        if (!entity)
            return;
        if (Utils_1.Utils.distanceSqrt(player.x, player.y, entity.x, entity.y) > 200)
            return;
        let count = Math.min(player.inventory.countItem(ItemIds_1.ItemIds.WOOD), amount);
        entity.data[0][0] += count;
        player.inventory.removeItem(ItemIds_1.ItemIds.WOOD, count, true);
    }
}
exports.StorageEvents = StorageEvents;
