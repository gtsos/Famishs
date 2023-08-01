import { Animal } from "../entity/Animal";
import { Building } from "../entity/Building";
import { Entity } from "../entity/Entity";
import { Player } from "../entity/Player";
import { Action } from "../enums/Action";
import { DieReason } from "../enums/DieReason";
import { EntityType } from "../enums/EntityType";
import { ServerPacketTypeBinary, ServerPacketTypeJson } from "../enums/PacketType";
import { GameServer } from "../GameServer";
import { BufferWriter } from "../utils/bufferReader";

export class WorldDeleter {


    public deleteQuery: DeleteEntity[];
    public gameServer: GameServer;
    constructor (gameServer: GameServer) {
        this.deleteQuery = [];
        this.gameServer = gameServer;

    }

    public queryDelete () {
        for(let i = 0; i < this.deleteQuery.length; i++) {
            const dEntity = this.deleteQuery[i];

            this.removeEntity(dEntity.type, dEntity);
            //const playersIn = this.gameServer.queryManager.queryRectPlayers(dEntity.entity.x , dEntity.entity.y , 2560 , 1440);

            //const writer = new BufferWriter(8);
            //writer.writeUInt16(ServerPacketTypeBinary.EntityDelete);
           // writer.writeUInt16(dEntity.entity.type == 0 ? 0 : dEntity.entity.id);
          //  writer.writeUInt16(dEntity.entity.playerId);

          //  for(let x = 0; x < playersIn.length; x++)
              //  playersIn[x].controller.sendBinary(writer.toBuffer());
            
        }

    }
    public removeEntity(type: any , dEntity: DeleteEntity) {
        const newList = this.deleteQuery.filter(de => de.entity.id != dEntity.entity.id);
        this.deleteQuery = newList;

        switch(type) {
            case "static": {

                break;
            }
            case "living": {
                this.gameServer.removeLivingEntity(dEntity.entity);
 
                break;
            }
            case "building":
                dEntity.entity.ownerClass.onDead();
                dEntity.entity.ownerClass.owner.buildingManager.removeBuilding(dEntity.entity.id);
                this.gameServer.removeLivingEntity(dEntity.entity);

            break;

            case "player": {
                this.gameServer.removeLivingEntity(dEntity.entity, true);
                this.gameServer.playerPool.dispose(dEntity.entity.id);
               
                dEntity.entity.controller.sendJSON([
                    ServerPacketTypeJson.KillPlayer,
                    DieReason.BEAR_KILLED,
                    -1,
                    3]);

                const writer = new BufferWriter(3);
                writer.writeUInt8(ServerPacketTypeBinary.KillPlayer);
                writer.writeUInt8(dEntity.entity.id);
                
                this.gameServer.broadcastBinary(writer.toBuffer());

                for(let i = 0; i < dEntity.entity.buildingManager.buildings.length; i++) {
                    const ent = dEntity.entity.buildingManager.getBuildingTail(dEntity.entity.buildingManager.buildings[i]);
                    if(ent != null) this.initEntity(ent, "building");
                }
                
                break;
            }

            default: {

                break;
            }
        }
    }//////
    public initEntity (entity: any, type: any) {
        const de = new DeleteEntity(type, entity);
        entity.action |= Action.DELETE;
      
        this.deleteQuery.push(de);
    }
}
export class DeleteEntity {
    public entity: any;
    public type: any;
    constructor (type : any , entity : any) {

        
        this.type = type;
        this.entity = entity;
    }
}