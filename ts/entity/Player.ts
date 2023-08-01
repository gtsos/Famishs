import { Action } from "../enums/Action";
import { EntityType } from "../enums/EntityType";
import { ServerPacketTypeBinary, ServerPacketTypeJson } from "../enums/PacketType";
import { GameServer } from "../GameServer";
import { GameProfile } from "../models/GameProfile";
import { ConnectionPlayer } from "../network/ConnectionPlayer";
import { BufferWriter } from "../utils/bufferReader";
import { Inventory } from "../utils/inventory";
import { Entity } from "./Entity";
import serverSettings from "../settings/serverconfig.json";
import { ItemIds } from "../enums/ItemIds";
import { StateManager } from "../models/StateManager";
import { ChatManager } from "../models/ChatManager";
import { GaugesManager } from "../models/Gauges";
import { ItemType, ItemUtils, ItemMetaType } from "../utils/itemsmanager";
import { ItemAction } from "../models/ItemAction";
import { UpdateManager } from "../models/UpdateManager";
import { BuildingManager } from "../models/BuildingManager";
import { ECollisionManager } from "../models/ECollisionManager";
import { Utils } from "../utils/Utils";
import { Building } from "./Building";
import { Bullet } from "./Bullet";
import { VehiculeType } from "../enums/VehiculeType";
import { CraftManager } from "../craft/CraftManager";
import Vector2D from "../math/Vector2D";
import { IVector2 } from "../math/Vector2D"
import { MovementDirection } from "../math/MovementDirection";
import { PacketObscure } from "../network/PacketObscure";
import { Biomes } from "../enums/Biomes";
import { WorldBiomeResolver } from "../world/WorldBiomeResolver";
import { TokenScore } from "../utils/tokenManager";
import { MathUtils } from "../math/MathUtils";
import { QuestManager } from "../models/QuestManager";
import { QuestStateType } from "../enums/QuestType";





const num2d = function (num:any, in_min:any, in_max:any, out_min:any, out_max:any) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
export class Player extends Entity {
    public controller: ConnectionPlayer;
    public gameProfile: GameProfile;

    public inventory: Inventory;
    public stateManager: StateManager;

    public chatManager: ChatManager;
    public gaugesManager: GaugesManager;
    public questManager: QuestManager;
    
