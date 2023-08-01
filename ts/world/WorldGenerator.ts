import { Entity } from "../entity/Entity";
import { MapObject } from "../entity/MapObject";
import { Biomes } from "../enums/Biomes";
import { EntityType } from "../enums/EntityType";
import { ObjectType } from "../enums/ObjectType";
import { GameServer } from "../GameServer";
import { Logger, Loggers } from "../logs/Logger";
import { Utils } from "../utils/Utils";
import { Biome } from "./WorldBiomeResolver";

export class WorldGenerator {
    public gameServer: GameServer;
    public decodedMap: any[] = [];
    public biomes: any[];
    public constructor(gameServer:GameServer) {
        this.gameServer = gameServer;
        this.biomes = [];
    }
    

    public generateWorld(config: any) {
        const createTs = +new Date();
        Loggers.game.info("Regeneration of map started..");

        this.decodeWorld(config);
       
        for(let i = 0; i < this.decodedMap.length; i++) {
            const map_obj_data = this.decodedMap[i];
         
          
            switch(map_obj_data.type) {    
                case "cactus":
                case "emerald":
                case "cave_stone":
                case "reidite":
                case "island_palma":
                case "berry":
                case "stone":
                case "tree":
                case "pizdecKvadrat":
                case "amethyst":
                case "island":
                case "diamond":
                case "river":
                case "gold": {
                    const x = 50 + map_obj_data.x * 100;
                    const y = 50 + map_obj_data.y * 100;
                    const radius = map_obj_data.radius;
                    const size = map_obj_data.size;
                    const raw_type = map_obj_data.raw_type;
                    
                    const obj = new MapObject(Utils.getObjectType(map_obj_data.type), x , y, radius, raw_type, size);

                    this.gameServer.initStaticEntity(obj);
                
                    if(obj.type == ObjectType.RIVER || obj.type == ObjectType.LAKE || obj.type == ObjectType.ISLAND) obj.isSolid = false;
                    
                    if(map_obj_data.type == "berry") {
                        const entity = new Entity(this.gameServer.entityPool.nextId(), 0, this.gameServer);
                        entity.info = 1;
                        entity.initEntityData(x,y, 0 , EntityType.FRUIT);
                        this.gameServer.initLivingEntity(entity);
                    
                        obj.setParentEntity(entity);
                    }
                    break;
                }
            }
        }

        Loggers.game.info("Regenerated world within {0}ms", +new Date() - createTs);
    }


