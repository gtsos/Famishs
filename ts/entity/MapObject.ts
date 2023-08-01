import { ItemIds } from "../enums/ItemIds";
import { ObjectType } from "../enums/ObjectType";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";
import { Items } from "../utils/itemsmanager";
import { Utils } from "../utils/Utils";
import { Entity } from "./Entity";
import { Player } from "./Player";
import serverConfig from "../settings/serverconfig.json";
import { ResourceUtils } from "../utils/ResourceUtils";

export class MapObject {
    public x: number;
    public y: number;
    public radius: number;

    public type: ObjectType;
    public id: number;

    public raw_type: string;
    public size: number;

    public parentEntity!: Entity;

    public lastUpdate: number;

    public inStorage: number;
    public isFly: boolean = false;
    public nextDiff_: number;
    public isSolid: boolean = true;

    public constructor (type: ObjectType, x: number, y: number, radius: number, raw_type: string, size: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type;
        this.id = -2;

        this.raw_type = raw_type;
        this.size = size;

        this.lastUpdate = +new Date();

        this.inStorage = 0;

        this.nextDiff_ = this.nextUpdate();
    }
    public updateDiff(now: number, timestamp: number) { return now - timestamp; }
    public setParentEntity (ent: Entity) {
        this.parentEntity = ent;
    }

    public nextUpdate() {
        return serverConfig.world.resources.resource_fill_min +  Math.floor(Math.random() * serverConfig.world.resources.resource_fill_max);
    }
    public update() {
        const now = +new Date();

        let currentDiff = this.updateDiff(now , this.lastUpdate);

        if(currentDiff >= this.nextDiff_) {
            this.nextDiff_ = this.nextUpdate();

            this.add_item();

            this.lastUpdate = +new Date()
          
        }
    
    }

    public add_item() {
        const maxIn:number = ResourceUtils.getLimitResources(this.type , this.size);
        const getRandomMinMax = ResourceUtils.getRandomAddMaxMin(this.type, this.size);

        this.inStorage = Math.min(maxIn , Math.max(0 ,this.inStorage + Utils.randomMaxMin(getRandomMinMax[0] , getRandomMinMax[1])));

        if(this.type == ObjectType.BERRY_BUSH) {            
            this.updateParent();
        }
    }
    public updateParent () {
        this.parentEntity.info = this.inStorage;
    }

    public receiveHit (damager: Player) {

        this.update();

        const gameServer = damager.gameServer;
        const writer = new BufferWriter(10);
        const data = Utils.indexFromMapObject(this.raw_type);

        if(!data || data.i < 0) return;

        writer.writeUInt16(ServerPacketTypeBinary.ResourceHitten);
        writer.writeUInt16(this.x / 100);
        writer.writeUInt16(this.y / 100);
        writer.writeUInt16(damager.angle);
        writer.writeUInt16(data.i + (data.needSize ? this.size : 0));

        const arrTo = gameServer.queryManager.queryPlayers(this.x , this.y , 2000);

        for(let i = 0; i < arrTo.length; i++) {
            const player = arrTo[i];

            player.controller.sendBinary(writer.toBuffer())
        }
        if(this.inStorage >= 1) {

            let shouldMine = ResourceUtils.readShouldMine(this.type , damager);
            
         
            if(shouldMine == -1) {
                const writer_ = new BufferWriter(1);
                writer_.writeUInt8(ServerPacketTypeBinary.WrongTool);
                
                damager.controller.sendBinary(writer_.toBuffer());
                return;
            }
            let itemTo = ResourceUtils.getResourceItem(this.type);
            if(damager.inventory.isInventoryFull(itemTo)) {
                damager.controller.sendBinary(Buffer.from([ ServerPacketTypeBinary.InventoryIsFull ]));
                return;
            }
            let finalCount = this.inStorage < shouldMine ? this.inStorage : shouldMine;

            this.inStorage -= finalCount;

            damager.gameProfile.score += finalCount * ResourceUtils.readScoreFrom(this.type);
            damager.inventory.addItem(itemTo, finalCount);
            
        }else {
            const writer_ = new BufferWriter(1);
            writer_.writeUInt8(ServerPacketTypeBinary.ResourceIsEmpty);
            
            damager.controller.sendBinary(writer_.toBuffer());
        }
       
        if(this.type == ObjectType.BERRY_BUSH) this.updateParent();

    }
}