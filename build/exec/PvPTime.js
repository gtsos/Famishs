"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardPlayer = exports.resolveKill = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const rewardList = [
    {
        value: 1,
        rewardItems: [[ItemIds_1.ItemIds.SWORD_GOLD, 1], [ItemIds_1.ItemIds.PLANT, 25], [ItemIds_1.ItemIds.BANDAGE, 4], [ItemIds_1.ItemIds.WOOD_HELMET, 1], [ItemIds_1.ItemIds.WALL, 5], [ItemIds_1.ItemIds.WOOD_SHIELD, 1]],
        rewardScore: 500,
        alertMessage: "Your first kill!!!"
    },
    {
        value: 2,
        rewardItems: [[ItemIds_1.ItemIds.SPEAR, 1], [ItemIds_1.ItemIds.PLANT, 35], [ItemIds_1.ItemIds.BANDAGE, 6], [ItemIds_1.ItemIds.STONE_HELMET, 1], [ItemIds_1.ItemIds.HAMMER_GOLD, 1], [ItemIds_1.ItemIds.WALL, 5], [ItemIds_1.ItemIds.STONE_SHIELD, 1]],
        rewardScore: 500,
        alertMessage: "The second kill, your influence begins to grow."
    },
    {
        value: 3,
        rewardItems: [[ItemIds_1.ItemIds.SWORD_DIAMOND, 1], [ItemIds_1.ItemIds.GOLD_HELMET, 1], [ItemIds_1.ItemIds.PLANT, 100], [ItemIds_1.ItemIds.BANDAGE, 8], [ItemIds_1.ItemIds.STONE_SPIKE, 4], [ItemIds_1.ItemIds.GOLD_SPIKE, 2]],
        rewardScore: 500,
        alertMessage: "Triple kill, are you worked as killer before?"
    },
    {
        value: 4,
        rewardItems: [[ItemIds_1.ItemIds.DIAMOND_SPEAR, 1], [ItemIds_1.ItemIds.PLANT, 200], [ItemIds_1.ItemIds.BANDAGE, 10], [ItemIds_1.ItemIds.GOLD_SPIKE, 5], [ItemIds_1.ItemIds.HAMMER_DIAMOND, 1], [ItemIds_1.ItemIds.GOLD_SHIELD, 1]],
        rewardScore: 1000,
        alertMessage: "Diamond sword and golden spikes, that's definitely what you need!"
    },
    {
        value: 5,
        rewardItems: [[ItemIds_1.ItemIds.SWORD_AMETHYST, 1], [ItemIds_1.ItemIds.DIAMOND_HELMET, 1], [ItemIds_1.ItemIds.PLANT, 512], [ItemIds_1.ItemIds.BANDAGE, 15], [ItemIds_1.ItemIds.GOLD_SPIKE, 3]],
        rewardScore: 1000,
        alertMessage: "You're already halfway there, now your new sword shines like this... Amethyst?"
    },
    {
        value: 6,
        rewardItems: [[ItemIds_1.ItemIds.AMETHYST_SPEAR, 1], [ItemIds_1.ItemIds.PLANT, 500], [ItemIds_1.ItemIds.BANDAGE, 20], [ItemIds_1.ItemIds.DIAMOND_SPIKE, 5], [ItemIds_1.ItemIds.GOLD_SPIKE, 12], [ItemIds_1.ItemIds.DIAMOND_SHIELD, 1]],
        rewardScore: 2500,
        alertMessage: "The gods are watching you!"
    },
    {
        value: 7,
        rewardItems: [[ItemIds_1.ItemIds.REIDITE_SWORD, 1], [ItemIds_1.ItemIds.PLANT, 1500], [ItemIds_1.ItemIds.BANDAGE, 35], [ItemIds_1.ItemIds.AMETHYST_SPIKE, 3], [ItemIds_1.ItemIds.DIAMOND_SPIKE, 8]],
        rewardScore: 2500,
        alertMessage: "For the work you have done you get a reidite sword - the strongest sword available to ordinary people."
    },
    {
        value: 8,
        rewardItems: [[ItemIds_1.ItemIds.REIDITE_SPEAR, 1], [ItemIds_1.ItemIds.AMETHYST_HELMET, 1], [ItemIds_1.ItemIds.PLANT, 2048], [ItemIds_1.ItemIds.BANDAGE, 35], [ItemIds_1.ItemIds.AMETHYST_SPIKE, 4], [ItemIds_1.ItemIds.DIAMOND_SPIKE, 6], [ItemIds_1.ItemIds.HAMMER_AMETHYST, 1]],
        rewardScore: 5500,
        alertMessage: "A skilled killer needs a overpowered spear."
    },
    {
        value: 9,
        rewardItems: [[ItemIds_1.ItemIds.DRAGON_SWORD, 1], [ItemIds_1.ItemIds.PLANT, 2500], [ItemIds_1.ItemIds.BANDAGE, 35], [ItemIds_1.ItemIds.REIDITE_SPIKE, 3], [ItemIds_1.ItemIds.AMETHYST_SPIKE, 6], [ItemIds_1.ItemIds.AMETHYST_SHIELD, 1]],
        rewardScore: 10000,
        alertMessage: "You are the GODLIKE!"
    },
    {
        value: 10,
        rewardItems: [[ItemIds_1.ItemIds.TOTEM, 1], [ItemIds_1.ItemIds.DRAGON_SPEAR, 1], [ItemIds_1.ItemIds.DRAGON_HELMET, 1], [ItemIds_1.ItemIds.PLANT, 9176], [ItemIds_1.ItemIds.BANDAGE, 50], [ItemIds_1.ItemIds.REIDITE_SPIKE, 3], [ItemIds_1.ItemIds.AMETHYST_SPIKE, 10]],
        rewardScore: 10999,
        alertMessage: "You've come this way and become a great killer."
    },
    {
        value: 15,
        rewardItems: [[ItemIds_1.ItemIds.CROWN_GREEN, 1], [ItemIds_1.ItemIds.REIDITE_SPIKE, 8], [ItemIds_1.ItemIds.AMETHYST_SPIKE, 10], [ItemIds_1.ItemIds.HAMMER_REIDITE, 1]],
        rewardScore: 10999,
        alertMessage: "Finally, green crown.. Now only lava"
    },
    {
        value: 20,
        rewardItems: [[ItemIds_1.ItemIds.AMETHYST_SPIKE, 10]],
        rewardScore: 10999,
        alertMessage: "Lava sword , sword of gods."
    },
    {
        value: 21,
        rewardItems: [[ItemIds_1.ItemIds.AMETHYST_SPIKE, 15]],
        rewardScore: 10999,
        alertMessage: "Almost god.",
    },
    {
        value: 22,
        rewardItems: [[ItemIds_1.ItemIds.REIDITE_SPIKE, 15]],
        rewardScore: 10999,
        alertMessage: "Finally, everything passed."
    },
    {
        value: 23,
        rewardItems: [[ItemIds_1.ItemIds.REIDITE_SHIELD, 1], [ItemIds_1.ItemIds.REIDITE_WALL, 5]],
        rewardScore: 10000,
        alertMessage: "Bonus items :3"
    }
];
function resolveKill(killer, entity) {
    killer.gameProfile.kills++;
    rewardPlayer(killer);
    killer.health = 200;
    killer.gaugesManager.healthUpdate();
}
exports.resolveKill = resolveKill;
function rewardPlayer(pl) {
    if (pl.gameProfile.kills > 23) {
        pl.gameProfile.score += (~~(Math.random() * 6999));
        let randomItemArray = [[ItemIds_1.ItemIds.SPANNER, 1],
            [ItemIds_1.ItemIds.REIDITE_WALL, 1 + ~~(Math.random() * 4)],
            [ItemIds_1.ItemIds.REIDITE_DOOR, 1 + ~~(Math.random() * 4)],
            [ItemIds_1.ItemIds.REIDITE_DOOR_SPIKE, 1 + ~~(Math.random() * 4)],
            [ItemIds_1.ItemIds.WALL, 1 + ~~(Math.random() * 16)],
            [ItemIds_1.ItemIds.GOLD_SPIKE, 1 + ~~(Math.random() * 5)],
            [ItemIds_1.ItemIds.DIAMOND_SPIKE, 1 + ~~(Math.random() * 5)],
            [ItemIds_1.ItemIds.AMETHYST_SPIKE, 1 + ~~(Math.random() * 5)],
            [ItemIds_1.ItemIds.REIDITE_SPIKE, 1 + ~~(Math.random() * 4)],
            [ItemIds_1.ItemIds.BANDAGE, 1 + ~~(Math.random() * 16)]
        ];
        let choosedItem = randomItemArray[~~(Math.random() * randomItemArray.length)];
        pl.inventory.addItem(choosedItem[0], choosedItem[1]);
        return;
    }
    for (const rewardData of rewardList) {
        const rwData = rewardData;
        if (rwData.value == pl.gameProfile.kills) {
            for (let i = 0; i < rwData.rewardItems.length; i++) {
                pl.inventory.addItem(rwData.rewardItems[i][0], rwData.rewardItems[i][1]);
            }
            if (rwData.alertMessage.length > 0)
                pl.controller.sendJSON([4, rwData.alertMessage]);
            if (rwData.rewardScore > 0)
                pl.gameProfile.score += rwData.rewardScore;
        }
    }
}
exports.rewardPlayer = rewardPlayer;