    public decodeWorld (config: any) {
        let radius = 0;

        for (let i = 0; i < config.length; i++) {
            const _Map = config[i];
            switch (_Map[1]) {
                case "DRAGON":
                case "WINTER":
                case "DESERT":
                case "LAVA":
                case "FOREST":
                    var __id = Biomes.FOREST;

                    switch(_Map[1]) {
                        case "DRAGON":
                            __id = Biomes.DRAGON;
                        break;
                        case "WINTER":
                            __id = Biomes.WINTER;
                        break;
                        case "DESERT":
                            __id = Biomes.DESERT;
                        break;
                        case "LAVA":
                            __id = Biomes.LAVA;
                        break;
                        case "FOREST":
                            __id = Biomes.FOREST;
                        break; 
                    }
                    this.biomes.push(
                        new Biome(
                            __id,
                            _Map[2],
                            _Map[3],
                            _Map[4],
                            _Map[5]
                        )
                    )
                break;
                case "isl": {
                   const _i = _Map[3];
                   const _j = _Map[4];
                   let r = 50;
                   for (var k = 0; k < 4; k++) {
                    for (var l = 0; l < 5; l++) {
                        if(k >= 3 && l >= 4) continue;
                        this.createSingleIsland(_i - l, _j - k,r);
                        this.createSingleIsland(_i + l, _j - k,r);
                        this.createSingleIsland(_i + l, _j + k,r);
                        this.createSingleIsland(_i - l, _j + k,r);
                    }
                }
                    break;
                }
                case "cs":
                    if(_Map[2] == 0) _Map[2] = 100;
                    if(_Map[2] == 1) _Map[2] = 87;
                    if(_Map[2] == 2) _Map[2] = 95;
                    if(_Map[2] == 3) _Map[2] = 90;
                    this.decodedMap.push({
                        type: "cave_stone",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: 100,
                        raw_type: _Map[1]//a
                    })
                break;
                case "wtb":
                case "r":
                    radius = 50;
                    this.decodedMap.push({
                        type: "river",
                        x: _Map[3],
                        y: _Map[4],
                        size: 1,
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "s":
                    if(_Map[2] == 0)  radius = 95;
                    if(_Map[2] == 1) radius = 87;
                    if(_Map[2] == 2) radius = 50;
                    this.decodedMap.push({
                        type: "stone",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "la":
                    this.decodedMap.push({
                        type: "lava_magma",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "t":
                    
                    if(_Map[2] == 0 || _Map[2] == 1) radius = 95; // old 102
                    if(_Map[2] == 2 || _Map[2] == 3) radius = 70; // old 77
                    if(_Map[2] == 4 || _Map[2] == 5) radius = 55; // old 60
                    this.decodedMap.push({
                        type: "tree",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "b":

                    if(_Map[2] == 3 || _Map[2] == 2) radius = 70;
                    if(_Map[2] == 1 || _Map[2] == 0) radius = 90
                
             
                    this.decodedMap.push({
                        type: "tree",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "f":
                    if(_Map[2] == 0) radius = 124; //old 140
                    if(_Map[2] == 1) radius = 98; //old 115
                    if(_Map[2] == 2) radius = 83; //old 95
                    this.decodedMap.push({
                        type: "pizdecKvadrat",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "c":
                    _Map[2] = 55;
                    this.decodedMap.push({
                        type: "desert_cactus",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    });
                break;
                case "re":
                    if(_Map[2] == 0) radius = 67;
                    if(_Map[2] == 1) radius = 82;
                    if(_Map[2] == 2) radius = 90;   
                    this.decodedMap.push({
                        type: "reidite",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "plm":
                    if(_Map[2] == 0) radius = 30; //old 30
                    if(_Map[2] == 1) radius = 47; //old 47
                    if(_Map[2] == 2) radius = 65; //old 65
                    this.decodedMap.push({
                        type: "island_palma",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "g":
                case "gw":
                    if(_Map[2] == 0) radius = 85;
                    if(_Map[2] == 1) radius = 65;
                    if(_Map[2] == 2) radius = 55;
                    this.decodedMap.push({
                        type: "gold",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "d":
                case "dw":
                    if(_Map[2] == 0) radius = 80;
                    if(_Map[2] == 1) radius = 70;
                    if(_Map[2] == 2) radius = 55;
                    this.decodedMap.push({
                        type: "diamond",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "p":
                  
                    radius = 70;
                    this.decodedMap.push({
                        type: "berry",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "a":
                    if(_Map[2] == 0) radius = 80;
                    if(_Map[2] == 2) radius = 55;
                    if(_Map[2] == 1) radius = 75;
                    this.decodedMap.push({
                        type: "amethyst",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "m":
                    if(_Map[2] == 0) radius = 60;
                    if(_Map[2] == 1) radius = 75;
                    if(_Map[2] == 2) radius = 85;

                    this.decodedMap.push({
                        type: "emerald",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    })
                break;
                case "l":
                    this.decodedMap.push({
                        type: "lake",
                        x: _Map[3],
                        y: _Map[4],
                        size: _Map[2],
                        radius: radius,
                        raw_type: _Map[1]
                    });
                break;
            };
        };
    }

    createSingleIsland (x:number, y:number , radius: number) {
        this.decodedMap.push({
            type: "island",
            x: x,
            y: y,
            radius: radius
        })
    }
}