export class CollideResult {
    collidesWith: any;
    newPos: any;
    dist: number;
    constructor(collidesWith:any , newPos:any  , dist:any ) {
        this.collidesWith = collidesWith;
        this.newPos = newPos;
        this.dist = dist;
    }
}