"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemUtils = exports.ItemType = exports.ItemMetaType = exports.Items = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
exports.Items = {};
var ItemMetaType;
(function (ItemMetaType) {
    ItemMetaType["NOTHING"] = "nothing";
    ItemMetaType["SWORD"] = "sword";
    ItemMetaType["PICKAXE"] = "pickaxe";
    ItemMetaType["HAMMER"] = "hammer";
    ItemMetaType["WRENCHABLE"] = "wrenchable";
    ItemMetaType["SHOVEL"] = "shovel";
    ItemMetaType["RIDING"] = "riding";
    ItemMetaType["HAT"] = "hat";
    ItemMetaType["VECHILE"] = "vechile";
    ItemMetaType["SHIELD"] = "shield";
    ItemMetaType["BOW"] = "bow";
    ItemMetaType["ARROW"] = "arrow";
    ItemMetaType["PLANT"] = "plant";
    ItemMetaType["POISONED_FOOD"] = "poisoned_food";
    ItemMetaType["REGENERABLE"] = "regenerable";
    ItemMetaType["WALL"] = "wall";
    ItemMetaType["SPIKED_WALL"] = "spike";
    ItemMetaType["DOOR"] = "door";
    ItemMetaType["SPIKED_DOOR"] = "spiked_door";
    ItemMetaType["TOTEM"] = "totem";
    ItemMetaType["SCOREABLE"] = "scoreable";
    ItemMetaType["STORAGE"] = "storage";
    ItemMetaType["FIRE"] = "fire";
    ItemMetaType["PLOT"] = "plot";
    ItemMetaType["BED"] = "bed";
})(ItemMetaType = exports.ItemMetaType || (exports.ItemMetaType = {}));
var ItemType;
(function (ItemType) {
    ItemType["RESOURCE"] = "resource";
    ItemType["BUILDING"] = "building";
    ItemType["EQUIPPABLE"] = "equippable";
    ItemType["FOOD"] = "food";
})(ItemType = exports.ItemType || (exports.ItemType = {}));
function load_items() {
    const items = serverconfig_json_1.default.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        exports.Items[item.name] = {
            name: item.name,
            id: ItemIds_1.ItemIds[item.name.toUpperCase()],
            type: ItemType[item.type.toUpperCase()],
            meta_type: ItemMetaType[item.meta_type.toUpperCase()],
            data: item.data
        };
    }
}
load_items();
class ItemUtils {
    static isEquippable(item) {
        return item.type == ItemType.EQUIPPABLE;
    }
    static isSword(item) {
        return item.meta_type == ItemMetaType.SWORD;
    }
    static isPickaxe(item) {
        return item.meta_type == ItemMetaType.PICKAXE;
    }
    static isShovel(item) {
        return item.meta_type == ItemMetaType.SHOVEL;
    }
    static isShield(item) {
        return item.meta_type == ItemMetaType.SHIELD;
    }
    static isBow(item) {
        return item.meta_type == ItemMetaType.BOW;
    }
    static isHat(item) {
        return item.meta_type == ItemMetaType.HAT;
    }
    static isVechile(item) {
        return item.meta_type == ItemMetaType.VECHILE;
    }
    static isRightHand(item) {
        return (ItemUtils.isSword(item) ||
            ItemUtils.isPickaxe(item) ||
            ItemUtils.isBow(item) ||
            ItemUtils.isShovel(item) ||
            ItemUtils.isShield(item));
    }
    static getItemById(id) {
        for (const item of Object.values(exports.Items)) {
            if (item.id == id)
                return item;
        }
    }
}
exports.ItemUtils = ItemUtils;
