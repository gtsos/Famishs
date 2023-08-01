import { Player } from '../entity/Player';
import { DataType } from '../enums/DataType';
import { EntityType } from '../enums/EntityType';
import { ItemIds } from '../enums/ItemIds';
import { ObjectType } from '../enums/ObjectType';
import { WorldModes } from '../enums/WorldModes';
import { Loggers } from '../logs/Logger';
import { GameProfile } from '../models/GameProfile';
import { IHandshake } from '../models/IHandshake';
import { GameServer } from "../GameServer";
import { MarketIds } from "../enums/MarketIds";
import { BoxIds } from '../enums/BoxIds';
import { VehiculeType } from '../enums/VehiculeType';
import { QuestType } from "../enums/QuestType";

const TodoList = {
    'First-Step': {
        'Join with custom nickname/skin/etc': true,
        'Multiplayer (Sync)': true,
        'World Map & Resources': true,
        'Token System': false
    },
    'Ingame Mechanics': {
        'Dying': false,
        'Hitting': {
            'Gathering': true,
            'PvP (Hitting players)': true
        },
        'Movement': {
            'Collision': true,
            'Speed changing': true,
            'Vehicles': false
        },
        'Resources': {
            'Tools Dependent': true,
            'Resources multiplier': true,
            'Resources limit per resource': true
        },
        'Farming': {
            'Planting': false,
            'Grow speed & Plots': false,
            'Pitchfork': false
        },
        'Teams': {
            'Creating teams': false,
            'Kick from team': false,
            'Lock Totem': false
        },
        'Console': 'np',
        'Biomes': 'np',
        'Shop': true,
        'Kits': false,
        'Quests': false,
        'Cooldowns': true,
        'Building': true,
        'Crafting': false,
        'Leaderboard': true,
        'Equipment': true,
        'Chatting': true,
        'Gauges': true,
    }
};

function renderTodoList(obj: any, indent: string = '#ffffff ') {
    let result = '';

    return result;
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'object') {
                result += (indent + '🟦 ' + key) + '\n';
                result += renderTodoList(value, indent + '      ');
            } else {
                const test = value == 'np' ? '❌' : (value ? '✅' : '⬛');
                result += (indent + test + key) + '\n';
            }
        }
    }

    return result;
}

import serverSettings from '../settings/serverconfig.json';
import { Action } from '../enums/Action';
import { Craft } from '../craft/CraftManager';
import { ENV_MODE } from '..';
import { MODES } from '../types/env.mode';
import { MapObject } from '../entity/MapObject';
import { TokenScope } from 'xregexp';
import { TokenScore } from './tokenManager';
export class Utils {
 
