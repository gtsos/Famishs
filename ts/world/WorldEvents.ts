import { Player } from "../entity/Player";
import { EntityType } from "../enums/EntityType";
import { ServerPacketTypeBinary, ServerPacketTypeJson } from "../enums/PacketType";
import { GameServer } from "../GameServer";
import { IHandshake } from "../models/IHandshake";
import { ConnectionPlayer } from "../network/ConnectionPlayer";
import { Utils } from "../utils/Utils";
import { Entity } from "../entity/Entity";
import { EntityAbstractType } from "../utils/EntityUtils";
import { DieReason } from "../enums/DieReason";
import { BufferWriter } from "../utils/bufferReader";
import { Box } from "../entity/Box";
import { Animal } from "../entity/Animal"
import { getEntity } from "../utils/EntityUtils";
import { ItemUtils } from "../utils/itemsmanager";
import { ItemIds } from "../enums/ItemIds";
import { Loggers } from "../logs/Logger";
import { Building } from "../entity/Building";
import { ENV_MODE } from "..";
import { MODES } from "../types/env.mode";
import { TokenScore } from "../utils/tokenManager";
export class WorldEvents {
    /**
     * Calls when socket verified and joined
     */
    public static registerPlayer (controller: ConnectionPlayer, handshake: IHandshake, tokenScore: TokenScore): Player {
       
        const gameServer: GameServer = controller.gameServer;

        const id = gameServer.playerPool.nextId();

        const player = new Player(controller, id , gameServer, tokenScore, handshake.token, handshake.token_id);

        player.radius = controller.gameServer.gameConfiguration.entities.player.hitbox_size;
        player.max_speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default;
        player.speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default;
       
        const pos = gameServer.worldSpawner.findFirstLocation();

        let x = pos != null ? pos[0] : 2500, y = pos != null ? pos[1] : 2500 , angle = 0;

        /**
          * Adding player to gameServer
          */
        gameServer.players.set(id,player);
        gameServer.initLivingEntity(player);

        player.initOwner(player);
        player.gameProfile.name = handshake.name;
        player.abstractType = EntityAbstractType.LIVING;

        // if(ENV_MODE == MODES.TEST || ENV_MODE == MODES.DEV) {
        //     x = 8300;
        //     y = 5300;
        //     player.isAdmin = true;
        // }w
        // x = 9600;
        // y = 9800;
        
        //
        
        /**
         * Init entity stuff
         */
        player.initEntityData(x,y,angle, EntityType.PLAYERS , false);

        /**
         * Sending to socket handshake response
         */

        player.controller.sendJSON([ServerPacketTypeJson.Handshake, ...Utils.backInHandshake(player, handshake , tokenScore)]);

        /**
         * We sends everyone that player Joined
         */

        gameServer.broadcastJSON([
            ServerPacketTypeJson.NewPlayer,
            player.playerId,
            ENV_MODE == MODES.TEST ? "Tester" : player.gameProfile.name,
            player.gameProfile.skin,
            player.gameProfile.accessory,
            player.gameProfile.baglook,
            player.gameProfile.book,
            player.gameProfile.box,
            player.gameProfile.deadBox,
            player.gameProfile.level
        ], player.playerId);

       // player.x = 5000;
       // player.y = 5000;

        if(player.bag) player.inventory.getBag()

        Loggers.game.info(`Player with Id ${player.id} joined as ${player.gameProfile.name} with ${player.controller.userIp}`);
        return player;
    }

    /**
     * LeaderboardUpdate calls every 5secs
     */

    public static sendLeaderboardUpdate(gameServer: GameServer) {
        
        const playersArray:object[] = [];

        for(const player of gameServer.players.values()) {
            playersArray.push([player.playerId, player.gameProfile.score])
        }

        gameServer.broadcastJSON([ServerPacketTypeJson.LeaderboardUpdate, playersArray]);

    }

    public static onTotemBreak(entity: Building) {
        const writer = new BufferWriter(1);

        writer.writeUInt8(ServerPacketTypeBinary.TeamIsDestroyed);
        
        for (let i = 0; i < entity.data.length; i++) {
            const player = entity.data[i];

            player.controller.sendBinary(writer.toBuffer());

            player.totemFactory = null;
            player.lastTotemCooldown = +new Date();
        }
    }

    public static addBox(owner: Player | Entity, type: number, loot: any) {
        const gameServer: GameServer = owner.gameServer;
        const id: number = gameServer.entityPool.nextId();

        const box = new Box(id, owner, gameServer);

        const info = owner instanceof Player ? type == EntityType.CRATE ? owner.gameProfile.box : owner.gameProfile.deadBox : Utils.getBoxSkin(owner.type);
        
        box.onSpawn(owner.x, owner.y, owner.angle, type, info);

        box.radius = 30;
        for (let i = 0; i < loot.length; i++) {
            box.setLoot(loot[i][0], loot[i][1]);
        };

        box.initOwner(box);

        gameServer.initLivingEntity(box);
    }

    /**
     * Player died event
     */

    public static playerDied(gameServer: GameServer, entity: Player) {

        gameServer.worldDeleter.initEntity(entity, "player");

        gameServer.players.delete(entity.id);

        WorldEvents.addBox(entity, EntityType.DEAD_BOX, entity.inventory.toArray());
        
        if ( entity.tokenScore.session_id === entity.gameProfile.token_id) {

            entity.tokenScore.score += entity.gameProfile.score;
            entity.tokenScore.session_id = 0;
            gameServer.tokenManager.leaveToken(entity.tokenScore);

        }

        entity.controller.sendJSON([ServerPacketTypeJson.KillPlayer, DieReason.PLAYER_KILLED, entity.gameProfile.score, entity.gameProfile.kills]);

        entity.controller.closeSocket();

        gameServer.leaderboard.writeLb({
            name: entity.gameProfile.name,
            score: Math.floor(entity.gameProfile.score),
            kills: Math.floor(entity.gameProfile.kills),
            days: Math.floor(entity.gameProfile.days)
        });

        gameServer.serverAPI.socket.send(JSON.stringify([
            209,
            gameServer.leaderboard.leaderboard
        ]))
        
    }
    
    /**
     * Entity died event
     */

    public static entityDied(gameServer: GameServer , entity: Entity) {
        if(Utils.isBuilding(entity)) {
            gameServer.worldDeleter.initEntity(entity, "building"); 
        }else {
            gameServer.worldDeleter.initEntity(entity, "living"); 
        } 

        if(entity.type == EntityType.TREASURE_CHEST) return;

        const _entity = getEntity(entity.type);
        
        if (!_entity) return;

        const toDrop: any[] = [];
        for (let i = 0; i < _entity.drop.length; i++) {
            const drop = _entity.drop[i];

            const item = ItemIds[drop[0]];
            const count = drop[1];

            toDrop.push([item, count]);
        };
        WorldEvents.addBox(entity, EntityType.CRATE, toDrop);
    }
}