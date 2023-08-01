import { GameServer } from "../GameServer";
import { EntityType } from "../enums/EntityType";
import { CollisionUtils } from "../math/CollisionUtils";
import { WorldEvents } from "./WorldEvents";

export class WorldTicker {
    
    public gameServer: GameServer;
    public lastSurvivalUpdate: number = +new Date();
    public lastActionChange: number = +new Date();

    public constructor(gameServer: GameServer) {
        this.gameServer = gameServer;
    }

    // public preCollisionUpdate() {
    //     for(let entity of this.gameServer.players.values()) {
    //         if(entity.direction > 0) 
    //             CollisionUtils.scheduleCollision(entity);
    //     }
        
    // }
    public gameUpdate() {
        this.gameServer.eventManager.loop();
        /**
         * Updating entities then sending entityUpdate
         */
        this.gameServer.worldDeleter.queryDelete();

        for(let i = 0; i < this.gameServer.livingEntities.length; i++) 
            this.gameServer.livingEntities[i].update();
        
        for(const player of this.gameServer.players.values()) 
            player.syncUpdate();

        for(let i = 0; i < this.gameServer.livingEntities.length; i++) 
            this.gameServer.livingEntities[i].updateBefore();
        
    }
    public fixedUpdate() {
        const now = +new Date();
        
        
        if(now - this.lastSurvivalUpdate >= 4999) {
            for(const player of this.gameServer.players.values()) 
              player.survivalUpdate();

            WorldEvents.sendLeaderboardUpdate(this.gameServer);
            this.lastSurvivalUpdate = now;
        }
        
        for(let i = 0; i < this.gameServer.staticEntities.length; i++) {
            this.gameServer.staticEntities[i].update();
        }

        this.gameServer.worldSpawner.spawnEntities();
        this.gameServer.worldCycle.update();
    }
}