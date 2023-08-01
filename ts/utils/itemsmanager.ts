import { ItemIds } from "../enums/ItemIds";
import { MarketIds } from "../enums/MarketIds";
import serverSettings from "../settings/serverconfig.json";
export const Items: Record <string, any> = {};

export enum ItemMetaType {
    NOTHING = "nothing",
    SWORD = "sword",
    PICKAXE = "pickaxe",
    HAMMER = "hammer",
    WRENCHABLE = "wrenchable",
    SHOVEL = "shovel",
    RIDING = "riding",
    HAT = "hat",
    VECHILE = "vechile",
    SHIELD = "shield",
    BOW = "bow",
    ARROW = "arrow",
    PLANT = "plant",
    POISONED_FOOD = "poisoned_food",
    REGENERABLE = "regenerable",
    WALL = "wall",
    SPIKED_WALL = "spike",
    DOOR = "door",
    SPIKED_DOOR = "spiked_door",
    TOTEM = "totem",
    SCOREABLE = "scoreable",
    STORAGE = "storage",
    FIRE = "fire",
    PLOT = "plot",
    BED = "bed",
}
export enum ItemType {
    RESOURCE = "resource",
    BUILDING = "building",
    EQUIPPABLE = "equippable",
    FOOD = "food",
}

function load_items() {

    const items = serverSettings.items;

    for(let i = 0; i < items.length; i++) {
        const item = items[i];

        Items[item.name] = {
            name: item.name,
            id: ItemIds[item.name.toUpperCase() as keyof typeof ItemIds],
            type: ItemType[item.type.toUpperCase() as keyof typeof ItemType],
            meta_type: ItemMetaType[item.meta_type.toUpperCase() as keyof typeof ItemMetaType],
            data: item.data
        }
    }
}load_items();

export class ItemUtils {
    public static isEquippable(item: any) {
        return item.type == ItemType.EQUIPPABLE;
    }
    public static isSword(item: any) {
        return item.meta_type == ItemMetaType.SWORD;
    }
    public static isPickaxe(item: any) {
        return item.meta_type == ItemMetaType.PICKAXE;
    }
    public static isShovel(item: any) {
        return item.meta_type == ItemMetaType.SHOVEL;
    }
    public static isShield(item: any) {
        return item.meta_type == ItemMetaType.SHIELD;
    }
    public static isBow(item: any) {
        return item.meta_type == ItemMetaType.BOW;
    }
    public static isHat(item: any) {
        return item.meta_type == ItemMetaType.HAT;
    }
    public static isVechile(item: any) {
        return item.meta_type == ItemMetaType.VECHILE;
    }
    public static isRightHand(item: any) {
        return (ItemUtils.isSword(item) ||
            ItemUtils.isPickaxe(item) ||
            ItemUtils.isBow(item) ||
            ItemUtils.isShovel(item) ||
            ItemUtils.isShield(item)
        );
    }
    public static getItemById(id: number) {
        for(const item of Object.values(Items)) {
            if(item.id == id) return item;
        }
    }
}
