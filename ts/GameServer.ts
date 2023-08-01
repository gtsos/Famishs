import * as http from 'http';
import { Logger, Loggers } from './logs/Logger';
import { SocketServer } from './network/SocketServer';
import os from "os";
import { WorldTicker } from './world/WorldTicker';
import NanoTimer from 'nanotimer';
import { Player } from './entity/Player';
import { IdPool } from './utils/idPool';
import { Entity } from './entity/Entity';
import { MapObject } from './entity/MapObject';
import { WorldGenerator } from './world/WorldGenerator';
import { QueryManager } from './utils/queryManager';
import { TokenManager } from './utils/tokenManager';
import { ItemUtils } from './utils/itemsmanager';
import { Animal } from './entity/Animal';
import { WorldSpawner } from './world/WorldSpawner';
import { ServerPacketTypeJson } from './enums/PacketType';
import { WorldDeleter } from './world/WorldDeleter';
import craftData from "./settings/crafts.json";
import { Craft } from './craft/CraftManager';
import { GlobalDataAnalyzer } from './protection/GlobalDataAnalyzer';
import { Leaderboard } from "./leaderboard/Leaderboard"
import { WorldCycle } from './world/WorldCycle';
import { EntityType } from './enums/EntityType';
import { ConnectionPlayer } from './network/ConnectionPlayer';
import { EventManager } from './server/EventManager';
import { ServerAPI } from './api/ServerAPI';
import fs from 'fs';
import { Building } from './entity/Building';
import { ItemIds } from './enums/ItemIds';
import { EntityAbstractType } from './utils/EntityUtils';
import { WorldEvents } from './world/WorldEvents';

export class GameServer {

    public readonly httpServer: http.Server;
    public socketServer: SocketServer;
    public worldTicker: WorldTicker;
    public worldGenerator: WorldGenerator;
    public worldDeleter: WorldDeleter;
    public worldCycle: WorldCycle;
    public queryManager: QueryManager;
    public tokenManager: TokenManager;

    public players: Map<number , Player>;
    public entityPool: IdPool;
    public playerPool: IdPool;
    public mobPool: IdPool;
    public worldSpawner: WorldSpawner;
    public leaderboard: Leaderboard;

    public entities: (MapObject | Entity | Animal)[];
    public livingEntities: Entity[];
    public updatableEntities: Entity[];
    public staticEntities: (MapObject | Entity | Animal) [];

    public crafts: Craft[];
    public globalAnalyzer: GlobalDataAnalyzer;
    public eventManager: EventManager;
    public serverAPI: ServerAPI = new ServerAPI(this);
    public gameConfiguration: any;
    public static SERVER_TPS = 10;
    public tokens_allowed: any;
    
    public constructor (httpServer: any = null) {

        
        this.leaderboard = new Leaderboard(this);
        this.loadConfiguration();


        Loggers.app.info(`Preparing GameInstance on ({0} / {1} {2})`, os.platform(), os.type(), os.release());
       
        this.tokens_allowed = [];

        /**
         * Do base constructors
         */
        this.players = new Map();
        this.entityPool = new IdPool(175);
        this.playerPool = new IdPool(1);

        this.mobPool = new IdPool(this.gameConfiguration.server.playerLimit * this.gameConfiguration.server.buildingLimit + 1000);
       
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
        this.socketServer = new SocketServer(this);

        /**
         * Creating ticker for gameUpdates
         */
        this.worldTicker = new WorldTicker(this);
        
        /**
         * Creating generation stuff.
         */
        this.worldGenerator = new WorldGenerator(this);
        this.worldGenerator.generateWorld(this.gameConfiguration.world.map);
        this.worldCycle = new WorldCycle(this);
    

        this.worldSpawner = new WorldSpawner(this);
        
        this.eventManager = new EventManager(this, __dirname);
        /**
         * World Deleter stuff
         */
        this.worldDeleter = new WorldDeleter(this);
       
        /**
         * Creatin QueryManager for Entity stuff
         */
        this.queryManager = new QueryManager(this);

        /**
         * Creating TokenManager for Player score stuff
         */
        this.tokenManager = new TokenManager(this);

        this.crafts = [];
        /**
         * Creating crafts inst
         */
        for(let craftInst of craftData) {
            this.crafts.push(new Craft(craftInst))
        }

        /**
         * Implementing nanoTimer intervals
         */
        this.setTicker();

        const asItem = ItemUtils.getItemById(ItemIds.REIDITE_SPIKE);

        this.globalAnalyzer = new GlobalDataAnalyzer(this);

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
    
    public loadConfiguration () {
        const data = fs.readFileSync(__dirname + "/settings/serverconfig.json", { encoding: "utf-8"})
        
        this.gameConfiguration = JSON.parse(data as any);
    }

    public setTicker () {
        /**
         * GameWorld fixedUpdate , leaderboard/survival etc shit here
         */

        new NanoTimer(false).setInterval(() => {this.worldTicker.fixedUpdate()}, '', 1000 + "m");

        /**
         * GameWorld update , tps / collision updates here
         */

        new NanoTimer(false).setInterval(() => {this.worldTicker.gameUpdate()}, '', ~~(1000/GameServer.SERVER_TPS) + "m");

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
    public initLivingEntity (entity: Entity) {
        this.livingEntities.push(entity);
        this.initEntityInst(entity);
        this.initUpdatableEntity(entity);
    }
    /**
     * Remove LivingEntity inst
     */
    public removeLivingEntity (entity: Entity, isPlayer: boolean = false) {
        const newList = this.livingEntities.filter(e => e.id != entity.id);
        this.livingEntities = newList;

        this.removeUpdatableEntity(entity);
        this.removeEntity(entity, isPlayer);

    }
    /**
     * Remove Entity inst
     */
    public removeEntity (entity: Entity, isPlayer: boolean = false) {
        const newList = this.entities.filter(e => e.id != entity.id);
        this.entities = newList;

        if (!isPlayer)
            this.entityPool.dispose(entity.id);
    }

    public getPlayer(id: number): Player | undefined {
        return this.players.get(id);
    }

    public getPlayerByToken(token: string, token_id: string) {
        return [ ...this.players.values()].find(e => e.gameProfile.token == token && e.gameProfile.token_id == token_id);
    }

    public getEntity(id: number): any {
        return this.entities.find(ent => ent.id == id);
    }
    /**
     * Remove Entity inst
     */
    public removeUpdatableEntity (entity: Entity) {
        const newList = this.updatableEntities.filter(e => e.id != entity.id);
        this.updatableEntities = newList;
    }
    /**
     * Setting Entity inst
     */
    public initEntityInst (entity: MapObject | Entity) {
        this.entities.push(entity);
    }
    /**
     * Setting StaticEntity Inst
     */
    public initStaticEntity(entity: MapObject | Entity) {
        this.staticEntities.push(entity);
        this.initEntityInst(entity);
    }
      /**
     * Setting UpdatableEntity inst
     */
    public initUpdatableEntity(entity: Entity) {
        this.updatableEntities.push(entity);
    }
    /**
     * Sending messages to all players as Json
     */
    public broadcastJSON(packet: any[], filterId:number = -1) {
        for(const player of this.players.values()) 
            if(player.playerId != filterId) player.controller.sendJSON(packet);
    }
    public broadcastConsoleStaff(message: string) {
        for(const player of this.players.values())
            player.controller.sendJSON([ServerPacketTypeJson.ConsoleCommandResponse, message]);
    }
    public broadcastBinary(packet: any, filterId:number = -1) {
        for(const player of this.players.values()) 
            if(player.playerId != filterId) player.controller.sendBinary(packet);
    }
}