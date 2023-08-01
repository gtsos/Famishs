
import { ItemIds } from "../enums/ItemIds";
import { ConnectionPlayer } from "../network/ConnectionPlayer";
import { Utils } from "../utils/Utils";

export class BuildActionEvents {
    public static lockChest(chestId: number, cn: ConnectionPlayer) {
        const chest = cn.gameServer.getEntity(chestId);

        if(!chest || chest.is_locked) return;

        if (Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150) return;

        if(!cn.sourcePlayer.inventory.containsItem(ItemIds.LOCK, 1)) 
            return;

        if(chest.playerId == cn.sourcePlayer.playerId) {
            chest.is_locked = true;
            cn.sourcePlayer.inventory.removeItem(ItemIds.LOCK, 1);
        }
        
    }
    public static unlockChest (chestId: number , cn: ConnectionPlayer) {
        const chest = cn.gameServer.getEntity(chestId);

        if(!chest || !chest.is_locked) return;
        if (Utils.distanceSqrt(cn.sourcePlayer.x, cn.sourcePlayer.y, chest.x, chest.y) > 150) return;

        if(!cn.sourcePlayer.inventory.containsItem(ItemIds.LOCKPICK, 1)) 
            return;
            
        chest.is_locked = false;
      
        cn.sourcePlayer.inventory.removeItem(ItemIds.LOCKPICK, 1);
    }
}