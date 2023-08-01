"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCommand = void 0;
const ItemIds_1 = require("../enums/ItemIds");
const PacketType_1 = require("../enums/PacketType");
const Logger_1 = require("../logs/Logger");
const ConsoleManager_1 = require("../models/ConsoleManager");
function executeCommand(data, gameServer) {
    data = data.split(" ");
    const cmdName = data[0].toLowerCase();
    const args = data.slice(1);
    let targetPlayer = null;
    switch (cmdName) {
        case "say":
        case "bc": {
            let builtInString = "";
            for (let i = 0; i < args.length; i++) {
                builtInString += args[i] + " ";
            }
            if (builtInString.length > 0)
                gameServer.broadcastJSON([PacketType_1.ServerPacketTypeJson.AlertMessage, builtInString]);
            break;
        }
        case "give":
        case "g": {
            const item = ItemIds_1.ItemIds[args[0].toUpperCase()];
            if (!item) {
                Logger_1.Loggers.game.info(`Kill Resolve Event, item not found with name ${args[0]}`);
                return;
            }
            let count = args.length > 1 ? args[1] : 1;
            if (isNaN(count))
                count = 1;
            if (count >= 60000)
                count = 60000;
            if (args.length > 2) {
                let foundPlayer = (0, ConsoleManager_1.findPlayerByIdOrName)(args[2], gameServer);
                if (foundPlayer) {
                    targetPlayer = foundPlayer;
                }
                else
                    return;
            }
            targetPlayer.inventory.addItem(item, count);
            break;
        }
    }
}
exports.executeCommand = executeCommand;
