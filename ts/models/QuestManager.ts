import { Player } from "../entity/Player";
import { QuestType, QuestStateType } from "../enums/QuestType";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";
import { EntityType } from "../enums/EntityType";
import { ItemIds } from "../enums/ItemIds";

const QUESTS_LIST = [
    //[QuestType.DRAGON_ORB, (1000 * 60 * 8) * 5],
    //[QuestType.DRAGON_CUBE, (1000 * 60 * 8) * 2],
    [QuestType.ORANGE_CROWN, (1000 * 60 * 8) * 2],
    [QuestType.GREEN_CROWN, (1000 * 60 * 8) * 3],
    //[QuestType.BLUE_CROWN, (1000 * 60 * 8) * 5]
];

class Quest {
    public time: number;
    public type: QuestType;

    constructor(type: QuestType, time: number) {
        this.type = type;
        this.time = time;
    }
}

export class QuestManager {
    private player: Player;
    private queueQuests: Quest[] = [];

    constructor(player: Player) {
        this.player = player;

        for (let i = 0; i < QUESTS_LIST.length; i++) {
            this.queueQuests.push(new Quest(QUESTS_LIST[i][0], QUESTS_LIST[i][1]));
        }
    }

    public checkQuestState(type: QuestType) {
        return this.player.completeQuests[type] != -1;
    }

    public removeQuest(type: QuestType) {
        this.queueQuests = this.queueQuests.filter(e => e.type != type);
    }

    public getQuest(type: QuestType) {
        return this.queueQuests.find(e => e.type == type);
    }

    public failQuest(type: QuestType) {
        
        const questBound = this.getQuest(type);
        if(!questBound) return;

        const writer = new BufferWriter(2);
        writer.writeUInt8(ServerPacketTypeBinary.QuestFailed);
        writer.writeUInt8(questBound.type);

        this.player.controller.sendBinary(writer.toBuffer());

        this.player.completeQuests[questBound.type] = QuestStateType.FAILED;
        this.removeQuest(questBound.type);
    }

    public succedQuest(type: QuestType) {

        const questBound = this.getQuest(type);
        if(!questBound) return;

        const writer = new BufferWriter(2);
        writer.writeUInt8(ServerPacketTypeBinary.QuestComplete);
        writer.writeUInt8(questBound.type);

        this.player.controller.sendBinary(writer.toBuffer());

        this.player.completeQuests[questBound.type] = QuestStateType.SUCCED;
        this.removeQuest(questBound.type);
    } 

    public tickUpdate() {

        for (let i = 0; i < this.queueQuests.length; i++) {
            let questBound = this.queueQuests[i];

            if(+new Date() - this.player.spawnTime > questBound.time) {
                
                switch(questBound.type) {
                    case QuestType.BLUE_CROWN:
                    case QuestType.GREEN_CROWN: {
                        this.succedQuest(questBound.type);

                        break;
                    }
                    default: {
                        this.failQuest(questBound.type);
                        break;
                    }
                }

            }
        }

    }
}