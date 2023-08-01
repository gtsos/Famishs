"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const Logger_1 = require("./logs/Logger");
const SocketServer_1 = require("./network/SocketServer");
const os_1 = __importDefault(require("os"));
const WorldTicker_1 = require("./world/WorldTicker");
const nanotimer_1 = __importDefault(require("nanotimer"));
const idPool_1 = require("./utils/idPool");
const WorldGenerator_1 = require("./world/WorldGenerator");
const queryManager_1 = require("./utils/queryManager");
const tokenManager_1 = require("./utils/tokenManager");
const itemsmanager_1 = require("./utils/itemsmanager");
const WorldSpawner_1 = require("./world/WorldSpawner");
const PacketType_1 = require("./enums/PacketType");
const WorldDeleter_1 = require("./world/WorldDeleter");
const crafts_json_1 = __importDefault(require("./settings/crafts.json"));
const CraftManager_1 = require("./craft/CraftManager");
const GlobalDataAnalyzer_1 = require("./protection/GlobalDataAnalyzer");
const Leaderboard_1 = require("./leaderboard/Leaderboard");
const WorldCycle_1 = require("./world/WorldCycle");
const EventManager_1 = require("./server/EventManager");
const ServerAPI_1 = require("./api/ServerAPI");
const fs_1 = __importDefault(require("fs"));
const ItemIds_1 = require("./enums/ItemIds");
class GameServer {
    httpServer;
    socketServer;
    worldTicker;
    worldGenerator;
    worldDeleter;
    worldCycle;
    queryManager;
    tokenManager;
    players;
    entityPool;
    playerPool;
    mobPool;
    worldSpawner;
    leaderboard;
    entities;
    livingEntities;
    updatableEntities;
    staticEntities;
    crafts;
    globalAnalyzer;
    eventManager;
    serverAPI = new ServerAPI_1.ServerAPI(this);
    gameConfiguration;
    static SERVER_TPS = 10;
    tokens_allowed;
    constructor(httpServer = null) {
        this.leaderboard = new Leaderboard_1.Leaderboard(this);
        this.loadConfiguration();
        Logger_1.Loggers.app.info(`Preparing GameInstance on ({0} / {1} {2})`, os_1.default.platform(), os_1.default.type(), os_1.default.release());
        this.tokens_allowed = [];
        /**
         * Do base constructors
         */
        this.players = new Map();
        this.entityPool = new idPool_1.IdPool(175);
        this.playerPool = new idPool_1.IdPool(1);
        this.mobPool = new idPool_1.IdPool(this.gameConfiguration.server.playerLimit * this.gameConfiguration.server.buildingLimit + 1000);
        /**
         * Entities initializer
         */
        this.entities = [];
        this.livingEntities = [];
        this.staticEntities = [];
        this.updatableEntities = [];
        /**
         * Setting http server , should be used for queries / api
         */
        this.httpServer = httpServer;
        /**
         * Setting socket server
         */
        this.socketServer = new SocketServer_1.SocketServer(this);
        /**
         * Creating ticker for gameUpdates
         */
        this.worldTicker = new WorldTicker_1.WorldTicker(this);
        /**
         * Creating generation stuff.
         */
        this.worldGenerator = new WorldGenerator_1.WorldGenerator(this);
        this.worldGenerator.generateWorld(this.gameConfiguration.world.map);
        this.worldCycle = new WorldCycle_1.WorldCycle(this);
        this.worldSpawner = new WorldSpawner_1.WorldSpawner(this);
        this.eventManager = new EventManager_1.EventManager(this, __dirname);
        /**
         * World Deleter stuff
         */
        this.worldDeleter = new WorldDeleter_1.WorldDeleter(this);
        /**
         * Creatin QueryManager for Entity stuff
         */
        this.queryManager = new queryManager_1.QueryManager(this);
        /**
         * Creating TokenManager for Player score stuff
         */
        this.tokenManager = new tokenManager_1.TokenManager(this);
        this.crafts = [];
        /**
         * Creating crafts inst
         */
        for (let craftInst of crafts_json_1.default) {
            this.crafts.push(new CraftManager_1.Craft(craftInst));
        }
        /**
         * Implementing nanoTimer intervals
         */
        this.setTicker();
        const asItem = itemsmanager_1.ItemUtils.getItemById(ItemIds_1.ItemIds.REIDITE_SPIKE);
        this.globalAnalyzer = new GlobalDataAnalyzer_1.GlobalDataAnalyzer(this);
        /*    for(let i = 2500; i < 7500; i+= 100) {
                    for(let j = 2500 ; j < 7500; j+= 100) {
                        let e = new Building(null, this.entityPool.nextId(), 1,this,1,asItem.data, asItem.metaType);
        
                        e.initEntityData(i,j,0,EntityType.REIDITE_SPIKE, true);
                        e.max_health = asItem.data.health;
                        e.health = asItem.data.health;
                        e.radius = asItem.data.radius;
                        e.abstractType = EntityAbstractType.LIVING;
        
                        e.initOwner(e);
                        e.setup();
        
                        e.info = e.health;
        
                        this.initLivingEntity(e)
                    
                        console.log(this.entities.length)
                    }
                }*/
    }
    loadConfiguration() {
        const data = fs_1.default.readFileSync(__dirname + "/settings/serverconfig.json", { encoding: "utf-8" });
        this.gameConfiguration = JSON.parse(data);
    }
    setTicker() {
        /**
         * GameWorld fixedUpdate , leaderboard/survival etc shit here
         */
        new nanotimer_1.default(false).setInterval(() => { this.worldTicker.fixedUpdate(); }, '', 1000 + "m");
        /**
         * GameWorld update , tps / collision updates here
         */
        new nanotimer_1.default(false).setInterval(() => { this.worldTicker.gameUpdate(); }, '', ~~(1000 / GameServer.SERVER_TPS) + "m");
        // new NanoTimer(false).setInterval(() => {
        //     this.worldTicker.preCollisionUpdate();
        // }, '', ~~(1000/30) + "m");
        /**
        * BlackList updater
        */
        // new NanoTimer(false).setInterval(() => {this.globalAnalyzer.updateListData()}, '', "60000m");
        // const e = new Entity(999, 0, this);
        //  e.initEntityData(5000,5000,0,EntityType.PLAYERS, false);
        // e.initOwner(new Player(new ConnectionPlayer(this, null as any, {headers: {}, connection: {}} as any), this.playerPool.nextId(),this,"",""))
        //   this.initLivingEntity(e);
        //  this.entities.push(e);
    }
    /**
     * Setting LivingEntity inst
     */
    initLivingEntity(entity) {
        this.livingEntities.push(entity);
        this.initEntityInst(entity);
        this.initUpdatableEntity(entity);
    }
    /**
     * Remove LivingEntity inst
     */
    removeLivingEntity(entity, isPlayer = false) {
        const newList = this.livingEntities.filter(e => e.id != entity.id);
        this.livingEntities = newList;
        this.removeUpdatableEntity(entity);
        this.removeEntity(entity, isPlayer);
    }
    /**
     * Remove Entity inst
     */
    removeEntity(entity, isPlayer = false) {
        const newList = this.entities.filter(e => e.id != entity.id);
        this.entities = newList;
        if (!isPlayer)
            this.entityPool.dispose(entity.id);
    }
    getPlayer(id) {
        return this.players.get(id);
    }
    getPlayerByToken(token, token_id) {
        return [...this.players.values()].find(e => e.gameProfile.token == token && e.gameProfile.token_id == token_id);
    }
    getEntity(id) {
        return this.entities.find(ent => ent.id == id);
    }
    /**
     * Remove Entity inst
     */
    removeUpdatableEntity(entity) {
        const newList = this.updatableEntities.filter(e => e.id != entity.id);
        this.updatableEntities = newList;
    }
    /**
     * Setting Entity inst
     */
    initEntityInst(entity) {
        this.entities.push(entity);
    }
    /**
     * Setting StaticEntity Inst
     */
    initStaticEntity(entity) {
        this.staticEntities.push(entity);
        this.initEntityInst(entity);
    }
    /**
   * Setting UpdatableEntity inst
   */
    initUpdatableEntity(entity) {
        this.updatableEntities.push(entity);
    }
    /**
     * Sending messages to all players as Json
     */
    broadcastJSON(packet, filterId = -1) {
        for (const player of this.players.values())
            if (player.playerId != filterId)
                player.controller.sendJSON(packet);
    }
    broadcastConsoleStaff(message) {
        for (const player of this.players.values())
            player.controller.sendJSON([PacketType_1.ServerPacketTypeJson.ConsoleCommandResponse, message]);
    }
    broadcastBinary(packet, filterId = -1) {
        for (const player of this.players.values())
            if (player.playerId != filterId)
                player.controller.sendBinary(packet);
    }
}
exports.GameServer = GameServer;
