
export interface IVector2 {
    x: number,
    y: number
}

export class Vector2 {
    public static build_vector(angle: number, r: number) {
        return {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
        }
    }

    public static add_vector(player: any, pos: IVector2) {
        player.x += pos.x;
        player.y += pos.y;
    }

    public static get_std_angle(o1: any, o2: any) {
        return this.get_angle({
			x: 1,
			y: 0
		}, this.get_vector(o1, o2));
    }

    public static get_angle(v1: IVector2, v2: IVector2) {
        return Math.acos(this.scalar_product(v1, v2) / (this.norm(v1) * this.norm(v2))) * this.sign(this.cross_product(v1, v2));
    }

    public static scalar_product(v1: IVector2, v2: IVector2) {
        return (v1.x * v2.x) + (v1.y * v2.y);
    }

    public static norm(v: IVector2) {
        return Math.sqrt((v.x * v.x) + (v.y * v.y));
    }

    public static sign(a: number) {
        return a < 0 ? -1 : 1
    }

    public static cross_product(v1: IVector2, v2: IVector2) {
        return (v1.x * v2.y) - (v1.y * v2.x);
    }

    public static get_vector(v1: IVector2, v2: IVector2) {
        return {
			x: v1.x - v2.x,
			y: v1.y - v2.y
		};
    }
}

export default class Vector2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static fromAngle(angle: number): Readonly<Vector2D> {
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }

    add(vec: Vector2D): Readonly<Vector2D> {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    sub(vec: Vector2D): Readonly<Vector2D> {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    mult(scalar: number): Readonly<Vector2D> {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    div(scalar: number): Readonly<Vector2D> {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Readonly<Vector2D> {
        return this.length > 0 ? this.div(this.length) : this;
    }

    setLength(value: number): Readonly<Vector2D> {
        return this.normalize().mult(value);
    }

    copy(): Readonly<Vector2D> {
        return new Vector2D(this.x, this.y);
    }

    distance(vec: Vector2D): number {
        return this.copy().sub(vec).length;
    }

    angle(vec: Vector2D): number {
        const copy = vec.copy().sub(this);
        return Math.atan2(copy.y, copy.x);
    }

    dot(vec: Vector2D): number {
        return this.x * vec.x + this.y * vec.y;
    }

    direction(angle: number, scalar: number): Readonly<Vector2D> {
        return this.copy().add(Vector2D.fromAngle(angle).mult(scalar));
    }
}