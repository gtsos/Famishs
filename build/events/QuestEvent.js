"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QuestType_1 = require("../enums/QuestType");
const Utils_1 = require("../utils/Utils");
const bufferReader_1 = require("../utils/bufferReader");
const PacketType_1 = require("../enums/PacketType");
class QuestEvents {
    static onClaimQuestReward(type, player) {
        console.log(type, player.completeQuests[type]);
        let CompleteQuest = player.completeQuests[type];
        if (CompleteQuest != QuestType_1.QuestStateType.SUCCED) {
            return;
        }
        let QuestReward = Utils_1.Utils.getQuestRewardByQuestType(type);
        if (QuestReward == null || player.inventory.isInventoryFull(QuestReward[1])) {
            return;
        }
        const writer = new bufferReader_1.BufferWriter(2);
        writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Claimed);
        writer.writeUInt8(type);
        player.controller.sendBinary(writer.toBuffer());
        player.inventory.addItem(QuestReward[1], 1);
        player.gameProfile.score += QuestReward[0];
        player.completeQuests[type] = QuestType_1.QuestStateType.CLAIMED;
    }
}
exports.default = QuestEvents;