    public static isMob(entity: any) {
        return entity.ownerClass != null && entity.ownerClass.factoryOf && entity.ownerClass.factoryOf == "animal";
    }//a
    public static isPlayer(entity: any) {
        return entity.type == EntityType.PLAYERS;
    }
    public static isBuilding(entity: any) {
        return entity.ownerClass != null && entity.ownerClass.factoryOf && entity.ownerClass.factoryOf == "building"
    }
    public static isBox(entity: any) {
        return entity.ownerClass != null && entity.ownerClass.factoryOf && entity.ownerClass.factoryOf == "box";
    }
    public static isMapObject(entity: any) {
        return entity instanceof MapObject;
    }
    public static reverseString(string: any) {
        return string.split("").reverse().join("");
    }
    public static fromCharCode(codes: any) {
        return codes.map(((code: any) => String.fromCharCode(code))).join("")
    }
    public static genRandomString(length: any) {
        let stringArr = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM", 
        str = "";
        for (let i = 0; i < length; i++) {
            str += stringArr[~~(Math.random() * stringArr.length)]
        };
        return str;
    }
    public static joinString(arr: any) {
        let str="";
        for (let i = 0; i < arr.length; i++) {
            let string = Utils.genRandomString(Utils.randomMaxMin(3, 25));
            str += arr[i] + string;
        }
        return str;
    }
    public static isInSand (entity: any) {
        const differentBetweenMaxX = ~~Math.abs(serverSettings.world.Width - entity.x);
        const differentBetweenMaxY = ~~Math.abs(serverSettings.world.Height - entity.y);

        const isBoundsFirst = differentBetweenMaxX >= 100 && differentBetweenMaxY >= 200 && (differentBetweenMaxX < 376 || differentBetweenMaxY < 616);
        const isBoundsSecond = entity.x >= 235 && entity.y >= 430 && (entity.x <= 600 || entity.y <= 800);

        return isBoundsFirst || isBoundsSecond;
    }
    public static isInOutsideWater(entity: any) {
        const differentBetweenMaxX = ~~Math.abs(serverSettings.world.Width - entity.x);
        const differentBetweenMaxY = ~~Math.abs(serverSettings.world.Height - entity.y);

        return differentBetweenMaxX <= 100 || differentBetweenMaxY <= 200 || entity.x <= 234 || entity.y < 430;
    }
    public static getNearestInRange(entity: any, radius: number) {
        const entityArr = entity.gameServer.queryManager.queryPlayers(entity.x, entity.y, radius);

        if (!entityArr.length) return null;

        const nearest = Utils.getNearest(entity, entityArr);
        return nearest;
    }
    public static fromAngle(angle: number) {
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
    }
    public static isInIsland(obj: any) {
        //@ts-ignore
        for (let i = 0; i < serverSettings.world.islands.length; i++) {
            let island = serverSettings.world.islands[i];

            if(obj.x >= island[0][0] && obj.y >= island[0][1] && obj.x <= island[1][0] && obj.y <= island[1][1]) return true;
        }
        return false;
    }
    public static backInHandshake (player: Player, handshake: IHandshake, tokenScore: any = null): any[] {

        const playersArr = Array.from(player.gameServer.players.values()).map(x => this.getHandshakeModelProfile(x, player.gameProfile.name));

        const craftsJson = [];
        for(const craft of player.gameServer.crafts) {
          //  console.log(craft)
            craftsJson.push((craft as Craft).toObject());
        }
        let tData = [];

        if(player.totemFactory) {
            for(let i = 0; i < player.totemFactory.data.length; i++) {
                const d = player.totemFactory.data[i]

                tData.push(d.id);
            }
        }

        if ( !tokenScore ) tokenScore = player.tokenScore ?? null;
        let tScore = 0;
        if ( tokenScore ) { tScore = tokenScore.score; }
     
        const backIn = [
            WorldModes.EXPERIMENTAL, 
            player.gameProfile.days, 
            player.x, 
            playersArr, 
            player.gameServer.worldCycle.cycle, // world time 
            0, // is ghost 
            1,//serverSettings.server.buildingLimit, 
            tData, // totem 
            player.playerId, // pid 
            player.y, 
            serverSettings.server.playerLimit, 
            0, // tokenid 
            tScore, //kit points kekw 
            player.inventory.serialize(), //inv 
            player.gameServer.worldCycle.time, //clock time hours xd 
            Date.now() - player.spawnTime, //spawn diff atm no works 1
            player.completeQuests, //quests shit 
            0, //not sure а у меня тут 0 
            23172, //seed 
            // forest sizes: 153,153 , seed: 23172
             Math.floor(serverSettings.world.Width / 100), // map width
             Math.floor(serverSettings.world.Height / 100), // map height
            0, // islands count
            serverSettings.world.map, // custom map shit as [] if map define
            "", // title msg server
            craftsJson, // custom recipes
            0, // is desert going
            0 // is blizzard going
        ];
       
        return backIn;
    }

    public static randomMaxMin(min: number , max:number):number {
        return min + Math.floor(Math.random() * (max - min));
    }

    public static getQuestRewardByQuestType(type: QuestType) {
        switch(type) {
            case QuestType.DRAGON_CUBE: return [5000, ItemIds.DRAGON_CUBE];
            case QuestType.DRAGON_ORB: return [5000, ItemIds.DRAGON_ORB];
            case QuestType.GREEN_CROWN: return [5000, ItemIds.GEMME_GREEN];
            case QuestType.ORANGE_CROWN: return [5000, ItemIds.GEMME_ORANGE];
            case QuestType.BLUE_CROWN: return [5000, ItemIds.GEMME_BLUE];
            default: return null;
        }
    }

