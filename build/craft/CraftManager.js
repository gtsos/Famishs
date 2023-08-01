"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Craft = exports.CraftManager = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const PacketType_1 = require("../enums/PacketType");
const bufferReader_1 = require("../utils/bufferReader");
const CraftTranslator_1 = require("./CraftTranslator");
class CraftManager {
    player;
    toCraft = null;
    toRecycle = null;
    elapsed = -1;
    craftTime = -1;
    recycleTime = -1;
    constructor(player) {
        this.player = player;
    }
    isCrafting() {
        return this.toCraft != null;
    }
    isRecycling() {
        return this.toRecycle != null;
    }
    update() {
        if (this.isCrafting()) {
            const diff = +new Date() - this.elapsed;
            if (diff >= (this.craftTime * 1000)) {
                const itemId = ItemIds_1.ItemIds[this.toCraft.itemName.toUpperCase()];
                this.player.inventory.addItem(itemId, this.toCraft.itemAmount);
                this.player.gameProfile.score += this.toCraft.bonus ?? 0;
                this.cancelCraft();
            }
        }
        if (this.isRecycling()) {
            if (+new Date() - this.elapsed > this.recycleTime * 1000) {
                const recipes = this.toRecycle.recipe;
                for (let i = 0; i < recipes.length; i++) {
                    const item = recipes[i];
                    const itemId = ItemIds_1.ItemIds[item[0].toUpperCase()];
                    const count = ~~Math.max(0, item[1] * .8);
                    if (!count)
                        continue;
                    this.player.inventory.addItem(itemId, count);
                }
                this.cancelCraft();
            }
        }
    }
    handleRecycle(itemId) {
        if (this.elapsed != -1)
            return;
        if (!this.player.inventory.containsItem(itemId))
            return;
        if (!this.player.stateManager.isWorkbench)
            return;
        const craftId = (0, CraftTranslator_1.findCraftByItemId)(itemId);
        const craftBound = this.player.gameServer.crafts.find(c => craftId == (0, CraftTranslator_1.findCraftIdFromItem)((c.itemName)));
        if (craftBound) {
            let item = ItemIds_1.ItemIds[craftBound.itemName.toUpperCase()];
            this.player.inventory.removeItem(item, 1);
            this.player.updateEquipment(item);
            const writer = new bufferReader_1.BufferWriter(2);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.RecycleOk);
            writer.writeUInt8(craftId);
            this.player.controller.sendBinary(writer.toBuffer());
            this.recycleTime = craftBound.time / 8;
            this.toRecycle = craftBound;
            this.elapsed = +new Date();
        }
    }
    cancelCraft() {
        if (this.isCrafting() || this.isRecycling()) {
            const writer = new bufferReader_1.BufferWriter(1);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.CancelCraft);
            this.player.controller.sendBinary(writer.toBuffer());
            this.toCraft = null;
            this.toRecycle = null;
            this.elapsed = -1;
        }
    }
    handleCraft(craftId) {
        if (this.elapsed != -1)
            return;
        const craftBound = this.player.gameServer.crafts.find(c => craftId == (0, CraftTranslator_1.findCraftIdFromItem)((c.itemName)));
        if (craftBound) {
            if (craftBound.water && !this.player.stateManager.isInSea ||
                craftBound.workbench && !this.player.stateManager.isWorkbench ||
                craftBound.fire && !this.player.stateManager.isInFire)
                return;
            const list = [];
            for (let i = 0; i < craftBound.recipe.length; i++) {
                const recipeData = craftBound.recipe[i];
                let itemId = ItemIds_1.ItemIds[recipeData[0].toUpperCase()];
                if (!itemId && itemId != 0) {
                    console.log(`Empty craft item cannot be applied to ${itemId}`);
                    return;
                }
                if (!this.player.inventory.containsItem(itemId, recipeData[1])) {
                    return;
                }
                list.push([itemId, recipeData[1]]);
            }
            this.toCraft = craftBound;
            const itemId = ItemIds_1.ItemIds[this.toCraft.itemName.toUpperCase()];
            if (itemId != null && !this.player.inventory.containsItem(itemId, 1) && this.player.inventory.items.size >= this.player.inventory.maxSize && !list.every((e) => this.player.inventory.containsItem(e[0]))) {
                this.player.controller.sendBinary(Buffer.from([PacketType_1.ServerPacketTypeBinary.InventoryIsFull]));
                return;
            }
            const craftResponse = new bufferReader_1.BufferWriter(3);
            craftResponse.writeUInt8(PacketType_1.ServerPacketTypeBinary.CraftOk);
            craftResponse.writeUInt8(craftId);
            this.player.controller.sendBinary(craftResponse.toBuffer());
            this.craftTime = craftBound.time;
            if (this.player.right == ItemIds_1.ItemIds.BOOK)
                this.craftTime /= 3;
            this.toCraft = craftBound;
            this.elapsed = +new Date();
            for (let i = 0; i < list.length; i++) {
                this.player.inventory.removeItem(list[i][0], list[i][1], false);
                if (!this.player.inventory.containsItem(list[i][0], 1)) {
                    if (this.player.hat == list[i][0])
                        this.player.hat = 0;
                    if (this.player.extra == list[i][0])
                        this.player.extra = 0;
                    if (this.player.right == list[i][0])
                        this.player.right = ItemIds_1.ItemIds.HAND;
                    this.player.updateInfo();
                }
            }
        }
    }
}
exports.CraftManager = CraftManager;
class Craft {
    itemName;
    itemAmount;
    recipe;
    water;
    workbench;
    fire;
    well;
    time;
    bonus;
    constructor(craftData) {
        this.itemName = craftData.item;
        this.itemAmount = craftData.amount;
        this.recipe = craftData.recipe;
        this.water = craftData.water;
        this.workbench = craftData.workbench;
        this.fire = craftData.fire;
        this.well = craftData.well;
        this.time = craftData.time;
        this.bonus = craftData.bonus;
    }
    getItem(iName) {
        return ItemIds_1.ItemIds[iName.toUpperCase()];
    }
    serializeRecipe() {
        const newRecipeD = [];
        for (let i = 0; i < this.recipe.length; i++) {
            newRecipeD.push([this.getItem(this.recipe[i][0]), this.recipe[i][1]]);
        }
        return newRecipeD;
    }
    toObject() {
        return {
            item: (0, CraftTranslator_1.findCraftIdFromItem)(this.itemName),
            recipe: this.serializeRecipe(),
            water: this.water,
            workbench: this.workbench,
            fire: this.fire,
            well: this.well,
            time: this.time,
        };
    }
}
exports.Craft = Craft;
