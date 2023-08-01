import { Player } from "../entity/Player";
import { EntityType } from "../enums/EntityType";
import { QuestType } from "../enums/QuestType";

export class StateManager {
    
    public holdingAttack: boolean;
    public player: Player;
    public lastAttack: number;
    public isInWater: boolean = false;
    public isInRiver: boolean = false;
    public isInFire: boolean = false;
    public isWorkbench: boolean = false;
    public isInSand: boolean = false;
    public isInBridge: boolean = false;
    public isInIsland: boolean = false;
    public isInSea: boolean = false;
    public isInBed: boolean = false;
    public isInRoof: boolean = false;

    public isCollides: boolean = false;

    public isFrictionEnabled: boolean = false;

    public lastAnimalsHit: any = {
        [EntityType.PIRANHA]: -1,
        [EntityType.WOLF]: -1,
        [EntityType.SPIDER]: -1,
        [EntityType.KRAKEN]: -1,
        [EntityType.BEAR]: -1,
        [EntityType.BOAR]: -1,
        [EntityType.FOX]: -1,
        [EntityType.DRAGON]: -1,
        [EntityType.LAVA_DRAGON]: -1,
        [EntityType.BABY_LAVA]: -1,
        [EntityType.BABY_MAMMOTH]: -1,
        [EntityType.BABY_DRAGON]: -1,
        [EntityType.SAND_WORM]: -1,
        [EntityType.FLAME]: -1,
        [EntityType.HAWK]: -1,
    };

    public killedEntities: any = {
        [EntityType.TREASURE_CHEST]: 0,
    };
    
    constructor(player:Player) {

        this.holdingAttack = false;
        this.player = player;
        this.lastAttack = -1;
    }
}