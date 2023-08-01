"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = void 0;
const PacketType_1 = require("../enums/PacketType");
const bufferReader_1 = require("./bufferReader");
class Inventory {
    items;
    maxSize;
    sourcePlayer;
    constructor(sourcePlayer, maxSize) {
        this.items = new Map();
        this.maxSize = maxSize;
        this.sourcePlayer = sourcePlayer;
    }
    getBag() {
        this.sourcePlayer.controller.sendBinary(Buffer.from([PacketType_1.ServerPacketTypeBinary.GetBag]));
    }
    containsItem(itemID, count = 1) {
        const item = this.items.get(itemID);
        if (!item && item != 0)
            return false;
        return item >= count;
    }
    isInventoryFull(item) {
        return !this.items.has(item) && (this.items.size == this.maxSize);
    }
    addItem(item, count) {
        if (count >= 65000) {
            return;
        }
        if (isNaN(count) || count < 0) {
            count = 1;
        }
        if (!this.items.has(item) && (this.items.size >= this.maxSize)) {
            this.sourcePlayer.controller.sendBinary(Buffer.from([PacketType_1.ServerPacketTypeBinary.InventoryIsFull]));
            return;
        }
        this.items.set(item, (this.items.get(item) ?? 0) + count);
        const writer = new bufferReader_1.BufferWriter(6);
        writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Gather);
        writer.writeUInt8(0);
        writer.writeUInt16(item);
        writer.writeUInt16(count);
        this.sourcePlayer.controller.sendBinary(writer.toBuffer());
    }
    countItem(item) {
        return this.items.get(item) ?? 0;
    }
    removeItem(item, count, shouldUpdate = true) {
        const total = (this.items.get(item) ?? 0) - count;
        if (total <= 0) {
            this.items.delete(item);
        }
        else
            this.items.set(item, total);
        if (shouldUpdate)
            this.sourcePlayer.controller.sendJSON([PacketType_1.ServerPacketTypeJson.DecreaseItem, item, count]);
    }
    serialize() {
        let array = [];
        Array.from(this.items.entries()).forEach(([item, count]) => {
            array[item] = count;
        });
        return array;
    }
    toArray() {
        return Array.from(this.items);
    }
}
exports.Inventory = Inventory;