    public static getItemInStorage(type: EntityType) {
        switch(type) {
            case EntityType.EXTRACTOR_MACHINE_STONE: return ItemIds.STONE;
            case EntityType.EXTRACTOR_MACHINE_GOLD: return ItemIds.GOLD;
            case EntityType.EXTRACTOR_MACHINE_DIAMOND: return ItemIds.DIAMOND;
            case EntityType.EXTRACTOR_MACHINE_AMETHYST: return ItemIds.AMETHYST;
            case EntityType.EXTRACTOR_MACHINE_REIDITE: return ItemIds.REIDITE;
            default: return -1;
        }
    }

    public static checkVehiculeCondition(player: Player, vehicule_type: VehiculeType): boolean {
        switch(vehicule_type) {
            case VehiculeType.FLOAT: return !player.stateManager.isCollides && player.stateManager.isInSea && !player.stateManager.isInBridge;
            case VehiculeType.GROUND: return !player.stateManager.isCollides && !player.stateManager.isInWater;
            case VehiculeType.FLY: return !player.stateManager.isCollides;
            default: return false;
        }
    }

    public static getHandshakeModelProfile(player: Player, requestName: String = ""): object {

        if(ENV_MODE == MODES.TEST) {
            return {
                n: requestName == player.gameProfile.name ? player.gameProfile.name : `Tester`,
                s: player.gameProfile.skin,
                a: player.gameProfile.accessory,
                b: player.gameProfile.book,
                d: player.gameProfile.deadBox,
                c: player.gameProfile.box,
                l: player.gameProfile.level,
                g: player.gameProfile.baglook,
                p: player.gameProfile.score,
                i: player.playerId
            }
        }else { 
            return {
                n: player.gameProfile.name,
                s: player.gameProfile.skin,
                a: player.gameProfile.accessory,
                b: player.gameProfile.book,
                d: player.gameProfile.deadBox,
                c: player.gameProfile.box,
                l: player.gameProfile.level,
                g: player.gameProfile.baglook,
                p: player.gameProfile.score,
                i: player.playerId
            }
        }
       
    }
    public static isEquals (data: unknown, type:DataType): boolean {

        switch(type) {
            case DataType.ARRAY: return Array.isArray(data);
            case DataType.FLOAT: return isFinite(data as number) && ((data as number) % 1) != data;
            case DataType.INTEGER: return typeof data == 'number';
            case DataType.STRING: return typeof data === 'string';
            case DataType.OBJECT: return typeof data === 'object';
            default: {
                Loggers.app.error('Unknown DataType: {0}', data);
                return false;
            }
        }
        
    }
    public static isContains(id: number, arr: any) {
        return arr.find((e: any) => e.id == id);
    }
    public static calculateAngle255(angle: number) {
        let pi2 = Math.PI * 2;
        return Math.floor((((angle + pi2) % pi2) * 255) / pi2)
    }
    public static referenceAngle(angle: number) {
        return (((angle / 255) * Math.PI) * 2);
    }
    public static getPointOnCircle(x: number, y: number, angle: number, radius: number){
        return {
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius
        }
    }
    static random_min_max (min:number,max:number) {
        return min + (Math.floor(Math.random() * (max - min)));
    }
    static angleDifference(a1:number, a2:number){
        let max = Math.PI * 2;
        let diff = (a2 - a1) % max;
        return Math.abs(2 * diff % max - diff);
    }
    static distanceSqrt(x1:number,y1:number,x2:number,y2:number){
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }
    static distanceHypot(x1:number, y1:number, x2:number, y2:number){
        return Math.hypot(x2 - x1, y2 - y1);
    }
    public static angleDiff(x1: number, y1: number, x2: number, y2: number) {

        const dx = x1 - x2;
        const dy = y1 - y2;

        return Math.atan2(dy, dx);
    }
    public static isCirclesCollides (x1: number , y1: number , x2: number, y2: number, r1: number, r2: number): boolean {

        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);

        if(Math.hypot(dx,dy) <= (r1 + r2)) return true;

