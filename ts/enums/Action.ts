export enum Action {
    DELETE = 1 << 0,
    HURT = 1 << 1,
    COLD = 1 << 2,
    HUNGER = 1 << 3,
    ATTACK = 1 << 4,
    WALK = 1 << 5,
    IDLE = 1 << 6,
    HEAL = 1 << 7,
    WEB = 1 << 8
}