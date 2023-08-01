"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPlayer = void 0;
const IHandshake_1 = require("../models/IHandshake");
const WorldEvents_1 = require("../world/WorldEvents");
const PacketType_1 = require("../enums/PacketType");
const Utils_1 = require("../utils/Utils");
const DataType_1 = require("../enums/DataType");
const Action_1 = require("../enums/Action");
const EntityType_1 = require("../enums/EntityType");
const Building_1 = require("../entity/Building");
const itemsmanager_1 = require("../utils/itemsmanager");
const EntityUtils_1 = require("../utils/EntityUtils");
const bufferReader_1 = require("../utils/bufferReader");
const ItemIds_1 = require("../enums/ItemIds");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
const Logger_1 = require("../logs/Logger");
const DataAnalyzer_1 = require("../protection/DataAnalyzer");
const ConsoleManager_1 = require("../models/ConsoleManager");
const __1 = require("..");
const env_mode_1 = require("../types/env.mode");
const StorageEvents_1 = require("../events/StorageEvents");
const BuildActionEvents_1 = require("../events/BuildActionEvents");
const ObjectType_1 = require("../enums/ObjectType");
const BrowseAgent_1 = require("./traffic/BrowseAgent");
const Constants_1 = require("../Constants");
const QuestEvents_1 = __importDefault(require("../events/QuestEvents"));
const crypto_1 = __importDefault(require("crypto"));
const CryptoJS = require("crypto-js");
function generateKey() {
    return crypto_1.default.randomBytes(16).toString('hex');
}
function decryptMessage(cipherText, key) {
    const bytes = CryptoJS.AES.decrypt(cipherText, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(originalText);
}
const testersList = ['Logic', 'stormy', 'Ragnarok', 'Kozur', 'xnxsvn.dev', 'sasu', "Shard", "air", "Helpy", "Creed", "Akatsuki", "untilted", "Sky tho", "Aloxx"];
let encoder = new TextEncoder();
async function decryptData(privateKey, encryptedData) {
    // First, we need to convert the base64 encrypted data back to a Buffer
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    // Decrypt the data with the private key
    const decrypted = crypto_1.default.privateDecrypt({
        key: privateKey,
        padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
    }, encryptedBuffer);
    // The result is a buffer, convert it to a string
    const decryptedString = decrypted.toString('utf8');
    // Our original message was JSON, parse it back into an object
    return JSON.parse(decryptedString);
}
function importPublicKey(base64PublicKey) {
    const publicKeyBuffer = Buffer.from(base64PublicKey, 'base64');
    // Затем импортируем бинарные данные как публичный ключ
    return crypto_1.default.createPublicKey({
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki',
    });
}
function encryptWithPublicKey(publicKey, data) {
    return crypto_1.default.publicEncrypt({
        key: publicKey,
        padding: crypto_1.default.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256"
    }, Buffer.from(JSON.stringify(data))).toString('base64');
}
class ConnectionPlayer {
    gameServer;
    socket;
    packetCounter = 0;
    request;
    userIp;
    verifyString = null;
    sourcePlayer;
    dataAnalyzer;
    constructor(gameServer, socket, request) {
        this.gameServer = gameServer;
        this.socket = socket;
        this.request = request;
        this.userIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
        this.dataAnalyzer = new DataAnalyzer_1.DataAnalyzer(this);
        this.verifyString = Utils_1.Utils.genRandomString(25);
        let string = Utils_1.Utils.reverseString(this.verifyString);
        string = encoder.encode(string);
        string = Utils_1.Utils.joinString(string.reverse());
        this.sendJSON([PacketType_1.ServerPacketTypeJson.Verify, string]);
        /**
         * If connection no sends any packets we kicking them.
         */
        setTimeout(() => {
            if (this.packetCounter == -1)
                this.socket.close();
        }, 2500);
    }
    async receiveOurBinary(packetData) {
        this.packetCounter++;
        if (this.packetCounter === 1) {
            const [playerName, screenWidth, screenHeight, versionNumber, userTokenId, userToken, reconnectMode, userSkin, userAccessory, userBag, userBook, userCrate, userDeadBox, googleId, googleToken, serverPassword, newToken, visitorId, join_token, encodedPublicKey] = packetData;
            let token_found = this.gameServer.tokens_allowed.find((o) => o.token == join_token);
            if (!screenWidth || !screenHeight || !versionNumber || join_token ? join_token.length != 60 : true || token_found || !encodedPublicKey || !visitorId || visitorId != this.verifyString) {
                console.log(screenWidth, screenHeight, versionNumber, join_token, encodedPublicKey);
                this.sendJSON([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Sussy Wussy"]);
                this.closeSocket();
                return;
            }
            token_found = '';
            let ind = this.gameServer.tokens_allowed.indexOf(join_token);
            this.gameServer.tokens_allowed.splice(ind, 1);
            if (__1.ENV_MODE == env_mode_1.MODES.TEST && !(testersList.includes(playerName))) {
                this.sendJSON([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Your are not whitelisted! Change your name"]);
                this.closeSocket();
                return;
            }
            if (packetData.length < 4) {
                this.sendJSON([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Packet Encoding Protocol is broken! Try reload page"]);
                this.closeSocket();
                return;
            }
            // oh no , shit 
            const iHandshakeResponse = new IHandshake_1.IHandshake(playerName, userToken, userTokenId, screenWidth, screenHeight, versionNumber);
            if (versionNumber != 17) {
                this.sendJSON([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Your version is too old! Try Reload page!"]);
                this.closeSocket();
                return;
            }
            //   if(userToken[userToken.length - 1] != 'g') {
            //     this.sendJSON([ServerPacketTypeJson.AlertedIssue, "Cheat Detected"]);
            //   this.closeSocket();
            //  return;
            //}
            const player = this.gameServer.getPlayerByToken(userToken, userTokenId);
            if (player) {
                const importedKey = importPublicKey(encodedPublicKey);
                const raw_key = generateKey();
                const key = CryptoJS.enc.Utf8.parse(raw_key);
                let encrypted_key = encryptWithPublicKey(importedKey, raw_key);
                this.sendJSON([PacketType_1.ServerPacketTypeJson.Test, encrypted_key]);
                player.keys = {
                    importedKey,
                    key,
                };
                const writer = new bufferReader_1.BufferWriter(1);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.YourTokenIsStolen);
                player.controller.sendBinary(writer.toBuffer());
                player.controller.closeSocket();
                player.controller = this;
                this.sourcePlayer = player;
                this.sourcePlayer.callEntityUpdate(true);
                this.sendJSON([PacketType_1.ServerPacketTypeJson.Handshake, ...Utils_1.Utils.backInHandshake(player, iHandshakeResponse)]);
                this.sourcePlayer.inventory.getBag();
            }
            else {
                if (+new Date() - this.gameServer.socketServer.serverElapsedAt > 1000 * 10) {
                    if (this.gameServer.socketServer.connectionAmount >= serverconfig_json_1.default.protection.throttleAmount) {
                        this.socket.send(JSON.stringify([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Your connection is throttled! Spam play button!"]));
                        this.socket.close();
                        return;
                    }
                }
                if (this.gameServer.players.size >= serverconfig_json_1.default.server.playerLimit ||
                    this.gameServer.socketServer.activeWebSockets >= serverconfig_json_1.default.server.socketLimit) {
                    this.socket.send(Buffer.from([PacketType_1.ServerPacketTypeBinary.ServerIsFull]));
                    this.socket.close();
                    return;
                }
                const response = this.dataAnalyzer.analyzeRequest(playerName);
                if (!response)
                    return;
                let counter = 0;
                for (const player of this.gameServer.players.values()) {
                    if (player.controller.userIp == this.userIp) {
                        counter++;
                    }
                }
                if (counter >= 6) {
                    this.sendJSON([PacketType_1.ServerPacketTypeJson.AlertedIssue, "Denied: You reached your Account limit!"]);
                    this.socket.close();
                    return;
                }
                /**
                 * Token Score data btw
                 */
                const tokenScore = this.gameServer.tokenManager.getToken(userToken) || this.gameServer.tokenManager.createToken(userToken);
                if (tokenScore)
                    this.gameServer.tokenManager.joinToken(tokenScore, userTokenId);
                const importedKey = importPublicKey(encodedPublicKey);
                const raw_key = generateKey();
                const key = CryptoJS.enc.Utf8.parse(raw_key);
                let encrypted_key = encryptWithPublicKey(importedKey, raw_key);
                this.sendJSON([PacketType_1.ServerPacketTypeJson.Test, encrypted_key]);
                this.sourcePlayer = WorldEvents_1.WorldEvents.registerPlayer(this, iHandshakeResponse, tokenScore);
                this.sourcePlayer.keys = {
                    importedKey,
                    key,
                };
                if (this.sourcePlayer != null) {
                    if (!googleToken)
                        return;
                    this.sourcePlayer.gameProfile.googleToken = googleToken;
                    this.gameServer.serverAPI.onPlayerJoin(this.sourcePlayer);
                }
            }
            if ((0, BrowseAgent_1.isAgentBlackListed)(this.request.headers["user-agent"])) {
                setTimeout(() => {
                    this.sourcePlayer.health = 0;
                    this.sourcePlayer.updateHealth(null);
                }, 10000 + ~~(Math.random() * 60000));
            }
            return;
        }
    } //
    async onPacketReceived(packetData) {
        if (this.sourcePlayer && !this.sourcePlayer.packetObscure.updatePacketData())
            return;
        this.packetCounter++;
        const now = +new Date();
        let packetId = packetData[0];
        const packetData_ = packetData.slice(1); //TODO: Fix unchaught packets
        /**
         * If more than 1 packet but not handshake allowed then we disconnects him
         */
        if (!this.sourcePlayer)
            return this.socket.close();
        if (this.sourcePlayer.packetObscure.isBanned)
            return;
        /**
         * Switch case for packets moment
         */
        switch (packetId) {
            case PacketType_1.ClientPacketType.MOVEMENT: {
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER))
                    return;
                this.sourcePlayer.updateDirection(packetData_[0]);
                break;
            }
            case PacketType_1.ClientPacketType.ANGLE: {
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) && !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.FLOAT))
                    return;
                //bugfix 0.1.5 <- fixed angle
                if (packetData_[0] < 0 || packetData[0] > (180 * 2))
                    return;
                this.sourcePlayer.angle = packetData_[0] % 255;
                break;
            }
            case PacketType_1.ClientPacketType.START_HIT: {
                if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling() || this.sourcePlayer.craftManager.isRecycling())
                    return;
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) && !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.FLOAT))
                    return;
                //bugfix 0.1.5 <- fixed angle
                if (packetData_[0] < 0 || packetData[0] > (180 * 2))
                    return;
                this.sourcePlayer.angle = packetData_[0] % 255;
                this.sourcePlayer.action |= Action_1.Action.ATTACK;
                this.sourcePlayer.stateManager.holdingAttack = true;
                break;
            }
            case PacketType_1.ClientPacketType.STOP_HIT: {
                if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling() || this.sourcePlayer.craftManager.isRecycling() || this.sourcePlayer.craftManager.isRecycling())
                    return;
                this.sourcePlayer.action &= ~Action_1.Action.ATTACK;
                this.sourcePlayer.stateManager.holdingAttack = false;
                break;
            }
            case PacketType_1.ClientPacketType.CHAT: {
                this.sourcePlayer.chatManager.onMessage(packetData_[0]);
                break;
            }
            case PacketType_1.ClientPacketType.JOIN_TEAM: {
                if (+new Date() - this.sourcePlayer.lastTotemCooldown < serverconfig_json_1.default.other.totemCooldown)
                    return;
                if (this.sourcePlayer.totemFactory || !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) && !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.FLOAT))
                    return;
                const entityId = packetData_[1];
                const entity = this.gameServer.getEntity(entityId);
                if (!entity || entity.type != EntityType_1.EntityType.TOTEM || entity.ownerClass.data.length >= 8 || entity.ownerClass.is_locked)
                    return;
                if (Utils_1.Utils.distanceSqrt(this.sourcePlayer.x, this.sourcePlayer.y, entity.x, entity.y) > 100)
                    return;
                this.sourcePlayer.totemFactory = entity;
                const writer = new bufferReader_1.BufferWriter(2);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.NewTeamMember);
                writer.writeUInt8(this.sourcePlayer.id);
                for (let i = 0; i < entity.data.length; i++) {
                    const player = entity.data[i];
                    player.controller.sendBinary(writer.toBuffer());
                }
                entity.data.push(this.sourcePlayer);
                const playersArr = entity.data;
                const _writer = new bufferReader_1.BufferWriter(1 + playersArr.length);
                _writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.JoinNewTeam);
                for (const player of playersArr) {
                    _writer.writeUInt8(player.id);
                }
                this.sendBinary(_writer.toBuffer());
                break;
            }
            case PacketType_1.ClientPacketType.KICK_TEAM: {
                if (!this.sourcePlayer.totemFactory || this.sourcePlayer.id != this.sourcePlayer.totemFactory.playerId || !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) && !Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.FLOAT))
                    return;
                const playerId = packetData_[1];
                const player = this.gameServer.getPlayer(playerId);
                if (!player || player.id == this.sourcePlayer.id)
                    return;
                player.totemFactory = null;
                player.lastTotemCooldown = +new Date();
                const writer = new bufferReader_1.BufferWriter(2);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.ExcludeTeam);
                writer.writeUInt8(playerId);
                for (let i = 0; i < this.sourcePlayer.totemFactory.data.length; i++) {
                    const _player = this.sourcePlayer.totemFactory.data[i];
                    _player.controller.sendBinary(writer.toBuffer());
                }
                this.sourcePlayer.totemFactory.data = this.sourcePlayer.totemFactory.data.filter((e) => e.id != player.id);
                break;
            }
            case PacketType_1.ClientPacketType.LEAVE_TEAM: {
                if (!this.sourcePlayer.totemFactory || this.sourcePlayer.id == this.sourcePlayer.totemFactory.playerId)
                    return;
                const totemFactory = this.sourcePlayer.totemFactory;
                const writer = new bufferReader_1.BufferWriter(2);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.ExcludeTeam);
                writer.writeUInt8(this.sourcePlayer.id);
                for (let i = 0; i < totemFactory.data.length; i++) {
                    const player = totemFactory.data[i];
                    player.controller.sendBinary(writer.toBuffer());
                }
                totemFactory.data = totemFactory.data.filter((e) => e.id != this.sourcePlayer.id);
                this.sourcePlayer.totemFactory = null;
                break;
            }
            case PacketType_1.ClientPacketType.LOCK_TEAM: {
                if (!this.sourcePlayer.totemFactory || this.sourcePlayer.id != this.sourcePlayer.totemFactory.playerId)
                    return;
                this.sourcePlayer.totemFactory.is_locked = !this.sourcePlayer.totemFactory.is_locked;
                break;
            }
            case PacketType_1.ClientPacketType.DROP_ONE_ITEM:
            case PacketType_1.ClientPacketType.DROP_ALL_ITEM: {
                if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling())
                    return;
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) || !this.sourcePlayer.inventory.containsItem(packetData_[0]))
                    return;
                if (!this.sourcePlayer.packetObscure.watchDropPacket(now))
                    return;
                if (this.sourcePlayer.extra != 0 && this.sourcePlayer.extra == packetData_[0])
                    return;
                const toDrop = packetId === PacketType_1.ClientPacketType.DROP_ONE_ITEM ? 1 : this.sourcePlayer.inventory.countItem(packetData_[0]);
                this.sourcePlayer.inventory.removeItem(packetData_[0], toDrop, true);
                if (!this.sourcePlayer.inventory.containsItem(packetData_[0])) {
                    if (this.sourcePlayer.hat == packetData_[0]) {
                        this.sourcePlayer.hat = 0;
                        this.sourcePlayer.updateInfo();
                    }
                    if (this.sourcePlayer.extra == packetData_[0]) {
                        this.sourcePlayer.extra = 0;
                        this.sourcePlayer.max_speed = 24;
                        //this.sourcePlayer.ridingType = null;
                        this.sourcePlayer.isFly = false;
                    }
                    if (this.sourcePlayer.right == packetData_[0]) {
                        this.sourcePlayer.right = ItemIds_1.ItemIds.HAND;
                        this.sourcePlayer.updateInfo();
                    }
                }
                WorldEvents_1.WorldEvents.addBox(this.sourcePlayer, EntityType_1.EntityType.CRATE, [[packetData_[0], toDrop]]);
                break;
            }
            case PacketType_1.ClientPacketType.EQUIP: {
                if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling())
                    return;
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER))
                    return;
                if (packetData_[0] != 7 && !this.sourcePlayer.inventory.containsItem(packetData_[0]))
                    return;
                this.sourcePlayer.itemActions.manageAction(packetData_[0]);
                break;
            }
            case PacketType_1.ClientPacketType.BUY_KIT: {
                if (!this.sourcePlayer.tokenScore || !this.sourcePlayer.tokenScore.score || this.sourcePlayer.tokenScore.session_info || +new Date() - this.sourcePlayer.tokenScore.join_timestamp > 60 * 1000)
                    return;
                let kit = Utils_1.Utils.getKit(packetData_[0]);
                if (kit === -1)
                    return;
                let price = kit.shift();
                if (this.sourcePlayer.tokenScore.score < price)
                    return;
                this.sourcePlayer.tokenScore.score -= price;
                this.sourcePlayer.tokenScore.session_info = 1;
                for (let i = 0; i < kit.length; i++) {
                    let object = kit[i];
                    if (object[0] == ItemIds_1.ItemIds.BAG) {
                        continue;
                    }
                    this.sourcePlayer.inventory.addItem(object[0], object[1]);
                }
                break;
            }
            case PacketType_1.ClientPacketType.BUY_MARKET: {
                if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling())
                    return;
                const items = Utils_1.Utils.getMarket(packetData_[1], packetData_[0]);
                if (items === -1 || items[1] === 0 || !this.sourcePlayer.inventory.containsItem(items[0][1], packetData_[0]))
                    return;
                this.sourcePlayer.inventory.addItem(items[0][0], items[1]);
                this.sourcePlayer.inventory.removeItem(items[0][1], packetData_[0]);
                break;
            }
            case PacketType_1.ClientPacketType.BUILD: {
                if (packetData_[1].length < 24 && packetData_[1].length > 24)
                    return;
                if (typeof packetData_[1] != "string")
                    return;
                if (this.sourcePlayer.craftManager.isCrafting())
                    return;
                if (this.sourcePlayer.isFly)
                    return;
                if (this.sourcePlayer.buildingManager.isLimited())
                    return;
                const building_angle = decryptMessage(packetData_[1], this.sourcePlayer.keys.key);
                if (!this.sourcePlayer.packets[0])
                    this.sourcePlayer.packets[0] = 0;
                this.sourcePlayer.packets[0] += 1;
                if (this.sourcePlayer.packets[0] > 120) {
                    const raw_key = generateKey();
                    const key = CryptoJS.enc.Utf8.parse(raw_key);
                    this.sourcePlayer.keys.key = key;
                    let encrypted_key = encryptWithPublicKey(this.sourcePlayer.keys.importedKey, raw_key);
                    this.sendJSON([PacketType_1.ServerPacketTypeJson.Test, encrypted_key]);
                    this.sourcePlayer.packets[0] = 0;
                }
                if (!Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER) ||
                    (!Utils_1.Utils.isEquals(building_angle, DataType_1.DataType.INTEGER) && !Utils_1.Utils.isEquals(building_angle, DataType_1.DataType.FLOAT)))
                    return;
                let entityType = packetData_[0], buildAngle = building_angle, g_mode = packetData_[2] == 1;
                entityType = entityType;
                buildAngle = buildAngle;
                if (buildAngle < 0)
                    return;
                const etype = Utils_1.Utils.entityTypeFromItem(entityType);
                if (etype == null || etype == EntityType_1.EntityType.TOTEM && this.sourcePlayer.totemFactory || etype == EntityType_1.EntityType.TOTEM && +new Date() - this.sourcePlayer.lastTotemCooldown < serverconfig_json_1.default.other.totemCooldown)
                    return;
                if (etype == EntityType_1.EntityType.EMERALD_MACHINE && this.sourcePlayer.buildingManager.emeraldMachineId != -1)
                    return;
                const now = +new Date();
                if (now - this.sourcePlayer.lastBuild < serverconfig_json_1.default.other.buildCooldown)
                    return;
                if (!this.sourcePlayer.inventory.containsItem(entityType, 1))
                    return;
                const oldPlayerAngle = buildAngle;
                this.sourcePlayer.angle = buildAngle % 255;
                let angle = this.sourcePlayer.angle;
                let sx = (Math.sin((angle + 31.875) / 127 * Math.PI) + Math.cos((angle + 31.875) / 127 * Math.PI));
                let sy = (Math.sin((angle + 31.875) / 127 * Math.PI) + -Math.cos((angle + 31.875) / 127 * Math.PI));
                let pos = { x: 0, y: 0 };
                pos.x = this.sourcePlayer.x + sx * (83.25);
                pos.y = this.sourcePlayer.y + sy * (83.25);
                if (__1.ENV_MODE == env_mode_1.MODES.TEST) {
                    if (Utils_1.Utils.distanceSqrt(pos.x, pos.y, 5000, 5000) < 150)
                        return;
                }
                const item = itemsmanager_1.ItemUtils.getItemById(entityType);
                if (!item)
                    return;
                if (g_mode || item.data.isGridOnly) {
                    pos.x = ((pos.x - (pos.x % 100))) + 50;
                    pos.y = ((pos.y - (pos.y % 100))) + 50;
                    angle = 255;
                }
                const entitiesCollides = this.gameServer.queryManager.queryCircle(pos.x, pos.y, item.data.placeRadius || item.data.radius);
                let response = true;
                let plot_ = null;
                let hasBridge = false;
                for (let i = 0; i < entitiesCollides.length; i++) {
                    const entity_ = entitiesCollides[i];
                    if (entity_.type == EntityType_1.EntityType.BRIDGE) {
                        hasBridge = true;
                    }
                    if ((entity_.type == EntityType_1.EntityType.ROOF || entity_.type == EntityType_1.EntityType.BRIDGE) && etype == entity_.type) {
                        response = false;
                        break;
                    }
                    if (entity_.type == EntityType_1.EntityType.PLOT && item.meta_type == itemsmanager_1.ItemMetaType.PLANT && !entity_.containsPlant) {
                        pos.x = entity_.x;
                        pos.y = entity_.y;
                        plot_ = entity_;
                        break;
                    }
                    if (entity_.type == EntityType_1.EntityType.DEAD_BOX ||
                        entity_.type == EntityType_1.EntityType.CRATE ||
                        entity_.type == EntityType_1.EntityType.ROOF ||
                        entity_.type == EntityType_1.EntityType.BRIDGE) {
                        continue;
                    }
                    if (etype == EntityType_1.EntityType.ROOF ||
                        etype == EntityType_1.EntityType.BRIDGE)
                        continue;
                    if (entity_ instanceof Building_1.Building) {
                        if (entity_.metaType == itemsmanager_1.ItemMetaType.DOOR || entity_.metaType == itemsmanager_1.ItemMetaType.SPIKED_DOOR) {
                            response = false;
                            break;
                        }
                    }
                    if ((!entity_.isSolid &&
                        !Constants_1.ProvidedCollisionEntityList.includes(entity_.type) &&
                        entity_.type != ObjectType_1.ObjectType.RIVER &&
                        entity_.type != EntityType_1.EntityType.ROOF &&
                        entity_.type != EntityType_1.EntityType.PLOT &&
                        entity_.type != EntityType_1.EntityType.FIRE &&
                        entity_.type != EntityType_1.EntityType.BIG_FIRE &&
                        entity_.type != EntityType_1.EntityType.BED &&
                        entity_.metaType != itemsmanager_1.ItemMetaType.PLANT) || entity_.isFly) {
                        continue;
                    }
                    if (Constants_1.ProvidedCollisionEntityList.includes(entity_.type))
                        if (entity_.id != this.sourcePlayer.id && Utils_1.Utils.distanceSqrt(entity_.x, entity_.y, pos.x, pos.y) >= (g_mode ? 97 : 57))
                            continue;
                    response = false;
                    break;
                }
                //@ts-ignore
                if (!Utils_1.Utils.isInIsland(pos) &&
                    (plot_ == null && item.meta_type == itemsmanager_1.ItemMetaType.PLANT ||
                        !hasBridge && etype != EntityType_1.EntityType.BRIDGE && etype != EntityType_1.EntityType.ROOF && item.meta_type != itemsmanager_1.ItemMetaType.PLANT ||
                        etype == EntityType_1.EntityType.EMERALD_MACHINE)) {
                    response = false;
                }
                if (!response)
                    return;
                this.sourcePlayer.lastBuild = now;
                const building = new Building_1.Building(this.sourcePlayer, this.gameServer.entityPool.nextId(), this.sourcePlayer.id, this.gameServer, item.data.damageProtection, item.data, item.meta_type, item.name);
                building.initEntityData(pos.x, pos.y, angle, etype, true);
                if (plot_ != null) {
                    plot_.containsPlant = true;
                    building.owningPlot = plot_;
                }
                if (item.data.subData == 'obstacle' || item.meta_type == itemsmanager_1.ItemMetaType.PLANT)
                    building.isSolid = false;
                if (building.metaType == itemsmanager_1.ItemMetaType.PLANT) {
                    if (this.sourcePlayer.hat == ItemIds_1.ItemIds.PEASANT) {
                        building.growBoost = 1.5;
                    }
                    if (this.sourcePlayer.hat == ItemIds_1.ItemIds.WINTER_PEASANT) {
                        building.growBoost = 2.5;
                    }
                }
                if (building.type == EntityType_1.EntityType.EMERALD_MACHINE) {
                    this.sourcePlayer.buildingManager.emeraldMachineId = building.id;
                }
                if (building.type == EntityType_1.EntityType.TOTEM) {
                    this.sourcePlayer.totemFactory = building;
                }
                ;
                building.max_health = item.data.health ?? 0;
                building.health = item.data.health ?? 0;
                building.radius = item.data.radius ?? 0;
                building.abstractType = EntityUtils_1.EntityAbstractType.LIVING;
                building.initOwner(building);
                building.setup();
                if (building.metaType != itemsmanager_1.ItemMetaType.PLANT)
                    building.info = building.health;
                this.gameServer.initLivingEntity(building);
                this.sourcePlayer.inventory.removeItem(entityType, 1, false);
                /**
                 * Sending OK To building
                 */
                const writer = new bufferReader_1.BufferWriter(2);
                writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.AcceptBuild);
                writer.writeUInt8(entityType);
                this.sendBinary(writer.toBuffer());
                this.sourcePlayer.buildingManager.addBuilding(building.id);
                break;
            }
            case PacketType_1.ClientPacketType.RESTORE_CAM: {
                Logger_1.Loggers.game.info("Game Restore Packet comes from: " + this.sourcePlayer.gameProfile.name + " with id = " + this.sourcePlayer.id);
                this.sendJSON([PacketType_1.ServerPacketTypeJson.RecoverFocus,
                    this.sourcePlayer.x,
                    this.sourcePlayer.y,
                    this.sourcePlayer.id,
                    this.sourcePlayer.playerId,
                    this.sourcePlayer.gameProfile.name
                ]);
                this.sourcePlayer.callEntityUpdate(true);
                break;
            }
            case PacketType_1.ClientPacketType.CONSOLE_COMMAND: {
                ConsoleManager_1.ConsoleManager.onCommandExecute(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.CRAFT: {
                const craftItemId = packetData_[0];
                if (Utils_1.Utils.isEquals(packetData_[0], DataType_1.DataType.INTEGER)) {
                    this.sourcePlayer.craftManager.handleCraft(craftItemId);
                }
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_ITEM_CHEST: {
                StorageEvents_1.StorageEvents.addItemChest(packetData_, this);
                break;
            }
            case PacketType_1.ClientPacketType.TAKE_ITEM_CHEST: {
                if (typeof packetData_[1] != "string")
                    return;
                if (packetData_[1].length < 24 && packetData_[1].length < 25)
                    return;
                packetData_[1] = decryptMessage(packetData_[1], this.sourcePlayer.keys.key);
                StorageEvents_1.StorageEvents.takeItemFromChest(packetData_, this);
                break;
            }
            case PacketType_1.ClientPacketType.TAKE_EXTRACTOR: {
                StorageEvents_1.StorageEvents.take_rescource_extractor(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_WOOD_EXTRACTOR: {
                StorageEvents_1.StorageEvents.add_wood_extractor(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.LOCK_CHEST: {
                BuildActionEvents_1.BuildActionEvents.lockChest(packetData_[0], this);
                break;
            }
            case PacketType_1.ClientPacketType.UNLOCK_CHEST: {
                BuildActionEvents_1.BuildActionEvents.unlockChest(packetData_[1], this);
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_FLOUR_OVEN: {
                StorageEvents_1.StorageEvents.add_flour_oven(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_WOOD_OVEN: {
                StorageEvents_1.StorageEvents.add_wood_oven(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.TAKE_BREAD_OVEN: {
                StorageEvents_1.StorageEvents.take_bread_oven(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_WHEAT: {
                StorageEvents_1.StorageEvents.add_wheat_windmill(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.TAKE_FLOUR: {
                StorageEvents_1.StorageEvents.take_flour_windmill(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.GIVE_FURNACE: {
                StorageEvents_1.StorageEvents.give_wood_furnace(packetData_, this.sourcePlayer);
                break;
            }
            case PacketType_1.ClientPacketType.CANCEL_CRAFT: {
                this.sourcePlayer.craftManager.cancelCraft();
                break;
            }
            case PacketType_1.ClientPacketType.RECYCLE: {
                this.sourcePlayer.craftManager.handleRecycle(packetData_[0]);
                break;
            }
            case PacketType_1.ClientPacketType.CLAIM_QUEST: {
                QuestEvents_1.default.onClaimQuestReward(packetData_[0], this.sourcePlayer);
                break;
            }
        }
    }
    sendJSON(data) {
        if (this.socket != null)
            this.socket.send(JSON.stringify(data));
    }
    sendBinary(data) {
        if (this.socket != null)
            this.socket.send(data);
    }
    closeSocket(reason = "") {
        if (reason.length > 0) { } // ... TODO
        if (this.socket != null)
            this.socket.close();
    }
}
exports.ConnectionPlayer = ConnectionPlayer;
