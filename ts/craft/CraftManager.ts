import { Player } from "../entity/Player";
import { ItemIds } from "../enums/ItemIds";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";
import { CRAFTS, findCraftIdFromItem, findCraftByItemId } from "./CraftTranslator";

export class CraftManager {
    public player: Player;
    public toCraft: any = null;
    public toRecycle: any = null;
    public elapsed: number = -1;
    public craftTime: number = -1;
    public recycleTime: number = -1;
    constructor(player: Player) {
        this.player = player;
    }
    isCrafting() {
        return this.toCraft != null;
    }

    isRecycling() {
        return this.toRecycle != null;
    }

    update () {
        if(this.isCrafting()) {
            const diff = +new Date() - this.elapsed;

            if(diff >= (this.craftTime * 1000)) {
                const itemId:any = ItemIds[this.toCraft.itemName.toUpperCase()];
                this.player.inventory.addItem(itemId, this.toCraft.itemAmount);

                this.player.gameProfile.score += this.toCraft.bonus ?? 0;

                this.cancelCraft();
            }
        }
     
        if(this.isRecycling()) {
            if(+new Date() - this.elapsed > this.recycleTime * 1000) {

                const recipes = this.toRecycle.recipe;
            
                for (let i = 0; i < recipes.length; i++) {
                    const item = recipes[i]; 
    
                    const itemId: any = ItemIds[item[0].toUpperCase()];
                    const count = ~~Math.max(0, item[1] * .8);
    
                    if(!count) continue;
    
                    this.player.inventory.addItem(itemId, count);
                }

                this.cancelCraft();
            }
        }
    }

    handleRecycle(itemId: number) {
        if(this.elapsed != -1) return;
        if(!this.player.inventory.containsItem(itemId)) return;
        if(!this.player.stateManager.isWorkbench) return;

        const craftId = findCraftByItemId(itemId);
        const craftBound = this.player.gameServer.crafts.find(c => craftId == findCraftIdFromItem((c.itemName)));

        if(craftBound) {

            let item = (ItemIds as any)[craftBound.itemName.toUpperCase()];
            this.player.inventory.removeItem(item, 1);

            this.player.updateEquipment(item);

            const writer = new BufferWriter(2);
            writer.writeUInt8(ServerPacketTypeBinary.RecycleOk);
            writer.writeUInt8(craftId);

            this.player.controller.sendBinary(writer.toBuffer());

            this.recycleTime = craftBound.time / 8;

            this.toRecycle = craftBound;
            this.elapsed = +new Date();
        }
    }

    cancelCraft() {
        if(this.isCrafting() || this.isRecycling()) {

            const writer = new BufferWriter(1);
            writer.writeUInt8(ServerPacketTypeBinary.CancelCraft);

            this.player.controller.sendBinary(writer.toBuffer());

            this.toCraft = null;
            this.toRecycle = null;

            this.elapsed = -1;
        }
    }

    handleCraft(craftId: number) {
        if(this.elapsed != -1) return;
        const craftBound = this.player.gameServer.crafts.find(c => craftId == findCraftIdFromItem((c.itemName)));

        if(craftBound) {

            if(craftBound.water && !this.player.stateManager.isInSea ||
                craftBound.workbench && !this.player.stateManager.isWorkbench ||
                craftBound.fire && !this.player.stateManager.isInFire) return;

            const list:any = [];
            for(let i = 0; i < craftBound.recipe.length; i++) {
                const recipeData = craftBound.recipe[i];

                let itemId:any = ItemIds[recipeData[0].toUpperCase()];

                if(!itemId && itemId != 0) {
                    console.log(`Empty craft item cannot be applied to ${itemId}`);
                    return;
                }
                if(!this.player.inventory.containsItem(itemId, recipeData[1])) {
                    return;
                }
                
                list.push([itemId, recipeData[1]]);
            }
            this.toCraft = craftBound;
            const itemId:any = ItemIds[this.toCraft.itemName.toUpperCase()];

            if(itemId != null && !this.player.inventory.containsItem(itemId, 1) && this.player.inventory.items.size >= this.player.inventory.maxSize && !list.every((e:any) => this.player.inventory.containsItem(e[0]))) {
                this.player.controller.sendBinary(Buffer.from([ ServerPacketTypeBinary.InventoryIsFull ]));
                return;
            }

            const craftResponse = new BufferWriter(3);
            craftResponse.writeUInt8(ServerPacketTypeBinary.CraftOk);
            craftResponse.writeUInt8(craftId);

            this.player.controller.sendBinary(craftResponse.toBuffer());

            this.craftTime = craftBound.time;
            if(this.player.right == ItemIds.BOOK) this.craftTime /= 3;

            this.toCraft = craftBound;
            this.elapsed = +new Date();

            for(let i = 0; i < list.length; i++) {
                this.player.inventory.removeItem(list[i][0], list[i][1], false);

                if(!this.player.inventory.containsItem(list[i][0], 1)) {
                    if(this.player.hat == list[i][0]) this.player.hat = 0;
                    if(this.player.extra == list[i][0]) this.player.extra = 0;
                    if(this.player.right == list[i][0]) this.player.right = ItemIds.HAND;

                    this.player.updateInfo();
                }
            }
            
        }

    }
}

export class Craft {
    itemName: String;
    itemAmount: number;
    recipe: any;
    water: number;
    workbench: number;
    fire: number;
    well: number;
    time: number;
    bonus: number;
    constructor(craftData: any) {
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

    public getItem(iName: String): ItemIds {
        return (ItemIds as any)[iName.toUpperCase()]; 
    }
    public serializeRecipe () {
        const newRecipeD = [];

        for(let i = 0; i < this.recipe.length; i++) {
          
            newRecipeD.push([this.getItem(this.recipe[i][0]), this.recipe[i][1]])
        }
        return newRecipeD;
    }
    public toObject () {
        return {
            item: findCraftIdFromItem(this.itemName),
            recipe: this.serializeRecipe(),
            water: this.water,
            workbench: this.workbench,
            fire: this.fire,
            well: this.well,
            time: this.time,
          }
    }
}
