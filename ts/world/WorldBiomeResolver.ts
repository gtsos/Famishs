import { GameServer } from "../GameServer";
import { Entity } from "../entity/Entity";
import { Player } from "../entity/Player";
import { Biomes } from "../enums/Biomes";
import serverConfig from "../settings/serverconfig.json"
export const WORLD = {
    TOP: 1,
	BOTTOM: 2,
	LEFT: 4,
	RIGHT: 8,
	ROTATE: 10,
}
export class Biome {
    x1: number;
    y1: number;
    w: number;
    h: number;
    x2: number;
    y2: number;
    t: any;
    v: any
    constructor (t:number, x:number, y:number, w:number, h:number, v = 15) {
		this.x1 = x * 100;
		this.y1 = y * 100;
		this.w =  w * 100;
		this.h = h * 100;
		this.x2 = (x + w) * 100;
		this.y2 = (y + h) * 100;
		this.t = t;

		this.v = v;
	}
}

export class WorldBiomeResolver {
    static dist_from_sand(biome: Biome, x:any, y:any) {
      
		var is_sand = 0;
		let x1 = (biome.x1 + 30) + (((biome.v & WORLD.LEFT) === 0) ? 150 : 0);
		var d = x - x1;
		if ((((biome.v & WORLD.LEFT) > 0) && (d > 0)) && (d < 320))
			is_sand = 1;

		let y1 = (biome.y1 + 250) + (((biome.v & WORLD.TOP) === 0) ? 150 : 0);
		d = y - y1;
		if ((((biome.v & WORLD.TOP) > 0) && (d > 0)) && (d < 320))
			is_sand = 1;

		let x2 = (biome.x2 + 80) + (((biome.v & WORLD.RIGHT) === 0) ? -200 : 0);
		d = x2 - x;
		if ((((biome.v & WORLD.RIGHT) > 0) && (d > 0)) && (d < 320))
			is_sand = 1;

		let y2 = (biome.y2 - 200) + (((biome.v & WORLD.BOTTOM) === 0) ? -200 : 0);
		d = y2 - y;
		if ((((biome.v & WORLD.BOTTOM) > 0) && (d > 0)) && (d < 320))
			is_sand = 1;

		if ((((x >= x1) && (x <= x2)) && (y >= y1)) && (y <= y2))
			return is_sand;

		return 0;
	}
    static get_biome_id (b: Entity) {
        let id = Biomes.SEA;


        if ((b.dist_sand > 0) || (b.dist_desert > 0))
            id = Biomes.DESERT;
        else if (b.dist_dragon > 0)
            id = Biomes.DRAGON;
        else if (b.dist_winter > 0)
            id = Biomes.WINTER;
        else if (b.dist_lava > 0)
            id = Biomes.LAVA;
        else if (b.dist_forest > 0)
            id = Biomes.FOREST;
        
        return id;
    }
    static update_dist_in_biomes( entity: Entity ) {
        const world = entity.gameServer.worldGenerator;

        var x = entity.x;
        var y = entity.y;
    
        entity.dist_winter = -1000000;
        entity.dist_desert = -1000000;
        entity.dist_sand = -1000000;
        entity.dist_lava = -1000000;
        entity.dist_dragon = -1000000;
        entity.dist_forest = -1000000;
        for(var k = 0; k < world.biomes.length; k++) {
            if (world.biomes[k].t === Biomes.FOREST) {
                const new_dist = WorldBiomeResolver.dist_from_biome(k, x, y, world);

                entity.dist_forest = Math.max(entity.dist_forest, WorldBiomeResolver.dist_from_biome(k, x, y, world));
                
                if ((new_dist > 0) && (WorldBiomeResolver.dist_from_sand(world.biomes[k], x, y) === 1))
					entity.dist_sand = 1;
            }
            else if (world.biomes[k].t === Biomes.WINTER)
            entity.dist_winter = Math.max(entity.dist_winter, WorldBiomeResolver.dist_from_biome(k, x, y, world));
            else if (world.biomes[k].t === Biomes.DESERT)
                entity.dist_desert = Math.max(entity.dist_desert, WorldBiomeResolver.dist_from_biome(k, x, y, world));
            else if (world.biomes[k].t === Biomes.LAVA) {
                entity.dist_lava = Math.max(entity.dist_lava, WorldBiomeResolver.dist_from_biome(k, x, y, world));
            } else if (world.biomes[k].t === Biomes.DRAGON)
                entity.dist_dragon = Math.max(entity.dist_dragon, WorldBiomeResolver.dist_from_biome(k, x, y, world));
    
        }
    
        if (((((entity.dist_winter < 0) && (entity.dist_dragon < 0)) && (entity.dist_forest < 0)) && (entity.dist_dragon < 0)) && (entity.dist_desert < 0))
                entity.dist_water = 1;
        else entity.dist_water = -1000000;
    }
    static dist_from_biome (bid:any, x:any, y:any, worldGen:any) {
        var biome = worldGen.biomes[bid];
        var x1 = biome.x1 + 30;
        var y1 = biome.y1 + 250;
        var x2 = biome.x2 + 80;
        var y2 = biome.y2 - 200;
        if ((((x >= x1) && (x <= x2)) && (y >= y1)) && (y <= y2))
            return Math.min(x - x1, x2 - x, y - y1, y2 - y);
    
        var dist = -1000000;
        if ((x - x1) < 0)
            dist = Math.max(dist, x - x1);
        else if ((x2 - x) < 0)
            dist = Math.max(dist, x2 - x);
    
        var distY = -1000000;
        if ((y < y1) || (y > y2)) {
            if ((y - y1) < 0)
                distY = Math.max(distY, y - y1);
            else
                distY = Math.max(distY, y2 - y);
            if ((dist !== -1000000) && (distY !== -1000000))
                dist = Math.min(dist, distY);
            else
                dist = distY;
        }
        return dist;
    }

    static resolveBiomeSpeed(entity: Player): number {
        let depl = 1;

        
        if(entity.stateManager.isInWater) return 3;

        switch(depl) {
            case Biomes.DESERT: {

                break;
            }
            case Biomes.WINTER: return 1.5;
            case Biomes.LAVA: return 1.5;
            case Biomes.FOREST: return 1;
            case Biomes.DRAGON: return 1.5;
            case Biomes.SEA: return 3;
        }

        return depl;
    }
}