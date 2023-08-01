"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingManager = void 0;
const Utils_1 = require("../utils/Utils");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
class BuildingManager {
    sourcePlayer;
    buildings; // id array for builds xd
    emeraldMachineId = -1;
    constructor(sourcePlayer) {
        this.sourcePlayer = sourcePlayer;
        this.buildings = [];
    }
    addEmeraldMachine(id) {
        this.emeraldMachineId = id;
    }
    isLimited() {
        return this.buildings.length >= (serverconfig_json_1.default.server.buildingLimit - 1);
    }
    addBuilding(id) {
        this.buildings.push(id);
    }
    removeBuilding(id) {
        this.buildings = this.buildings.filter(b => b != id);
    }
    clearBuildings(forceDelete = false) {
        this.buildings = [];
    }
    hasBuilding(id) {
        return this.buildings.includes(id);
    }
    getBuildingTail(id) {
        if (!this.hasBuilding(id))
            return null;
        const entityList = this.sourcePlayer.gameServer.entities;
        for (let i = 0; i < entityList.length; i++) {
            if (entityList[i].id == id && Utils_1.Utils.isBuilding(entityList[i]))
                return entityList[i];
        }
        return null;
    }
}
exports.BuildingManager = BuildingManager;
