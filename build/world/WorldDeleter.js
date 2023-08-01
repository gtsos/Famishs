"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteEntity = exports.WorldDeleter = void 0;
const Action_1 = require("../enums/Action");
const DieReason_1 = require("../enums/DieReason");
const PacketType_1 = require("../enums/PacketType");
const bufferReader_1 = require("../utils/bufferReader");
class WorldDeleter {
    deleteQuery;
    gameServer;
    constructor(gameServer) {
        this.deleteQuery = [];
        this.gameServer = gameServer;
    }
    queryDelete() {
        for (let i = 0; i < this.deleteQuery.length; i++) {
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
    removeEntity(type, dEntity) {
        const newList = this.deleteQuery.filter(de => de.entity.id != dEntity.entity.id);
        this.deleteQuery = newList;
        switch (type) {
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
                    PacketType_1.ServerPacketTypeJson.KillPlayer,
                    DieReason_1.DieReason.BEAR_KILLED,
                    -1,
                    3
                ]);
                const writer = new bufferReader_1.BufferWriter(3);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.KillPlayer);
                writer.writeUInt8(dEntity.entity.id);
                this.gameServer.broadcastBinary(writer.toBuffer());
                for (let i = 0; i < dEntity.entity.buildingManager.buildings.length; i++) {
                    const ent = dEntity.entity.buildingManager.getBuildingTail(dEntity.entity.buildingManager.buildings[i]);
                    if (ent != null)
                        this.initEntity(ent, "building");
                }
                break;
            }
            default: {
                break;
            }
        }
    } //////
    initEntity(entity, type) {
        const de = new DeleteEntity(type, entity);
        entity.action |= Action_1.Action.DELETE;
        this.deleteQuery.push(de);
    }
}
exports.WorldDeleter = WorldDeleter;
class DeleteEntity {
    entity;
    type;
    constructor(type, entity) {
        this.type = type;
        this.entity = entity;
    }
}
exports.DeleteEntity = DeleteEntity;
