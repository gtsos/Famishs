import { Player } from "../entity/Player";
import { ItemIds } from "../enums/ItemIds";
import { ObjectType } from "../enums/ObjectType";
import { Items } from "./itemsmanager";

export class ResourceUtils {
    public static getLimitResources(type: ObjectType, size: number = 0):number {
        switch(type) {
            case ObjectType.TREE: return size == 2 ? 75 : size == 1 ? 60 : 45;
            case ObjectType.STONE: return size == 2 ? 50 : size == 1 ? 40 : 25;
            case ObjectType.GOLD: return size == 2 ? 40 : size == 1 ? 25 : 15;
            case ObjectType.DIAMOND: return size == 2 ? 30 : size == 1 ? 20 : 10;
            case ObjectType.AMETHYST: return size == 2 ? 30 : size == 1 ? 15 : 8;
            case ObjectType.REIDITE: return size == 2 ? 20 : size == 1 ? 10 : 5;
            case ObjectType.EMERALD: return size == 2 ? 15 : size == 1 ? 10 : 5;
            case ObjectType.PALM: return 40;
            case ObjectType.BERRY_BUSH: return 5;
            case ObjectType.CAVE_STONE: return 0;
            case ObjectType.RIVER: return 50;
        }
        return 30;
    }
    public static getRandomAddMaxMin(type: ObjectType, size: number = 0): number[] {
        switch(type) {
            case ObjectType.TREE: return size == 2 ? [2,6]: size == 1 ? [3,5] : [2,4];
            case ObjectType.STONE: return size == 2 ? [2,4]: size == 1 ? [2,3] : [1,3];
            case ObjectType.GOLD: return size == 2 ? [2,4]: size == 1 ? [2,3] : [1,3];
            case ObjectType.DIAMOND: return size == 2 ? [2,4]: size == 1 ? [2,3] : [1,3];
            case ObjectType.AMETHYST: return size == 2 ? [2,4]: size == 1 ? [2,3] : [1,3];
            case ObjectType.REIDITE: return size == 2 ? [1,3]: size == 1 ? [1,2] : [1,1];
            case ObjectType.EMERALD: return size == 2 ? [2,3]: size == 1 ? [1,2] : [1,1];
            case ObjectType.PALM: return [1,4];
            case ObjectType.BERRY_BUSH: return [1,1];
            case ObjectType.CAVE_STONE: return [0,0];
            case ObjectType.RIVER: return [0,0];
        }
        return [1,3];
    }

    public static getResourceItem(type: ObjectType) {
        switch(type) {
            case ObjectType.TREE: return Items["WOOD"].id;
            case ObjectType.STONE: return Items["STONE"].id;
            case ObjectType.GOLD: return Items["GOLD"].id;
            case ObjectType.DIAMOND: return Items["DIAMOND"].id;
            case ObjectType.AMETHYST: return Items["AMETHYST"].id;
            case ObjectType.REIDITE: return Items["REIDITE"].id;
            case ObjectType.EMERALD: return Items["EMERALD"].id;
            case ObjectType.CACTUS: return Items["CACTUS"].id;
            case ObjectType.BERRY_BUSH: return Items["PLANT"].id;
            case ObjectType.PALM: return Items["WOOD"].id;
            case ObjectType.RIVER: return null;
            default: return null;
        }
    }
    public static readScoreFrom(type: ObjectType) {
        switch(type) {
            case ObjectType.PALM: return 2;
            case ObjectType.TREE: return 2;
            case ObjectType.STONE: return 4;
            case ObjectType.GOLD: return 6;
            case ObjectType.DIAMOND: return 12;
            case ObjectType.AMETHYST: return 14;
            case ObjectType.REIDITE: return 25;
            case ObjectType.EMERALD: return 30;
            case ObjectType.BERRY_BUSH: return 1;
            case ObjectType.CACTUS: return 1;
            default: return 1;
        }
    }
    public static readShouldMine(objectType: ObjectType , player: Player): number {

        
        switch(objectType) {
            case ObjectType.TREE:
            case ObjectType.PALM:
                switch(player.right) {
                    case ItemIds.HAND: return 1;
                    case ItemIds.PICK_WOOD: return 2;
                    case ItemIds.PICK: return 3;
                    case ItemIds.PICK_GOLD: return 4;
                    case ItemIds.PICK_DIAMOND: return 5;
                    case ItemIds.PICK_AMETHYST: return 6;
                    case ItemIds.PICK_REIDITE: return 7;
                }
            break;
            case ObjectType.STONE:
                switch(player.right) {
                    case ItemIds.HAND: return -1;
                    case ItemIds.PICK_WOOD: return 1;
                    case ItemIds.PICK: return 2;
                    case ItemIds.PICK_GOLD: return 3;
                    case ItemIds.PICK_DIAMOND: return 4;
                    case ItemIds.PICK_AMETHYST: return 5;
                    case ItemIds.PICK_REIDITE: return 6;
                }
            break;
            case ObjectType.GOLD:
                switch(player.right) {
                    case ItemIds.HAND: return -1;
                    case ItemIds.PICK_WOOD: return -1;
                    case ItemIds.PICK: return 1;
                    case ItemIds.PICK_GOLD: return 2;
                    case ItemIds.PICK_DIAMOND: return 3;
                    case ItemIds.PICK_AMETHYST: return 4;
                    case ItemIds.PICK_REIDITE: return 5;
                }
            break;
            case ObjectType.DIAMOND:
            
                switch(player.right) {
                    case ItemIds.HAND: return -1;
                    case ItemIds.PICK_WOOD: return -1;
                    case ItemIds.PICK: return -1;
                    case ItemIds.PICK_GOLD: return 1;
                    case ItemIds.PICK_DIAMOND: return 2;
                    case ItemIds.PICK_AMETHYST: return 3;
                    case ItemIds.PICK_REIDITE: return 4;
                }
            break;
            case ObjectType.AMETHYST:
                switch(player.right) {
                    case ItemIds.HAND: return -1;
                    case ItemIds.PICK_WOOD: return -1;
                    case ItemIds.PICK: return -1;
                    case ItemIds.PICK_GOLD: return -1;
                    case ItemIds.PICK_DIAMOND: return 1;
                    case ItemIds.PICK_AMETHYST: return 2;
                    case ItemIds.PICK_REIDITE: return 3;
                }
            break;
            case ObjectType.BERRY_BUSH:
            case ObjectType.CACTUS: return 1;

            case ObjectType.EMERALD:
            case ObjectType.REIDITE:
                switch(player.right) {
                    case ItemIds.HAND: return -1;
                    case ItemIds.PICK_WOOD: return -1;
                    case ItemIds.PICK: return -1;
                    case ItemIds.PICK_GOLD: return -1;
                    case ItemIds.PICK_DIAMOND: return -1;
                    case ItemIds.PICK_AMETHYST: return 1;
                    case ItemIds.PICK_REIDITE: return 2;
                }
            break;
        }
        return -1;
    }
}