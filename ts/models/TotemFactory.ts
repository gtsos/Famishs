import { Building } from "../entity/Building";
import { Player } from "../entity/Player";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";

export class TotemFactory {
    public sourceEntity: Building;

    constructor(sourceEntity: Building) {
        this.sourceEntity = sourceEntity;
    }

    public isTeammate(id: number) {
        return this.sourceEntity.data.find((e: any) => e.id == id);
    }

}