        return false;
    }
    public static getCircleDist (x1: number , y1: number , x2: number, y2: number) {

        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);

        return Math.hypot(dx,dy);
    }
    static difference(a1:number, a2:number) {
        return a1 - a2;
    }

    static getNearest(obj: any, entities: any[]): any {
        const target = {
            entity: null,
            dist: -1,
        };

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const dist = this.distanceSqrt(obj.x, obj.y, entity.x, entity.y);
            if (target.dist == -1 || dist < target.dist) {
                target.entity = entity;
                target.dist = dist;
            }
        };

        return target;
    };

    public static getBoxSkin(type: number): number {
        switch(type) {
            case EntityType.WOLF: return BoxIds.WOLF;
            case EntityType.RABBIT: return BoxIds.RABBIT;
            case EntityType.BOAR: return BoxIds.BOAR;
            case EntityType.SPIDER: return BoxIds.SPIDER;
            case EntityType.PIRANHA: return BoxIds.PIRANHA;
            case EntityType.KRAKEN: return BoxIds.KRAKEN;
            default: return 0;
        };
    };

    public static getObjectType (type: string): ObjectType {
  
        switch(type) {
            case 'cactus':  return ObjectType.CACTUS;
            case 'emerald':  return ObjectType.EMERALD;
            case 'cave_stone':  return ObjectType.CAVE_STONE;
            case 'reidite':  return ObjectType.REIDITE;
            case 'island_palma':  return ObjectType.PALM;
            case "island": return ObjectType.ISLAND;
            case 'berry':  return ObjectType.BERRY_BUSH;
            case 'stone':  return ObjectType.STONE;
            case 'tree':  return ObjectType.TREE;
            case 'pizdecKvadrat':  return ObjectType.TREE;
            case 'amethyst':  return ObjectType.AMETHYST;
            case 'diamond':  return ObjectType.DIAMOND;
            case 'gold': return ObjectType.GOLD;
            case "river": return ObjectType.RIVER;
        }
      
        console.log('undefined obj type: ' + type)
        return ObjectType.TREE;
    }
    public static getMarket(id: number, count: number): any {
        switch(id) {
            case MarketIds.WOOD: return [[ItemIds.WOOD, ItemIds.PLANT], Math.min(249, Math.max(0, (~~count * 3)))];
            case MarketIds.STONE: return [[ItemIds.STONE, ItemIds.PUMPKIN], Math.min(248, Math.max(0, ~~(count * 4)))];
            case MarketIds.GOLD: return [[ItemIds.GOLD, ItemIds.BREAD], Math.min(246, Math.max(0, ~~(count * 6)))];
            case MarketIds.DIAMOND: return [[ItemIds.DIAMOND, ItemIds.CARROT], Math.min(63, Math.max(0, ~~(count / 4)))];
            case MarketIds.AMETHYST: return [[ItemIds.AMETHYST, ItemIds.TOMATO], Math.min(31, Math.max(0, ~~(count / 8)))];
            case MarketIds.REIDITE: return [[ItemIds.REIDITE, ItemIds.THORNBUSH], Math.min(15, Math.max(0, ~~(count / 16)))];
            case MarketIds.PUMPKIN: return [[ItemIds.PUMPKIN_SEED, ItemIds.BREAD], Math.min(25, Math.max(0, ~~(count / 10)))];
            case MarketIds.CARROT: return [[ItemIds.CARROT_SEED, ItemIds.PUMPKIN], Math.min(15, Math.max(0, ~~(count / 16)))];
            case MarketIds.TOMATO: return [[ItemIds.TOMATO_SEED, ItemIds.CARROT], Math.min(12, Math.max(0, ~~(count / 20)))];
            case MarketIds.THORNBUSH: return [[ItemIds.THORNBUSH_SEED, ItemIds.TOMATO], Math.min(8, Math.max(0, ~~(count / 30)))];
            case MarketIds.GARLIC: return [[ItemIds.GARLIC_SEED, ItemIds.THORNBUSH], Math.min(6, Math.max(0, ~~(count / 40)))];
            case MarketIds.WATERMELON: return [[ItemIds.WATERMELON_SEED, ItemIds.GARLIC], Math.min(4, Math.max(0, ~~(count / 60)))];
            default: return -1;
        }
    }
    public static getKit(id: number): any {

        switch(id) {

            case 1: return [1000, [ItemIds.FIRE, 2], [ItemIds.COOKED_MEAT, 1], [ItemIds.PLANT, 8], [ItemIds.BREAD, 1]];
            case 2: return [2000, [ItemIds.BIG_FIRE, 2], [ItemIds.PICK_WOOD, 1], [ItemIds.COOKED_MEAT, 2], [ItemIds.PLANT, 16], [ItemIds.BREAD, 2]];
            case 3: return [4000, [ItemIds.BIG_FIRE, 3], [ItemIds.PICK, 1], [ItemIds.COOKED_MEAT, 4], [ItemIds.PLANT, 20], [ItemIds.BREAD, 4], [ItemIds.WORKBENCH, 1], [ItemIds.STONE, 80], [ItemIds.WOOD, 140]];
            case 4: return [8000, [ItemIds.BAG, 1],[ItemIds.BIG_FIRE, 4], [ItemIds.PICK_GOLD, 1], [ItemIds.COOKED_MEAT, 6], [ItemIds.PLANT, 30], [ItemIds.BREAD, 6], [ItemIds.WORKBENCH, 1], [ItemIds.STONE, 150], [ItemIds.WOOD, 200], [ItemIds.GOLD, 80], [ItemIds.BOTTLE_FULL, 2]];
            case 5: return [16000, [ItemIds.BAG, 1],[ItemIds.PICK_DIAMOND, 1], [ItemIds.BED, 1], [ItemIds.CAKE, 7], [ItemIds.BOTTLE_FULL, 2], [ItemIds.BIG_FIRE, 2], [ItemIds.FURNACE, 1], [ItemIds.STONE_WALL, 15], [ItemIds.STONE_DOOR, 2], [ItemIds.TOTEM, 1], [ItemIds.SPANNER, 1], [ItemIds.STONE, 200], [ItemIds.WOOD, 300]];
            case 6: return [16000, [ItemIds.BAG, 1],[ItemIds.FUR_HAT, 1], [ItemIds.SHOVEL_GOLD, 1], [ItemIds.PICK_GOLD, 1], [ItemIds.CAKE, 10], [ItemIds.BOTTLE_FULL, 4], [ItemIds.BIG_FIRE, 6], [ItemIds.BANDAGE, 3], [ItemIds.BOOK, 1], [ItemIds.STONE, 200 ] , [ItemIds.WOOD, 300]];
            case 7: return [16000, [ItemIds.BAG, 1],[ItemIds.HOOD, 1], [ItemIds.HAMMER_GOLD, 1], [ItemIds.BANDAGE, 3], [ItemIds.SWORD, 1], [ItemIds.PICK_GOLD, 1], [ItemIds.CAKE, 7], [ItemIds.BOTTLE_FULL, 2], [ItemIds.BIG_FIRE, 4], [ItemIds.STONE, 150 ] , [ItemIds.WOOD, 200], [ItemIds.LOCKPICK, 1]];
            case 8: return [16000, [ItemIds.BAG, 1],[ItemIds.PEASANT, 1], [ItemIds.PICK_GOLD, 1], [ItemIds.CAKE, 7], [ItemIds.BOTTLE_FULL, 2], [ItemIds.BIG_FIRE, 4], [ItemIds.WINDMILL, 2], [ItemIds.BREAD_OVEN, 4], [ItemIds.PLOT, 10], [ItemIds.WHEAT_SEED, 6], [ItemIds.SEED, 4], [ItemIds.WATERING_CAN_FULL, 1] , [ItemIds.WOOD, 500]];
            case 9: return [16000, [ItemIds.BAG, 1],[ItemIds.PICK_GOLD, 1], [ItemIds.FOODFISH_COOKED, 16], [ItemIds.BOTTLE_FULL, 1], [ItemIds.BIG_FIRE, 6], [ItemIds.BANDAGE, 3], [ItemIds.DIVING_MASK, 1], [ItemIds.SWORD, 1], [ItemIds.BRIDGE, 16], [ItemIds.STONE, 150 ] , [ItemIds.WOOD, 200]];
            case 10: return [20000, [ItemIds.BAG, 1],[ItemIds.PICK_GOLD, 1], [ItemIds.CAKE, 1], [ItemIds.BOTTLE_FULL, 1], [ItemIds.BIG_FIRE, 3], [ItemIds.BANDAGE, 3], [ItemIds.GOLD_HELMET, 1], [ItemIds.SWORD_GOLD, 1], [ItemIds.DIAMOND_SPEAR, 1], [ItemIds.GOLD_SPIKE, 2], [ItemIds.STONE, 50 ] , [ItemIds.WOOD, 100]];
            default: return -1;

        }

    }
    public static deserealizeMapUnit(array = []): any {
        return {
            type: array[0],
            radius: array[3],
            x: array[1],
            y: array[2],
            show: array[4]
        }
    }

    public static objectEquals(x: any, y: any, this_: any) {
    
        if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
        // after this just checking type of one would be enough
        if (x.constructor !== y.constructor) { return false; }
        // if they are functions, they should exactly refer to same one (because of closures)
        if (x instanceof Function) { return x === y; }
        // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
        if (x instanceof RegExp) { return x === y; }
        if (x === y || x.valueOf() === y.valueOf()) { return true; }
        if (Array.isArray(x) && x.length !== y.length) { return false; }
    
        // if they are dates, they must had equal valueOf
        if (x instanceof Date) { return false; }
    
        // if they are strictly equal, they both need to be object at least
        if (!(x instanceof Object)) { return false; }
        if (!(y instanceof Object)) { return false; }
    
        // recursive object equality check
        var p = Object.keys(x);
        return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) &&
            p.every(function (i):any { return this_.objectEquals(x[i], y[i], this_); });
    }

    public static indexFromMapObject(name: string): any {
        switch(name) {
            case 'p': return {i: 0, needSize: false};
            case 's': return {i: 1, needSize: true};
            case 't': return {i: 4, needSize: true};
            case 'g': return {i: 10, needSize: true};
            case 'd': return {i: 13, needSize: true};
            case 'b': return {i: 16, needSize: true};
            case 'f': return {i: 20, needSize: true};
            case 'sw': return {i: 23, needSize: true};
            case 'gw': return {i: 26, needSize: true};
            case 'dw': return {i: 29, needSize: true};
            case 'a': return {i: 32, needSize: true};
            case 'cs': return {i: 35, needSize: true};
            case 'plm': return {i: 40, needSize: true};
            case 're': return {i: 50, needSize: true};
            case 'c': return {i: 55, needSize: false};
            case 'm': return {i: 56, needSize: true};
            case "r": return {i: -1, needSize: false};
        }
    }

    public static entityTypeFromItem(item: number) {
        const asAny = ItemIds as any;

        for(const itemIds in asAny) 
            if(asAny[itemIds] == item) 
                return (EntityType as any)[itemIds];
            
        return null;
    }

    public static InMap (value: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
        return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    };
   
}



export class EvelCodec {
    
    constructor() {

    }

    static unpack(bytes: any,offset = 10) {
        const chars = [];

        let unminfiedarr = []
        for(let i = 0, n = bytes.length; i < n;) {
            chars.push(((bytes[i++] & 0xff) << 8) | (bytes[i++] & 0xff));
        }
        
        for(let i = 0; i < chars.length; i++) {
            unminfiedarr.push((chars[i] / (chars.length - i)));
        }

        return String.fromCharCode.apply(null, unminfiedarr)
    }

    static pack(str: any) {
        str = String(str);
        var bytes = [];

        for(var i = 0, n = str.length; i < str.length; i++) {
            var char = str.charCodeAt(i);
            char = (char * (n - i));
            bytes.push((char >>> 8) , (char & 0xff));
        }

        const arr = new Uint8Array(bytes.length);
        
        for(let i = 0; i < bytes.length; i++) {
            arr[i] = bytes[i];
        }

        return arr;
    }
   
}