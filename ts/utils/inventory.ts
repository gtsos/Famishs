import { Player } from "../entity/Player";
import { ItemIds } from "../enums/ItemIds";
import { ServerPacketTypeBinary, ServerPacketTypeJson } from "../enums/PacketType";
import { BufferWriter } from "./bufferReader";

export class Inventory {
    public  items: Map<number, number>;
    public maxSize: number;

    public sourcePlayer: Player;

    public constructor(sourcePlayer: Player,maxSize: number) {
        this.items = new Map<number, number>();

        this.maxSize = maxSize;
        this.sourcePlayer = sourcePlayer;

        
    }
    public getBag () {
        this.sourcePlayer.controller.sendBinary(Buffer.from([ ServerPacketTypeBinary.GetBag ]))

    }

    public containsItem(itemID: number, count: number = 1) {
        const item = this.items.get(itemID);
        if (!item && item != 0) return false; 
        return item >= count;
    }
    public isInventoryFull(item: number) {
        return !this.items.has(item) && (this.items.size == this.maxSize)
    }
    public addItem(item: number, count: number) {
        if(count >= 65000) {
            return;
        }
        if(isNaN(count) || count < 0) {
            count = 1;
        }
        if(!this.items.has(item) && (this.items.size >= this.maxSize)) {
            this.sourcePlayer.controller.sendBinary(Buffer.from([ ServerPacketTypeBinary.InventoryIsFull ]));
            return;
        }

        
        this.items.set(item, (this.items.get(item) ?? 0) + count);
        
        const writer = new BufferWriter(6);
        writer.writeUInt8(ServerPacketTypeBinary.Gather);
        writer.writeUInt8(0);
       
        writer.writeUInt16(item);
        writer.writeUInt16(count);

        this.sourcePlayer.controller.sendBinary(writer.toBuffer());
    }

    public countItem(item: number) {
        return this.items.get(item) ?? 0;
    }

    public removeItem(item: number, count: number, shouldUpdate: boolean = true) {
        const total = (this.items.get(item) ?? 0) - count;
        if(total <= 0){
             this.items.delete(item);
        }else this.items.set(item, total);

        if(shouldUpdate) this.sourcePlayer.controller.sendJSON([ServerPacketTypeJson.DecreaseItem, item , count]);

    }
    public serialize() {
        let array: any[] = [];
        Array.from(this.items.entries()).forEach(([ item, count ]) => {
            array[item] = count;
        });
        return array;
    }
    public toArray() {
        return Array.from(this.items);
    }
}