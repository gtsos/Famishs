"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vector2 = void 0;
class Vector2 {
    static build_vector(angle, r) {
        return {
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r
        };
    }
    static add_vector(player, pos) {
        player.x += pos.x;
        player.y += pos.y;
    }
    static get_std_angle(o1, o2) {
        return this.get_angle({
            x: 1,
            y: 0
        }, this.get_vector(o1, o2));
    }
    static get_angle(v1, v2) {
        return Math.acos(this.scalar_product(v1, v2) / (this.norm(v1) * this.norm(v2))) * this.sign(this.cross_product(v1, v2));
    }
    static scalar_product(v1, v2) {
        return (v1.x * v2.x) + (v1.y * v2.y);
    }
    static norm(v) {
        return Math.sqrt((v.x * v.x) + (v.y * v.y));
    }
    static sign(a) {
        return a < 0 ? -1 : 1;
    }
    static cross_product(v1, v2) {
        return (v1.x * v2.y) - (v1.y * v2.x);
    }
    static get_vector(v1, v2) {
        return {
            x: v1.x - v2.x,
            y: v1.y - v2.y
        };
    }
}
exports.Vector2 = Vector2;
class Vector2D {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static fromAngle(angle) {
        return new Vector2D(Math.cos(angle), Math.sin(angle));
    }
    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }
    sub(vec) {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }
    mult(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    div(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }
    get length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        return this.length > 0 ? this.div(this.length) : this;
    }
    setLength(value) {
        return this.normalize().mult(value);
    }
    copy() {
        return new Vector2D(this.x, this.y);
    }
    distance(vec) {
        return this.copy().sub(vec).length;
    }
    angle(vec) {
        const copy = vec.copy().sub(this);
        return Math.atan2(copy.y, copy.x);
    }
    dot(vec) {
        return this.x * vec.x + this.y * vec.y;
    }
    direction(angle, scalar) {
        return this.copy().add(Vector2D.fromAngle(angle).mult(scalar));
    }
}
exports.default = Vector2D;
