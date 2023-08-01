"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldEvents = void 0;
const Player_1 = require("../entity/Player");
const EntityType_1 = require("../enums/EntityType");
const PacketType_1 = require("../enums/PacketType");
const Utils_1 = require("../utils/Utils");
const EntityUtils_1 = require("../utils/EntityUtils");
const DieReason_1 = require("../enums/DieReason");
const bufferReader_1 = require("../utils/bufferReader");
const Box_1 = require("../entity/Box");
const EntityUtils_2 = require("../utils/EntityUtils");
const ItemIds_1 = require("../enums/ItemIds");
const Logger_1 = require("../logs/Logger");
const __1 = require("..");
const env_mode_1 = require("../types/env.mode");
class WorldEvents {
    /**
     * Calls when socket verified and joined
     */
    static registerPlayer(controller, handshake, tokenScore) {
        const gameServer = controller.gameServer;
        const id = gameServer.playerPool.nextId();
        const player = new Player_1.Player(controller, id, gameServer, tokenScore, handshake.token, handshake.token_id);
        player.radius = controller.gameServer.gameConfiguration.entities.player.hitbox_size;
        player.max_speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default;
        player.speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default;
        const pos = gameServer.worldSpawner.findFirstLocation();
        let x = pos != null ? pos[0] : 2500, y = pos != null ? pos[1] : 2500, angle = 0;
        /**
          * Adding player to gameServer
          */
        gameServer.players.set(id, player);
        gameServer.initLivingEntity(player);
        player.initOwner(player);
        player.gameProfile.name = handshake.name;
        player.abstractType = EntityUtils_1.EntityAbstractType.LIVING;
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
        player.initEntityData(x, y, angle, EntityType_1.EntityType.PLAYERS, false);
        /**
         * Sending to socket handshake response
         */
        player.controller.sendJSON([PacketType_1.ServerPacketTypeJson.Handshake, ...Utils_1.Utils.backInHandshake(player, handshake, tokenScore)]);
        /**
         * We sends everyone that player Joined
         */
        gameServer.broadcastJSON([
            PacketType_1.ServerPacketTypeJson.NewPlayer,
            player.playerId,
            __1.ENV_MODE == env_mode_1.MODES.TEST ? "Tester" : player.gameProfile.name,
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
        if (player.bag)
            player.inventory.getBag();
        Logger_1.Loggers.game.info(`Player with Id ${player.id} joined as ${player.gameProfile.name} with ${player.controller.userIp}`);
        return player;
    }
    /**
     * LeaderboardUpdate calls every 5secs
     */
    static sendLeaderboardUpdate(gameServer) {
        const playersArray = [];
        for (const player of gameServer.players.values()) {
            playersArray.push([player.playerId, player.gameProfile.score]);
        }
        gameServer.broadcastJSON([PacketType_1.ServerPacketTypeJson.LeaderboardUpdate, playersArray]);
    }
    static onTotemBreak(entity) {
        const writer = new bufferReader_1.BufferWriter(1);
        writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.TeamIsDestroyed);
        for (let i = 0; i < entity.data.length; i++) {
            const player = entity.data[i];
            player.controller.sendBinary(writer.toBuffer());
            player.totemFactory = null;
            player.lastTotemCooldown = +new Date();
        }
    }
    static addBox(owner, type, loot) {
        const gameServer = owner.gameServer;
        const id = gameServer.entityPool.nextId();
        const box = new Box_1.Box(id, owner, gameServer);
        const info = owner instanceof Player_1.Player ? type == EntityType_1.EntityType.CRATE ? owner.gameProfile.box : owner.gameProfile.deadBox : Utils_1.Utils.getBoxSkin(owner.type);
        box.onSpawn(owner.x, owner.y, owner.angle, type, info);
        box.radius = 30;
        for (let i = 0; i < loot.length; i++) {
            box.setLoot(loot[i][0], loot[i][1]);
        }
        ;
        box.initOwner(box);
        gameServer.initLivingEntity(box);
    }
    /**
     * Player died event
     */
    static playerDied(gameServer, entity) {
        gameServer.worldDeleter.initEntity(entity, "player");
        gameServer.players.delete(entity.id);
        WorldEvents.addBox(entity, EntityType_1.EntityType.DEAD_BOX, entity.inventory.toArray());
        if (entity.tokenScore.session_id === entity.gameProfile.token_id) {
            entity.tokenScore.score += entity.gameProfile.score;
            entity.tokenScore.session_id = 0;
            gameServer.tokenManager.leaveToken(entity.tokenScore);
        }
        entity.controller.sendJSON([PacketType_1.ServerPacketTypeJson.KillPlayer, DieReason_1.DieReason.PLAYER_KILLED, entity.gameProfile.score, entity.gameProfile.kills]);
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
        ]));
    }
    /**
     * Entity died event
     */
    static entityDied(gameServer, entity) {
        if (Utils_1.Utils.isBuilding(entity)) {
            gameServer.worldDeleter.initEntity(entity, "building");
        }
        else {
            gameServer.worldDeleter.initEntity(entity, "living");
        }
        if (entity.type == EntityType_1.EntityType.TREASURE_CHEST)
            return;
        const _entity = (0, EntityUtils_2.getEntity)(entity.type);
        if (!_entity)
            return;
        const toDrop = [];
        for (let i = 0; i < _entity.drop.length; i++) {
            const drop = _entity.drop[i];
            const item = ItemIds_1.ItemIds[drop[0]];
            const count = drop[1];
            toDrop.push([item, count]);
        }
        ;
        WorldEvents.addBox(entity, EntityType_1.EntityType.CRATE, toDrop);
    }
}
exports.WorldEvents = WorldEvents;
