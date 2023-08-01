import { write } from "fs";
import { Player } from "../entity/Player";
import { ServerPacketTypeBinary } from "../enums/PacketType";
import { BufferWriter } from "../utils/bufferReader";
import { EntityType } from '../enums/EntityType';
import { Action } from "../enums/Action";
import { ItemUtils } from "../utils/itemsmanager";
export enum DamageCauseBy {
    HURT,
    COLD,
    FOOD,
    WATER,
    OXYGEN,
    WARM
}
export class  GaugesManager {
    public readonly sourcePlayer: Player;

    public food: number;
    public cold: number;
    public thirst: number;
    public oxygen: number;
    public warm: number;
    public bandage: number;
    public healTick: number;
    
    public constructor(sourcePlayer: Player) {
        this.sourcePlayer = sourcePlayer;
        this.food = 200;
        this.cold = 200;
        this.thirst = 200;
        this.oxygen = 200;
        this.warm = 0;
        this.bandage = 0;
        this.healTick = 0;
    }

    public tick() {
        this.healTick++;

       //// const nearFire = !!this.sourcePlayer.gameServer.queryManager.queryCircle(this.sourcePlayer.x, this.sourcePlayer.y, 100)
        //    .find(x => x.type == EntityType.BIG_FIRE);
        
        let damageCount = 0;
        let damageCause: Action = Action.HURT;

        if(!this.sourcePlayer.stateManager.isInFire) {
            /**
            * Если есть жара снимаем жару если нет жары снимаем холод
            */

            // console.log(this.sourcePlayer.stateManager.isInFire);

            let coldResist = this.sourcePlayer.gameServer.worldCycle.isDay() ? 2 : 18;
            if(this.sourcePlayer.stateManager.isInWater) coldResist += 7;
                
            if(this.sourcePlayer.hat != 0) {
                let asHat = ItemUtils.getItemById(this.sourcePlayer.hat);
                coldResist -= asHat.data.protectionCold;
            }
            coldResist = Math.max(0, coldResist);

            if(this.warm > 0) {
                this.warm -= coldResist

            }else {
                this.cold -= coldResist;
            }
        }else {

            let coldIncrease = 0;

            if(this.sourcePlayer.hat != 0) {
                let hatEquiped = ItemUtils.getItemById(this.sourcePlayer.hat);
                coldIncrease += hatEquiped.data.protectionCold;
            }
            
            if(this.cold >= 200) {
                this.warm += coldIncrease + 5;

            }else {
                this.cold += coldIncrease + 20;
            }

        }

        if(this.sourcePlayer.stateManager.isInWater) {
            this.thirst += 20;

        }
       
        if(this.thirst <= 0) {
            damageCount += 20;
            damageCause = Action.COLD;
        }

        if(!this.sourcePlayer.stateManager.isInSea) {
            this.oxygen += 70;
            this.oxygen = Math.max(200 , Math.min(0, this.oxygen));

            this.thirst -= 5;
        }

        if(this.oxygen <= 0) {  
            damageCount += 30;
            damageCause = Action.COLD;
        }
        if(this.sourcePlayer.stateManager.isInSea) {
            this.oxygen -= 40;
        }
        
        if(this.cold <= 0) {
            this.cold = 0;
            damageCount += 10;
            damageCause = Action.COLD;
        }

        if(this.warm <= 0) {
            this.warm = 0;
            // умирать не придумали
        }

        this.food -= 5;
        if(this.food <= 0) {
            this.food = 0;
            damageCount += 10;
            damageCause = Action.HUNGER;
        }

    //    this.thirst -= 5;
        if(this.thirst <= 0) {
            this.thirst = 0;
            damageCount += 10;
            damageCause = Action.COLD;
        }

        if(damageCount > 0) {
            this.sourcePlayer.health -= damageCount;
            this.sourcePlayer.action |= damageCause;
            this.healthUpdate();
            this.sourcePlayer.updateHealth(null);
            return;
        }

        if (this.healTick >= 2) {

            if (this.food >= 40 && this.cold >= 40 && this.thirst >= 40 && this.sourcePlayer.health < 200) {
                let healCount = 21;

                const asItem = ItemUtils.getItemById(this.sourcePlayer.hat);

                if(asItem != null && asItem.data.healAdjust != null) {
                    healCount += asItem.data.healAdjust;
                    
                }else if (this.bandage > 0) { 
                    healCount = 40;
                    this.bandage--;
                }

                this.sourcePlayer.health += healCount;
                this.sourcePlayer.action |= Action.HEAL;
            }

            this.healTick = 0;
        } 
        
        this.sourcePlayer.health = Math.max(0 , Math.min(200 , this.sourcePlayer.health));
    }
    public healthUpdate () {
        this.sourcePlayer.health = Math.max(0 , Math.min(200 , this.sourcePlayer.health));

        const writer = new BufferWriter(3);
        writer.writeUInt8(ServerPacketTypeBinary.GaugeLife);
        writer.writeUInt8(Math.floor(this.sourcePlayer.health / 2));
        writer.writeUInt8(Math.floor(this.bandage));

        this.sourcePlayer.controller.sendBinary(writer.toBuffer());
    }
    public update() {

        this.food = Math.min(200 , Math.max(this.food , 0));
        this.cold = Math.min(200 , Math.max(0 , this.cold));
        this.warm = Math.min(200 , Math.max(0 , this.warm));
        this.oxygen = Math.min(200, Math.max(0 , this.oxygen));
        this.thirst = Math.min(200, Math.max(0, this.thirst));

        this.sourcePlayer.health = Math.min(200 , Math.max(0 , this.sourcePlayer.health));
        const writer = new BufferWriter(8);
        
        writer.writeUInt8(ServerPacketTypeBinary.Gauges);
        writer.writeUInt8(Math.floor(this.sourcePlayer.health / 2));
        writer.writeUInt8(Math.floor(this.food / 2));
        writer.writeUInt8(Math.floor(this.cold / 2));
        writer.writeUInt8(Math.floor(this.thirst / 2));
        writer.writeUInt8(Math.floor(this.oxygen / 2));
        writer.writeUInt8(Math.floor(this.warm / 2));
        writer.writeUInt8(Math.floor(this.bandage / 2));

        this.sourcePlayer.controller.sendBinary(writer.toBuffer());
    }
}