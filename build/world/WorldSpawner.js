"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldSpawner = void 0;
const Animal_1 = require("../entity/Animal");
const EntityType_1 = require("../enums/EntityType");
const EntityUtils_1 = require("../utils/EntityUtils");
const Entity_1 = require("../entity/Entity");
const Utils_1 = require("../utils/Utils");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
class WorldSpawner {
    spiders = 0;
    wolfs = 0;
    fishs = 0;
    rabbits = 0;
    boars = 0;
    treasure = 0;
    krakens = 0;
    lastTreasureSpawned = -1;
    gameServer;
    constructor(gameServer) {
        this.gameServer = gameServer;
    }
    addAnimal(type) {
        const id = this.gameServer.entityPool.nextId();
        const entity = new Animal_1.Animal(id, this.gameServer);
        entity.abstractType = EntityUtils_1.EntityAbstractType.LIVING;
        const pos = this.findFirstLocation();
        let x = pos != null ? pos[0] : 2500, y = pos != null ? pos[1] : 2500, angle = 0;
        entity.onSpawn(x, y, 0, type);
        entity.initOwner(entity);
        entity.abstractType = EntityUtils_1.EntityAbstractType.LIVING;
        this.gameServer.initLivingEntity(entity);
    }
    addTreasure() {
        const id = this.gameServer.entityPool.nextId();
        const entity = new Entity_1.Entity(id, 0, this.gameServer);
        const island = serverconfig_json_1.default.world.islands[~~(Math.random() * serverconfig_json_1.default.world.islands.length)];
        const x = Utils_1.Utils.randomMaxMin(island[0][0], island[1][0]);
        const y = Utils_1.Utils.randomMaxMin(island[0][1], island[1][1]);
        entity.x = x;
        entity.y = y; //
        entity.type = EntityType_1.EntityType.TREASURE_CHEST;
        entity.isSolid = false;
        entity.radius = this.gameServer.gameConfiguration.entities.treasure_chest.radius;
        entity.health = this.gameServer.gameConfiguration.entities.treasure_chest.health; //
        this.gameServer.initLivingEntity(entity);
        this.lastTreasureSpawned = +new Date();
    }
    //
    spawnEntities() {
        //
        if (this.fishs < this.gameServer.gameConfiguration.other.max_fishs) {
            this.addAnimal(EntityType_1.EntityType.PIRANHA);
            this.fishs++;
        }
        if (this.krakens < this.gameServer.gameConfiguration.other.max_krakens) {
            this.addAnimal(EntityType_1.EntityType.KRAKEN);
            this.krakens++;
        }
        if (this.treasure < this.gameServer.gameConfiguration.other.max_treasure && +new Date() - this.lastTreasureSpawned > 10000) {
            this.addTreasure();
            this.treasure++;
        }
    }
    findFirstLocation() {
        let attempts = 0, locationState = false;
        let cx = 0;
        let cy = 0;
        while (attempts < 100 && locationState == false) {
            cx = 1250 + ~~(Math.random() * (this.gameServer.gameConfiguration.world.Width - 2500));
            cy = 1250 + ~~(Math.random() * (this.gameServer.gameConfiguration.world.Height - 2500));
            const queryBack = this.gameServer.queryManager.queryCircle(cx, cy, 80);
            if (queryBack.length == 0 && !Utils_1.Utils.isInIsland({ x: cx, y: cy }))
                locationState = true;
            else
                attempts++;
        }
        return attempts >= 100 ? null : [cx, cy];
    }
}
exports.WorldSpawner = WorldSpawner;
