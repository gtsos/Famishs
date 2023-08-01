"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const Action_1 = require("../enums/Action");
const PacketType_1 = require("../enums/PacketType");
const GameProfile_1 = require("../models/GameProfile");
const bufferReader_1 = require("../utils/bufferReader");
const inventory_1 = require("../utils/inventory");
const Entity_1 = require("./Entity");
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
const ItemIds_1 = require("../enums/ItemIds");
const StateManager_1 = require("../models/StateManager");
const ChatManager_1 = require("../models/ChatManager");
const Gauges_1 = require("../models/Gauges");
const itemsmanager_1 = require("../utils/itemsmanager");
const ItemAction_1 = require("../models/ItemAction");
const UpdateManager_1 = require("../models/UpdateManager");
const BuildingManager_1 = require("../models/BuildingManager");
const ECollisionManager_1 = require("../models/ECollisionManager");
const Utils_1 = require("../utils/Utils");
const VehiculeType_1 = require("../enums/VehiculeType");
const CraftManager_1 = require("../craft/CraftManager");
const MovementDirection_1 = require("../math/MovementDirection");
const PacketObscure_1 = require("../network/PacketObscure");
const QuestManager_1 = require("../models/QuestManager");
const num2d = function (num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};
class Player extends Entity_1.Entity {
    controller;
    gameProfile;
    inventory;
    stateManager;
    chatManager;
    gaugesManager;
    questManager;
    completeQuests = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    attack_pos;
    width = 2560;
    height = 1440;
    right = 0;
    vechile = 0;
    hat = 0;
    bag = false;
    itemActions;
    bandage = 0;
    isStunned = false;
    lastStun = -1;
    lastKick = -1;
    lastBuild = -1;
    lastHittenBuildDamager = -1;
    lastTotemCooldown = -1;
    lastHoodCooldown = -1;
    updateManager;
    buildingManager;
    collisionManager;
    totemFactory;
    isAdmin = false;
    isFrozen = false;
    arrayList;
    ridingType = null;
    craftManager;
    tokenScore;
    keys;
    packets;
    packetObscure;
    prevDirection = 0;
    lastSurviveUpdate = +new Date();
    constructor(controller, id, gameServer, tokenScore, token, token_id) {
        super(id, id, gameServer);
        this.controller = controller;
        this.gameProfile = new GameProfile_1.GameProfile("unnamed", ~~(Math.random() * 155), ~~(Math.random() * 94), 0, 0, 0, 0, 0, 0, 0, 0, +new Date(), token, token_id); //new GameProfile("unnamed", ~~(Math.random() * 155), ~~(Math.random() * 94), 0, 0, 0, 0, 0, 0, 0, 0, +new Date(), token, token_id);
        // setInterval(() => {
        //     this.gameProfile.skin += 1;
        //     this.gameProfile.accessory += 1;
        //     this.gameProfile.book += 1;
        //     this.gameServer.broadcastBinary(Buffer.from([ ServerPacketTypeBinary.VerifiedAccount, this.id, this.gameProfile.skin, this.gameProfile.accessory, 0, this.gameProfile.book, 0, 0, this.gameProfile.skin ]));
        //     if(this.gameProfile.skin == 174) {
        //         this.gameProfile.skin = 0;
        //     }
        //     if(this.gameProfile.accessory == 88) {
        //         this.gameProfile.accessory = 0;
        //     }
        //     if(this.gameProfile.book > 40) {
        //         this.gameProfile.book = 0;
        //     }
        // }, 800  )
        if (serverconfig_json_1.default.inventory.withBag)
            this.bag = true;
        this.packetObscure = new PacketObscure_1.PacketObscure(this.controller);
        this.inventory = new inventory_1.Inventory(this, serverconfig_json_1.default.inventory.startSize);
        this.stateManager = new StateManager_1.StateManager(this);
        this.itemActions = new ItemAction_1.ItemAction(this);
        this.updateManager = new UpdateManager_1.UpdateManager(this);
        this.buildingManager = new BuildingManager_1.BuildingManager(this);
        this.craftManager = new CraftManager_1.CraftManager(this);
        this.questManager = new QuestManager_1.QuestManager(this);
        this.tokenScore = tokenScore;
        this.keys = {};
        this.packets = [];
        this.attack_pos = {};
        this.chatManager = new ChatManager_1.ChatManager(this);
        this.gaugesManager = new Gauges_1.GaugesManager(this);
        this.health = 200;
        this.gaugesManager.update();
        this.collisionManager = new ECollisionManager_1.ECollisionManager(this);
        this.right = ItemIds_1.ItemIds.HAND;
        this.updateInfo();
        for (let i = 0; i < this.gameServer.gameConfiguration.kit.length; i += 2) {
            const kitItem = this.gameServer.gameConfiguration.kit[i];
            const kitItemCount = this.gameServer.gameConfiguration.kit[i + 1];
            //@ts-ignore
            this.inventory.addItem(ItemIds_1.ItemIds[kitItem], kitItemCount);
        }
        if (serverconfig_json_1.default.inventory.withBag) {
            this.bag = true;
            this.updateInfo();
        }
    }
    updateInfo() {
        this.info = this.right + (this.hat * 128);
        if (this.bag)
            this.info += 16384;
    }
    updateStun() {
        if (!this.isStunned)
            return;
        if (Date.now() - this.lastStun > 2000)
            this.isStunned = false;
    }
    survivalUpdate() {
        this.gaugesManager.tick();
        this.gaugesManager.update();
        const now = +new Date();
        if (now - this.lastSurviveUpdate > serverconfig_json_1.default.other.dayInMilliseconds) {
            this.lastSurviveUpdate = now;
            const writer = new bufferReader_1.BufferWriter(1);
            writer.writeUInt8(PacketType_1.ServerPacketTypeBinary.Survive);
            this.controller.sendBinary(writer.toBuffer());
            this.gameProfile.days++;
            this.gameProfile.score += 500;
        }
    }
    updateEquipment(id) {
        if (!this.inventory.containsItem(id)) {
            if (this.hat == id) {
                this.hat = 0;
                this.updateInfo();
            }
            if (this.extra == id) {
                this.extra = 0;
                this.max_speed = 24;
                //this.ridingType = null;
                this.isFly = false;
            }
            if (this.right == id) {
                this.right = ItemIds_1.ItemIds.HAND;
                this.updateInfo();
            }
        }
    }
    syncUpdate() {
        this.craftManager.update();
        this.questManager.tickUpdate();
        this.collisionManager.updateCollides();
        // this.inventory.addItem(ItemIds.PICK_WOOD, 1)
        //  this.callAttackTick();
        /*let arr: any[] = [];

        if(this.arrayList) arr.push({x: this.arrayList.x , y: this.arrayList.y, r: 30})
       //  arr.push({ x: this.attack_pos.x , y: this.attack_pos.y , r: this.attack_pos.radius})
         for(let i = 0; i < this.gameServer.entities.length; i++) {
             let o = this.gameServer.entities[i] as any;

             if(Utils.distanceSqrt(o.x , o.y, this.x, this.y) > 500) continue;

             arr.push({x: o.x, y: o.y,r: o.radius, data: {type: o.type}});

             if(Utils.isBuilding(o)) {
               
                arr.push({x: o.x, y: o.y, r: o.ownerClass.metaData.collideResolveRadius})
             }
         }
         arr.push({x: this.x, y: this.y , r: this.radius, data: {type: this.type}});
         this.controller.sendJSON([ServerPacketTypeJson.XzKarmani, arr])*/
        this.callEntityUpdate(false);
    }
    callEntityUpdate(isHard) {
        const entities = this.updateManager.getEntities(isHard);
        const writer = new bufferReader_1.BufferWriter(2 + entities.length * 18);
        writer.writeUInt16(PacketType_1.ServerPacketTypeBinary.EntityUpdate);
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            writer.writeUInt8(entity.playerId);
            writer.writeUInt8(entity.angle);
            writer.writeUInt16(entity.action);
            writer.writeUInt16(entity.type);
            writer.writeUInt16(entity.x);
            writer.writeUInt16(entity.y);
            writer.writeUInt16(entity.id);
            writer.writeUInt16(entity.info);
            writer.writeUInt16(entity.speed * 10);
            writer.writeUInt16(entity.extra);
        }
        if (entities.length > 0)
            this.controller.sendBinary(writer.toBuffer()); //
    }
    updateMovement(direction) {
        //console.log(Utils.distanceSqrt(this.x, this.y, this.predirection_x, this.predirection_y))
        this.vector.x = 0;
        this.vector.y = 0;
        let speed = this.speed;
        let deplifier = .71;
        switch (direction) {
            case MovementDirection_1.MovementDirection.LEFT:
                this.vector.x -= speed;
                break;
            case MovementDirection_1.MovementDirection.RIGHT:
                this.vector.x += speed;
                break;
            case MovementDirection_1.MovementDirection.TOP:
                this.vector.y += speed;
                break;
            case MovementDirection_1.MovementDirection.LEFT_BOTTOM:
                this.vector.x -= speed * deplifier;
                this.vector.y += speed * deplifier;
                break;
            case MovementDirection_1.MovementDirection.RIGHT_BOTTOM:
                this.vector.x += speed * deplifier;
                this.vector.y += speed * deplifier;
                break;
            case MovementDirection_1.MovementDirection.BOTTOM:
                this.vector.y -= speed;
                break;
            case MovementDirection_1.MovementDirection.RIGHT_TOP:
                this.vector.y -= speed * deplifier;
                this.vector.x += speed * deplifier;
                break;
            case MovementDirection_1.MovementDirection.LEFT_TOP:
                this.vector.x -= speed * deplifier;
                this.vector.y -= speed * deplifier;
                break;
        }
        this.stateManager.isFrictionEnabled = this.vector.y > 0;
    }
    onEntityUpdate() {
    }
    updateDirection(direction) {
        this.oldDirection = this.direction;
        /**
         * Setting new direction for vec2d
         */
        this.direction = direction;
        /**
         * State update
         */
        if (direction == 0) {
            this.action |= Action_1.Action.IDLE;
            this.action &= ~Action_1.Action.WALK;
            //this.updateMovement(true);
        }
        else {
            this.action &= ~Action_1.Action.IDLE;
            this.action |= Action_1.Action.WALK;
        }
        /**
         * Update vector2d
         */
        //this.updateMovement();
        this.syncUpdate();
    }
    tickUpdate() {
        let baseSpeed = this.old_speed;
        this.old_speed = this.max_speed;
        const weaponFactor = itemsmanager_1.ItemUtils.getItemById(this.right);
        let decreaseWeapon = 0;
        if (weaponFactor != null && weaponFactor.type == itemsmanager_1.ItemType.EQUIPPABLE && weaponFactor.meta_type == itemsmanager_1.ItemMetaType.SWORD)
            decreaseWeapon = serverconfig_json_1.default.entities.player.speed_weapon;
        if (decreaseWeapon > 0)
            baseSpeed -= (this.collideCounter > 0 ? 0 : (this.extra > 0 ? decreaseWeapon / 4.5 : decreaseWeapon / 3));
        if (this.stateManager.holdingAttack)
            baseSpeed -= serverconfig_json_1.default.entities.player.speed_attack_decrease / ((this.collideCounter > 0 || this.extra > 0) ? 1.5 : 1);
        if (this.stateManager.isInWater)
            baseSpeed -= (this.hat == ItemIds_1.ItemIds.DIVING_MASK || this.hat == ItemIds_1.ItemIds.SUPER_DIVING_SUIT) ? 4 : 8;
        let direction = this.direction;
        if (this.extra != 0) {
            let asItem = itemsmanager_1.ItemUtils.getItemById(this.extra);
            if (this.direction != 0 &&
                Utils_1.Utils.checkVehiculeCondition(this, asItem.data.vehicule_type)) {
                if (asItem.data.vehicule_type == VehiculeType_1.VehiculeType.FLOAT) {
                    if (this.hat == ItemIds_1.ItemIds.PIRATE_HAT) {
                        baseSpeed *= 1.125;
                    }
                }
                baseSpeed = Math.min(baseSpeed, (this.speed + asItem.data.raiseSpeed));
            }
            else {
                if (this.speed > 1) {
                    baseSpeed = Math.max(1, (this.speed - asItem.data.slowSpeed));
                    if (this.direction < 1)
                        direction = this.oldDirection;
                }
                this.old_speed = Math.max(0, baseSpeed);
            }
            if (this.prevDirection != this.direction) {
                let isDiagonal = (this.direction == MovementDirection_1.MovementDirection.LEFT_BOTTOM ||
                    this.direction == MovementDirection_1.MovementDirection.RIGHT_BOTTOM ||
                    this.direction == MovementDirection_1.MovementDirection.LEFT_TOP ||
                    this.direction == MovementDirection_1.MovementDirection.LEFT_BOTTOM);
                if (!isDiagonal && !this.isFly)
                    baseSpeed /= 1.65;
            }
        }
        this.speed = baseSpeed;
        this.updateMovement(direction);
        this.prevDirection = this.direction;
        const now = +new Date(), attack_diff = now - this.stateManager.lastAttack;
        if (this.stateManager.holdingAttack && attack_diff > 519) {
            this.stateManager.lastAttack = now;
            this.action |= Action_1.Action.ATTACK;
            this.updateAttackDot();
            this.hitHappened();
        }
        else if (this.stateManager.holdingAttack && attack_diff < 518)
            this.action &= ~Action_1.Action.ATTACK;
    }
    updateAttackDot() {
        // let offset = 17;
        let expandOffset = 0, expandRadius = 0;
        if (this.right != ItemIds_1.ItemIds.HAND) {
            const rightItem = itemsmanager_1.ItemUtils.getItemById(this.right).data;
            expandOffset = rightItem.expandOffset;
            expandRadius = rightItem.expandRadius;
        }
        if (this.right == ItemIds_1.ItemIds.HAND) {
            expandRadius = 25;
            expandOffset = 15;
        }
        let angle_x = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + Math.cos((this.angle + 31.875) / 127 * Math.PI));
        let angle_y = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + -Math.cos((this.angle + 31.875) / 127 * Math.PI));
        this.attack_pos = {
            x: this.x + angle_x * (expandOffset),
            y: this.y + angle_y * (expandOffset),
            radius: expandRadius
        };
    }
    hitHappened() {
        let handItemEquiped = itemsmanager_1.ItemUtils.getItemById(this.right);
        if (handItemEquiped != null) {
            switch (handItemEquiped.meta_type) {
                case itemsmanager_1.ItemMetaType.SHOVEL: {
                    if (this.stateManager.isInSea)
                        return;
                    let itemToGive = this.stateManager.isInSand ? ItemIds_1.ItemIds.SAND : ItemIds_1.ItemIds.GROUND;
                    let countIncrease = handItemEquiped.data.mine_increase;
                    this.inventory.addItem(itemToGive, countIncrease);
                    break;
                }
                case itemsmanager_1.ItemMetaType.BOW: {
                    /*  const arrow = new Bullet(this.gameServer.entityPool.nextId(), this.id, this.gameServer, handItemEquiped);
  
                      //this.spell = this.info & 15; <- тип стрелы в говна
                      //this.fly = this.extra & 1;
                      //[2 3 4 5 6 7 8] <- типы стрел от дерев до драг
          
                      //???
                      let angle_x = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + Math.cos((this.angle + 31.875) / 127 * Math.PI));
                      let angle_y = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + -Math.cos((this.angle + 31.875) / 127 * Math.PI));
                      
                      let travelDist = 360;
                      const p2s = {
                          x: this.x + angle_x * (travelDist),
                          y: this.y + angle_y * (travelDist),
                      }
                      arrow.shouldTravel = travelDist;
                      arrow.initEntityData(this.x, this.y ,~~(this.angle - 90 / 360 * 255) , EntityType.SPELL, false);
                      arrow.initOwner(arrow);
                    //  arrow.angle = 0;
                      arrow.angle = this.angle
                      arrow.max_speed = 24;
                      arrow.speed = 24
          
                      arrow.info = ((this.x - (this.x % 10)) >> 4 << 4) | 1+ ~~(Math.random() * 8); // должна быть деревянная шмара
                     
                      const fly = true
                  
                      arrow.extra = this.y | (fly ? 1 : 0);
          
                      this.arrayList = {
                          x: p2s.x,
                          y: p2s.y
                      }
          
                      this.gameServer.initLivingEntity(arrow);*/
                    break;
                }
            }
        }
        const entities = this.gameServer.queryManager.queryCircle(this.attack_pos.x, this.attack_pos.y, this.attack_pos.radius);
        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if (ent.id == this.id) {
                continue;
            }
            //@ts-ignore
            if (ent.isFly != this.isFly)
                continue;
            ent.receiveHit(this);
        }
    }
}
exports.Player = Player;
