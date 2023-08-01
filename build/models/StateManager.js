"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const EntityType_1 = require("../enums/EntityType");
class StateManager {
    holdingAttack;
    player;
    lastAttack;
    isInWater = false;
    isInRiver = false;
    isInFire = false;
    isWorkbench = false;
    isInSand = false;
    isInBridge = false;
    isInIsland = false;
    isInSea = false;
    isInBed = false;
    isInRoof = false;
    isCollides = false;
    isFrictionEnabled = false;
    lastAnimalsHit = {
        [EntityType_1.EntityType.PIRANHA]: -1,
        [EntityType_1.EntityType.WOLF]: -1,
        [EntityType_1.EntityType.SPIDER]: -1,
        [EntityType_1.EntityType.KRAKEN]: -1,
        [EntityType_1.EntityType.BEAR]: -1,
        [EntityType_1.EntityType.BOAR]: -1,
        [EntityType_1.EntityType.FOX]: -1,
        [EntityType_1.EntityType.DRAGON]: -1,
        [EntityType_1.EntityType.LAVA_DRAGON]: -1,
        [EntityType_1.EntityType.BABY_LAVA]: -1,
        [EntityType_1.EntityType.BABY_MAMMOTH]: -1,
        [EntityType_1.EntityType.BABY_DRAGON]: -1,
        [EntityType_1.EntityType.SAND_WORM]: -1,
        [EntityType_1.EntityType.FLAME]: -1,
        [EntityType_1.EntityType.HAWK]: -1,
    };
    killedEntities = {
        [EntityType_1.EntityType.TREASURE_CHEST]: 0,
    };
    constructor(player) {
        this.holdingAttack = false;
        this.player = player;
        this.lastAttack = -1;
    }
}
exports.StateManager = StateManager;
