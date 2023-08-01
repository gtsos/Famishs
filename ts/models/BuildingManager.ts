import { Building } from "../entity/Building";
import { Entity } from "../entity/Entity";
import { MapObject } from "../entity/MapObject";
import { Player } from "../entity/Player";
import { Utils } from "../utils/Utils"
import serverSettings from "../settings/serverconfig.json";
export class BuildingManager {
    
    public sourcePlayer: Player;
    public buildings: number[]; // id array for builds xd
    public emeraldMachineId: number = -1;
    constructor (sourcePlayer: Player) {

        this.sourcePlayer = sourcePlayer;

        this.buildings = [];
    
    }

    

    addEmeraldMachine(id: number) {
        this.emeraldMachineId = id;
    }

    isLimited () {
        return this.buildings.length >= (serverSettings.server.buildingLimit - 1);
    }
    addBuilding(id: number) {
        this.buildings.push(id);
    }
    removeBuilding(id: number) {
        this.buildings = this.buildings.filter(b => b != id);
    }
    clearBuildings (forceDelete: boolean = false) {
        this.buildings = [];
    }
    hasBuilding(id: number) {
        return this.buildings.includes(id);
    }
    getBuildingTail(id: number): any {
        if(!this.hasBuilding(id)) return null;
        
        const entityList = this.sourcePlayer.gameServer.entities;

        for(let i = 0; i < entityList.length; i++) {
            if(entityList[i].id == id && Utils.isBuilding(entityList[i])) return entityList[i];
        }
        
        return null;
    }
 }