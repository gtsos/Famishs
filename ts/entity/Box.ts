import { Entity } from "./Entity";
import { GameServer } from "../GameServer";
import { EntityType } from "../enums/EntityType";
import { Player } from "./Player";
import { Utils } from "../utils/Utils";
import { ItemIds } from "../enums/ItemIds"

export class Box extends Entity {
    public livingTime: number = -1;
    public spawnTime: number = -1;
    public loot: any;

    public owner: any;

    public factoryOf: string = "box";

    constructor(id: number, owner: any, gameServer: GameServer) {
        super(id, 0, gameServer);

        this.owner = owner;
        this.loot = [];
    }

    public onEntityUpdate() {
        if (Date.now() - this.spawnTime > this.livingTime * 1000) {
            this.gameServer.worldDeleter.initEntity(this, "living");
        }
    }

    public onDead(damager: Player) {
        if (!damager) return;
        
        let gatherIncrease = 1;
        if(damager.right == ItemIds.MACHETE && Utils.isMob(this.owner)) {
            gatherIncrease = 2;
        }
      
        for (let i = 0; i < this.loot.length; i++) {
            const loot = this.loot[i]; 

            damager.inventory.addItem(loot[0], loot[1] * gatherIncrease);
        };
    }

    public setLoot(item: number, count: number) {
        if(count <= 0) return;

        switch(this.type) {
            case EntityType.CRATE:
                this.loot.push([item, count]);
                break;
            case EntityType.DEAD_BOX:
                this.loot.push([item, count > 255 ? 255 : count < 0 ? 0 : count]);
                break;
        }
    };

    public onSpawn(x: number, y: number, angle: number, type: number, info: number) {
        this.initEntityData(x, y, angle, type, false);

        this.spawnTime = Date.now();

        this.info = info;

        switch(type) {
            case EntityType.CRATE:
                this.livingTime = 16;
                this.max_health = 30;
                this.health = this.max_health;
                break;
            case EntityType.DEAD_BOX:
                this.livingTime = 240;
                this.max_health = 240;
                this.health = this.max_health;
                break;
        }
    }
}