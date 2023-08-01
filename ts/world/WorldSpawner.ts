import { GameServer } from "../GameServer";
import { Animal } from "../entity/Animal";
import { EntityType } from "../enums/EntityType";
import { EntityAbstractType } from "../utils/EntityUtils";
import { Entity } from "../entity/Entity"
import { getEntity } from "../utils/EntityUtils"
import { Utils } from "../utils/Utils"
import serverConfig from "../settings/serverconfig.json"
export class WorldSpawner {
    public spiders: number = 0;
    public wolfs: number = 0;
    public fishs: number = 0;
    public rabbits: number = 0;
    public boars: number = 0;
    public treasure: number = 0;
    public krakens: number = 0;

    public lastTreasureSpawned: number = -1;

    private gameServer: GameServer;
    
    constructor(gameServer: GameServer) {
        this.gameServer = gameServer;
    }

    public addAnimal(type: number) {
        const id = this.gameServer.entityPool.nextId();
        const entity = new Animal(id, this.gameServer);

        entity.abstractType = EntityAbstractType.LIVING;
     
        const pos = this.findFirstLocation();

        let x = pos != null ? pos[0] : 2500, y = pos != null ? pos[1] : 2500 , angle = 0;

        entity.onSpawn(x, y, 0, type);

        entity.initOwner(entity);
        entity.abstractType = EntityAbstractType.LIVING;
     
       
        this.gameServer.initLivingEntity(entity);
    }

    public addTreasure() {
        const id = this.gameServer.entityPool.nextId();

        const entity = new Entity(id, 0, this.gameServer);

        const island = serverConfig.world.islands[~~(Math.random() * serverConfig.world.islands.length)];

        const x = Utils.randomMaxMin(island[0][0], island[1][0]);
        const y = Utils.randomMaxMin(island[0][1], island[1][1]);

        entity.x = x;
        entity.y = y;//
        entity.type = EntityType.TREASURE_CHEST;

        entity.isSolid = false;
        entity.radius = this.gameServer.gameConfiguration.entities.treasure_chest.radius;
        entity.health = this.gameServer.gameConfiguration.entities.treasure_chest.health; //

        this.gameServer.initLivingEntity(entity);
        this.lastTreasureSpawned = +new Date();
    }
//
    public spawnEntities() {
//
        if(this.fishs < this.gameServer.gameConfiguration.other.max_fishs) {
            this.addAnimal(EntityType.PIRANHA);

            this.fishs++;
        }

        if(this.krakens < this.gameServer.gameConfiguration.other.max_krakens) {
            this.addAnimal(EntityType.KRAKEN);

            this.krakens++;
        }

        if(this.treasure < this.gameServer.gameConfiguration.other.max_treasure && +new Date() - this.lastTreasureSpawned > 10000) {
            this.addTreasure();

            this.treasure++;
        }

    }

    public findFirstLocation() {
        let attempts = 0, locationState = false;

        let cx = 0;
        let cy = 0;

        while(attempts < 100 && locationState == false) {
            cx = 1250 + ~~(Math.random() * (this.gameServer.gameConfiguration.world.Width - 2500));
            cy = 1250 + ~~(Math.random() * (this.gameServer.gameConfiguration.world.Height - 2500));

            const queryBack = this.gameServer.queryManager.queryCircle(cx, cy , 80);

            if(queryBack.length == 0 && !Utils.isInIsland({x: cx, y: cy})) 
                locationState = true;
            else attempts++;
        }

        return attempts >= 100 ? null : [cx,cy];
    }
}