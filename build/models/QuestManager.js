"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestManager = void 0;
const QuestType_1 = require("../enums/QuestType");
const PacketType_1 = require("../enums/PacketType");
const bufferReader_1 = require("../utils/bufferReader");
const QUESTS_LIST = [
    //[QuestType.DRAGON_ORB, (1000 * 60 * 8) * 5],
    //[QuestType.DRAGON_CUBE, (1000 * 60 * 8) * 2],
    [QuestType_1.QuestType.ORANGE_CROWN, (1000 * 60 * 8) * 2],
    [QuestType_1.QuestType.GREEN_CROWN, (1000 * 60 * 8) * 3],
    //[QuestType.BLUE_CROWN, (1000 * 60 * 8) * 5]
];
class Quest {
    time;
    type;
    constructor(type, time) {
        this.type = type;
        this.time = time;
    }
}
class QuestManager {
    player;
    queueQuests = [];
    constructor(player) {
        this.player = player;
        for (let i = 0; i < QUESTS_LIST.length; i++) {
            this.queueQuests.push(new Quest(QUESTS_LIST[i][0], QUESTS_LIST[i][1]));
        }
    }
    checkQuestState(type) {
        return this.player.completeQuests[type] != -1;
    }
    removeQuest(type) {
        this.queueQuests = this.queueQuests.filter(e => e.type != type);
    }
    getQuest(type) {
        return this.queueQuests.find(e => e.type == type);
    }
    failQuest(type) {
        const questBound = this.getQuest(type);
        if (!questBound)
            return;
        const writer = new bufferReader_1.BufferWriter(2);
        writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.QuestFailed);
        writer.writeUInt8(questBound.type);
        this.player.controller.sendBinary(writer.toBuffer());
        this.player.completeQuests[questBound.type] = QuestType_1.QuestStateType.FAILED;
        this.removeQuest(questBound.type);
    }
    succedQuest(type) {
        const questBound = this.getQuest(type);
        if (!questBound)
            return;
        const writer = new bufferReader_1.BufferWriter(2);
        writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.QuestComplete);
        writer.writeUInt8(questBound.type);
        this.player.controller.sendBinary(writer.toBuffer());
        this.player.completeQuests[questBound.type] = QuestType_1.QuestStateType.SUCCED;
        this.removeQuest(questBound.type);
    }
    tickUpdate() {
        for (let i = 0; i < this.queueQuests.length; i++) {
            let questBound = this.queueQuests[i];
            if (+new Date() - this.player.spawnTime > questBound.time) {
                switch (questBound.type) {
                    case QuestType_1.QuestType.BLUE_CROWN:
                    case QuestType_1.QuestType.GREEN_CROWN: {
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
exports.QuestManager = QuestManager;
