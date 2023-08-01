"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildActionEvents = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const Utils_1 = require("../utils/Utils");
class BuildActionEvents {
    static lockChest(chestId, cn) {
        const chest = cn.gameServer.getEntity(chestId);
        if (!chest || chest.is_locked)
            return;
        if (Utils_1.Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150)
            return;
        if (!cn.sourcePlayer.inventory.containsItem(ItemIds_1.ItemIds.LOCK, 1))
            return;
        if (chest.playerId == cn.sourcePlayer.playerId) {
            chest.is_locked = true;
            cn.sourcePlayer.inventory.removeItem(ItemIds_1.ItemIds.LOCK, 1);
        }
    }
    static unlockChest(chestId, cn) {
        const chest = cn.gameServer.getEntity(chestId);
        if (!chest || !chest.is_locked)
            return;
        if (Utils_1.Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150)
            return;
        if (!cn.sourcePlayer.inventory.containsItem(ItemIds_1.ItemIds.LOCKPICK, 1))
            return;
        chest.is_locked = false;
        cn.sourcePlayer.inventory.removeItem(ItemIds_1.ItemIds.LOCKPICK, 1);
    }
}
exports.BuildActionEvents = BuildActionEvents;
