"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapObject = void 0;
const ObjectType_1 = require("../enums/ObjectType");
const PacketType_1 = require("../enums/PacketType");
const bufferReader_1 = require("../utils/bufferReader");
const Utils_1 = require("../utils/Utils");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
const ResourceUtils_1 = require("../utils/ResourceUtils");
class MapObject {
    x;
    y;
    radius;
    type;
    id;
    raw_type;
    size;
    parentEntity;
    lastUpdate;
    inStorage;
    isFly = false;
    nextDiff_;
    isSolid = true;
    constructor(type, x, y, radius, raw_type, size) {
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
    updateDiff(now, timestamp) { return now - timestamp; }
    setParentEntity(ent) {
        this.parentEntity = ent;
    }
    nextUpdate() {
        return serverconfig_json_1.default.world.resources.resource_fill_min + Math.floor(Math.random() * serverconfig_json_1.default.world.resources.resource_fill_max);
    }
    update() {
        const now = +new Date();
        let currentDiff = this.updateDiff(now, this.lastUpdate);
        if (currentDiff >= this.nextDiff_) {
            this.nextDiff_ = this.nextUpdate();
            this.add_item();
            this.lastUpdate = +new Date();
        }
    }
    add_item() {
        const maxIn = ResourceUtils_1.ResourceUtils.getLimitResources(this.type, this.size);
        const getRandomMinMax = ResourceUtils_1.ResourceUtils.getRandomAddMaxMin(this.type, this.size);
        this.inStorage = Math.min(maxIn, Math.max(0, this.inStorage + Utils_1.Utils.randomMaxMin(getRandomMinMax[0], getRandomMinMax[1])));
        if (this.type == ObjectType_1.ObjectType.BERRY_BUSH) {
            this.updateParent();
        }
    }
    updateParent() {
        this.parentEntity.info = this.inStorage;
    }
    receiveHit(damager) {
        this.update();
        const gameServer = damager.gameServer;
        const writer = new bufferReader_1.BufferWriter(10);
        const data = Utils_1.Utils.indexFromMapObject(this.raw_type);
        if (!data || data.i < 0)
            return;
        writer.writeUInt16(PacketType_1.ServerPacketTypeBinary.ResourceHitten);
        writer.writeUInt16(this.x / 100);
        writer.writeUInt16(this.y / 100);
        writer.writeUInt16(damager.angle);
        writer.writeUInt16(data.i + (data.needSize ? this.size : 0));
        const arrTo = gameServer.queryManager.queryPlayers(this.x, this.y, 2000);
        for (let i = 0; i < arrTo.length; i++) {
            const player = arrTo[i];
            player.controller.sendBinary(writer.toBuffer());
        }
        if (this.inStorage >= 1) {
            let shouldMine = ResourceUtils_1.ResourceUtils.readShouldMine(this.type, damager);
            if (shouldMine == -1) {
                const writer_ = new bufferReader_1.BufferWriter(1);
                writer_.writeUInt8(PacketType_1.ServerPacketTypeBinary.WrongTool);
                damager.controller.sendBinary(writer_.toBuffer());
                return;
            }
            let itemTo = ResourceUtils_1.ResourceUtils.getResourceItem(this.type);
            if (damager.inventory.isInventoryFull(itemTo)) {
                damager.controller.sendBinary(Buffer.from([PacketType_1.ServerPacketTypeBinary.InventoryIsFull]));
                return;
            }
            let finalCount = this.inStorage < shouldMine ? this.inStorage : shouldMine;
            this.inStorage -= finalCount;
            damager.gameProfile.score += finalCount * ResourceUtils_1.ResourceUtils.readScoreFrom(this.type);
            damager.inventory.addItem(itemTo, finalCount);
        }
        else {
            const writer_ = new bufferReader_1.BufferWriter(1);
            writer_.writeUInt8(PacketType_1.ServerPacketTypeBinary.ResourceIsEmpty);
            damager.controller.sendBinary(writer_.toBuffer());
        }
        if (this.type == ObjectType_1.ObjectType.BERRY_BUSH)
            this.updateParent();
    }
}
exports.MapObject = MapObject;
