"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceUtils = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const ObjectType_1 = require("../enums/ObjectType");
const itemsmanager_1 = require("./itemsmanager");
class ResourceUtils {
    static getLimitResources(type, size = 0) {
        switch (type) {
            case ObjectType_1.ObjectType.TREE: return size == 2 ? 75 : size == 1 ? 60 : 45;
            case ObjectType_1.ObjectType.STONE: return size == 2 ? 50 : size == 1 ? 40 : 25;
            case ObjectType_1.ObjectType.GOLD: return size == 2 ? 40 : size == 1 ? 25 : 15;
            case ObjectType_1.ObjectType.DIAMOND: return size == 2 ? 30 : size == 1 ? 20 : 10;
            case ObjectType_1.ObjectType.AMETHYST: return size == 2 ? 30 : size == 1 ? 15 : 8;
            case ObjectType_1.ObjectType.REIDITE: return size == 2 ? 20 : size == 1 ? 10 : 5;
            case ObjectType_1.ObjectType.EMERALD: return size == 2 ? 15 : size == 1 ? 10 : 5;
            case ObjectType_1.ObjectType.PALM: return 40;
            case ObjectType_1.ObjectType.BERRY_BUSH: return 5;
            case ObjectType_1.ObjectType.CAVE_STONE: return 0;
            case ObjectType_1.ObjectType.RIVER: return 50;
        }
        return 30;
    }
    static getRandomAddMaxMin(type, size = 0) {
        switch (type) {
            case ObjectType_1.ObjectType.TREE: return size == 2 ? [2, 6] : size == 1 ? [3, 5] : [2, 4];
            case ObjectType_1.ObjectType.STONE: return size == 2 ? [2, 4] : size == 1 ? [2, 3] : [1, 3];
            case ObjectType_1.ObjectType.GOLD: return size == 2 ? [2, 4] : size == 1 ? [2, 3] : [1, 3];
            case ObjectType_1.ObjectType.DIAMOND: return size == 2 ? [2, 4] : size == 1 ? [2, 3] : [1, 3];
            case ObjectType_1.ObjectType.AMETHYST: return size == 2 ? [2, 4] : size == 1 ? [2, 3] : [1, 3];
            case ObjectType_1.ObjectType.REIDITE: return size == 2 ? [1, 3] : size == 1 ? [1, 2] : [1, 1];
            case ObjectType_1.ObjectType.EMERALD: return size == 2 ? [2, 3] : size == 1 ? [1, 2] : [1, 1];
            case ObjectType_1.ObjectType.PALM: return [1, 4];
            case ObjectType_1.ObjectType.BERRY_BUSH: return [1, 1];
            case ObjectType_1.ObjectType.CAVE_STONE: return [0, 0];
            case ObjectType_1.ObjectType.RIVER: return [0, 0];
        }
        return [1, 3];
    }
    static getResourceItem(type) {
        switch (type) {
            case ObjectType_1.ObjectType.TREE: return itemsmanager_1.Items["WOOD"].id;
            case ObjectType_1.ObjectType.STONE: return itemsmanager_1.Items["STONE"].id;
            case ObjectType_1.ObjectType.GOLD: return itemsmanager_1.Items["GOLD"].id;
            case ObjectType_1.ObjectType.DIAMOND: return itemsmanager_1.Items["DIAMOND"].id;
            case ObjectType_1.ObjectType.AMETHYST: return itemsmanager_1.Items["AMETHYST"].id;
            case ObjectType_1.ObjectType.REIDITE: return itemsmanager_1.Items["REIDITE"].id;
            case ObjectType_1.ObjectType.EMERALD: return itemsmanager_1.Items["EMERALD"].id;
            case ObjectType_1.ObjectType.CACTUS: return itemsmanager_1.Items["CACTUS"].id;
            case ObjectType_1.ObjectType.BERRY_BUSH: return itemsmanager_1.Items["PLANT"].id;
            case ObjectType_1.ObjectType.PALM: return itemsmanager_1.Items["WOOD"].id;
            case ObjectType_1.ObjectType.RIVER: return null;
            default: return null;
        }
    }
    static readScoreFrom(type) {
        switch (type) {
            case ObjectType_1.ObjectType.PALM: return 2;
            case ObjectType_1.ObjectType.TREE: return 2;
            case ObjectType_1.ObjectType.STONE: return 4;
            case ObjectType_1.ObjectType.GOLD: return 6;
            case ObjectType_1.ObjectType.DIAMOND: return 12;
            case ObjectType_1.ObjectType.AMETHYST: return 14;
            case ObjectType_1.ObjectType.REIDITE: return 25;
            case ObjectType_1.ObjectType.EMERALD: return 30;
            case ObjectType_1.ObjectType.BERRY_BUSH: return 1;
            case ObjectType_1.ObjectType.CACTUS: return 1;
            default: return 1;
        }
    }
    static readShouldMine(objectType, player) {
        switch (objectType) {
            case ObjectType_1.ObjectType.TREE:
            case ObjectType_1.ObjectType.PALM:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return 1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return 2;
                    case ItemIds_1.ItemIds.PICK: return 3;
                    case ItemIds_1.ItemIds.PICK_GOLD: return 4;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return 5;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 6;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 7;
                }
                break;
            case ObjectType_1.ObjectType.STONE:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return -1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return 1;
                    case ItemIds_1.ItemIds.PICK: return 2;
                    case ItemIds_1.ItemIds.PICK_GOLD: return 3;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return 4;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 5;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 6;
                }
                break;
            case ObjectType_1.ObjectType.GOLD:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return -1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return -1;
                    case ItemIds_1.ItemIds.PICK: return 1;
                    case ItemIds_1.ItemIds.PICK_GOLD: return 2;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return 3;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 4;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 5;
                }
                break;
            case ObjectType_1.ObjectType.DIAMOND:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return -1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return -1;
                    case ItemIds_1.ItemIds.PICK: return -1;
                    case ItemIds_1.ItemIds.PICK_GOLD: return 1;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return 2;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 3;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 4;
                }
                break;
            case ObjectType_1.ObjectType.AMETHYST:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return -1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return -1;
                    case ItemIds_1.ItemIds.PICK: return -1;
                    case ItemIds_1.ItemIds.PICK_GOLD: return -1;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return 1;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 2;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 3;
                }
                break;
            case ObjectType_1.ObjectType.BERRY_BUSH:
            case ObjectType_1.ObjectType.CACTUS: return 1;
            case ObjectType_1.ObjectType.EMERALD:
            case ObjectType_1.ObjectType.REIDITE:
                switch (player.right) {
                    case ItemIds_1.ItemIds.HAND: return -1;
                    case ItemIds_1.ItemIds.PICK_WOOD: return -1;
                    case ItemIds_1.ItemIds.PICK: return -1;
                    case ItemIds_1.ItemIds.PICK_GOLD: return -1;
                    case ItemIds_1.ItemIds.PICK_DIAMOND: return -1;
                    case ItemIds_1.ItemIds.PICK_AMETHYST: return 1;
                    case ItemIds_1.ItemIds.PICK_REIDITE: return 2;
                }
                break;
        }
        return -1;
    }
}
exports.ResourceUtils = ResourceUtils;