    public completeQuests: number[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

    public attack_pos: any;
    public width: number = 2560;
    public height: number = 1440;

    public right: number = 0;
    public vechile: number = 0;
    public hat: number = 0;
    public bag: boolean = false;
    public itemActions: ItemAction;
    public bandage: number = 0;

    public isStunned: boolean = false;
    public lastStun: number = -1;
    public lastKick: number = -1;
    public lastBuild: number = -1;
    public lastHittenBuildDamager: number = -1;
    public lastTotemCooldown: number = -1;
    public lastHoodCooldown: number = -1;
    public updateManager: UpdateManager;
    public buildingManager: BuildingManager;
    public collisionManager: ECollisionManager;
    public totemFactory: any;
    public isAdmin: boolean = false;
    public isFrozen: boolean = false;
    public arrayList: any;
    public ridingType: any = null;
    public craftManager: CraftManager;
    public tokenScore: TokenScore;
    public keys: any;
    public packets: any;

    public packetObscure: PacketObscure;
    public prevDirection: number = 0;

    public lastSurviveUpdate: number = +new Date();

    public constructor (controller: ConnectionPlayer, id: number , gameServer: GameServer, tokenScore: TokenScore, token: string, token_id: string) {
        super(id, id, gameServer); 
        

        this.controller = controller;
        this.gameProfile = new GameProfile("unnamed", ~~(Math.random() * 155), ~~(Math.random() * 94), 0, 0, 0, 0, 0, 0, 0, 0, +new Date(), token, token_id);//new GameProfile("unnamed", ~~(Math.random() * 155), ~~(Math.random() * 94), 0, 0, 0, 0, 0, 0, 0, 0, +new Date(), token, token_id);

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

        if(serverSettings.inventory.withBag) this.bag = true;

        this.packetObscure = new PacketObscure(this.controller);
        this.inventory = new Inventory(this, serverSettings.inventory.startSize);
        this.stateManager = new StateManager(this);
        this.itemActions = new ItemAction(this);
        this.updateManager = new UpdateManager(this); 
        this.buildingManager = new BuildingManager(this);
        this.craftManager = new CraftManager(this);
        this.questManager = new QuestManager(this);
        this.tokenScore = tokenScore;
        this.keys = {};
        this.packets =[];

        this.attack_pos = {};

        this.chatManager = new ChatManager(this);
        this.gaugesManager = new GaugesManager(this);
        this.health = 200;
        this.gaugesManager.update(); 

        this.collisionManager = new ECollisionManager(this);

        this.right = ItemIds.HAND;
        this.updateInfo();

        for(let i = 0; i < this.gameServer.gameConfiguration.kit.length; i+= 2) {
            const kitItem = this.gameServer.gameConfiguration.kit[i];
            const kitItemCount = this.gameServer.gameConfiguration.kit[i + 1];

            //@ts-ignore
            this.inventory.addItem(ItemIds[kitItem], kitItemCount);
        }

        if(serverSettings.inventory.withBag) {
            this.bag = true;
            this.updateInfo();
        }
        
    }
    public updateInfo() {
        this.info = this.right + (this.hat * 128);
        if(this.bag) this.info += 16384;
    }
    public updateStun() {
        if (!this.isStunned) return;
        if (Date.now() - this.lastStun > 2000) this.isStunned = false;
    }
    public survivalUpdate() {
        this.gaugesManager.tick();
        this.gaugesManager.update();

        const now = +new Date();

        if(now - this.lastSurviveUpdate > serverSettings.other.dayInMilliseconds) {
            this.lastSurviveUpdate = now;

            const writer = new BufferWriter(1);
            writer.writeUInt8(ServerPacketTypeBinary.Survive);

            this.controller.sendBinary(writer.toBuffer());

            this.gameProfile.days++;
            this.gameProfile.score += 500;
        }
    }

    public updateEquipment(id: number) {
        if(!this.inventory.containsItem(id)) {
            if(this.hat == id) {
                this.hat = 0;
                this.updateInfo();
            }
            if(this.extra == id) {
                this.extra = 0;
                this.max_speed = 24;
                //this.ridingType = null;
                this.isFly = false;

            }
            if(this.right == id) {
                this.right = ItemIds.HAND;
                this.updateInfo();
            }
        }
    }
    
    public syncUpdate () {
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
    public callEntityUpdate(isHard: boolean) {
        const entities = this.updateManager.getEntities(isHard);

        const writer = new BufferWriter(2 + entities.length * 18);

        writer.writeUInt16(ServerPacketTypeBinary.EntityUpdate);

        for(let i = 0; i < entities.length; i++) {
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

       if(entities.length > 0) 
            this.controller.sendBinary(writer.toBuffer()); //
    }
    public updateMovement(direction: number) {

        //console.log(Utils.distanceSqrt(this.x, this.y, this.predirection_x, this.predirection_y))

        this.vector.x = 0;
        this.vector.y = 0;
        let speed = this.speed;

        let deplifier = .71;

        switch(direction) {
            case MovementDirection.LEFT:
                this.vector.x -= speed;
            break;
            case MovementDirection.RIGHT:
                this.vector.x += speed;
            break;
            case MovementDirection.TOP:
                this.vector.y += speed;
            break;
            case MovementDirection.LEFT_BOTTOM:

                this.vector.x -= speed * deplifier;
                this.vector.y += speed * deplifier;
            break;
            case MovementDirection.RIGHT_BOTTOM:
                this.vector.x += speed * deplifier;
                this.vector.y += speed * deplifier
                
            break;
            case MovementDirection.BOTTOM:
                this.vector.y -= speed;
            break;
            case MovementDirection.RIGHT_TOP: 
                
                this.vector.y -= speed * deplifier;
                this.vector.x += speed * deplifier; 
            break;
            case MovementDirection.LEFT_TOP: 

                this.vector.x -= speed * deplifier;
                this.vector.y -= speed * deplifier;
            break;   
        } 
    

        this.stateManager.isFrictionEnabled = this.vector.y > 0;
    }
    public onEntityUpdate() {
        
    }
    public updateDirection(direction: number) {

        this.oldDirection = this.direction;

        /**
         * Setting new direction for vec2d
         */
        this.direction = direction;

        /**
         * State update
         */
        if(direction == 0) {
            this.action |= Action.IDLE;
            this.action &= ~Action.WALK;
            //this.updateMovement(true);
        } else {
            this.action &= ~Action.IDLE;
            this.action |= Action.WALK;
       
        }

        /**
         * Update vector2d
         */
        //this.updateMovement();
        this.syncUpdate();
    }

    public tickUpdate() {

        let baseSpeed = this.old_speed;
        
        this.old_speed = this.max_speed;

        const weaponFactor = ItemUtils.getItemById(this.right);
        let decreaseWeapon:number = 0;

        if(weaponFactor != null && weaponFactor.type == ItemType.EQUIPPABLE && weaponFactor.meta_type == ItemMetaType.SWORD) 
           decreaseWeapon = serverSettings.entities.player.speed_weapon;
        

        if(decreaseWeapon > 0) 
           baseSpeed -= (this.collideCounter > 0 ? 0 : (this.extra > 0 ? decreaseWeapon / 4.5 : decreaseWeapon / 3));


        if(this.stateManager.holdingAttack) 
           baseSpeed -= serverSettings.entities.player.speed_attack_decrease / ( (this.collideCounter > 0 || this.extra > 0) ? 1.5 : 1);        


        if(this.stateManager.isInWater) 
           baseSpeed -= (this.hat == ItemIds.DIVING_MASK || this.hat == ItemIds.SUPER_DIVING_SUIT) ? 4 : 8;

        let direction = this.direction;
        if(
            this.extra != 0
        ) {
            let asItem = ItemUtils.getItemById(this.extra);

            if(
                this.direction != 0 &&
                Utils.checkVehiculeCondition(this, asItem.data.vehicule_type)
            ) {

                if(asItem.data.vehicule_type == VehiculeType.FLOAT) {
                    if(this.hat == ItemIds.PIRATE_HAT) {
                        baseSpeed *= 1.125;
                    }
                }   

                baseSpeed = Math.min(baseSpeed, (this.speed + asItem.data.raiseSpeed));

            }else {
                if(this.speed > 1) {
                    baseSpeed = Math.max(1, (this.speed - asItem.data.slowSpeed));

                    if(this.direction < 1)
                       direction = this.oldDirection;
                }

                this.old_speed = Math.max(0, baseSpeed);
            }

            if(this.prevDirection != this.direction) {

                let isDiagonal = (this.direction == MovementDirection.LEFT_BOTTOM ||
                    this.direction == MovementDirection.RIGHT_BOTTOM ||
                    this.direction == MovementDirection.LEFT_TOP ||
                    this.direction == MovementDirection.LEFT_BOTTOM);

                if(!isDiagonal && !this.isFly)
                    baseSpeed /= 1.65;

            }
        }
                 
        this.speed = baseSpeed;
        this.updateMovement(direction);

        this.prevDirection = this.direction;

        const now = +new Date(),
        attack_diff = now - this.stateManager.lastAttack;
        if(this.stateManager.holdingAttack && attack_diff > 519) {
            this.stateManager.lastAttack = now;

            this.action |= Action.ATTACK;
            this.updateAttackDot();

            this.hitHappened()
        }else if(this.stateManager.holdingAttack  && attack_diff < 518) 
            this.action &= ~Action.ATTACK;
    }
    public updateAttackDot() {
        // let offset = 17;
 
         let expandOffset = 0, expandRadius = 0;
         if(this.right != ItemIds.HAND) {
            const rightItem = ItemUtils.getItemById(this.right).data;

            expandOffset = rightItem.expandOffset;
            expandRadius = rightItem.expandRadius;

         }
         if(this.right == ItemIds.HAND) {
            expandRadius = 25;
            expandOffset = 15;

         }
         let angle_x = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + Math.cos((this.angle + 31.875) / 127 * Math.PI));
         let angle_y = (Math.sin((this.angle + 31.875) / 127 * Math.PI) + -Math.cos((this.angle + 31.875) / 127 * Math.PI));
 
         this.attack_pos = {
            x: this.x + angle_x * (expandOffset),
            y: this.y + angle_y * (expandOffset),
            radius: expandRadius
         }

     }
    public hitHappened () { 
        
        let handItemEquiped = ItemUtils.getItemById(this.right);

        if(handItemEquiped != null) {
            switch(handItemEquiped.meta_type) {
                case ItemMetaType.SHOVEL: {

                    if(this.stateManager.isInSea) return;

                    let itemToGive = this.stateManager.isInSand ? ItemIds.SAND : ItemIds.GROUND;
                    let countIncrease = handItemEquiped.data.mine_increase;

                    this.inventory.addItem(itemToGive, countIncrease);

                    break;
                }

                case ItemMetaType.BOW: {
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

        const entities = this.gameServer.queryManager.queryCircle(this.attack_pos.x , this.attack_pos.y , this.attack_pos.radius);
        for(let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if(ent.id == this.id) { 
                continue;
            }
            //@ts-ignore
            if(ent.isFly != this.isFly) continue;
            

            ent.receiveHit(this);
        }
          
    }
}