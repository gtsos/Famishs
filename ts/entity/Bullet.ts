import { GameServer } from "../GameServer";
import { CollisionUtils } from "../math/CollisionUtils";
import { WorldEvents } from "../world/WorldEvents";
import { Entity } from "./Entity";

export class Bullet extends Entity {
    
    public asItem: any;
    public createdAt: number;

    public velocity: any = {
        x: 0,
        y: 0
    };

    
    constructor(id: number, playerId: number, gameServer: GameServer, asItem: any){
        super(id, playerId, gameServer);

        this.asItem = asItem;
        this.createdAt = +new Date()

        
    }

    public onDeadEvent () {
       this.health = 0;
       this.updateHealth(null);
    }

    public onEntityUpdate () {

        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;
        
    }
}