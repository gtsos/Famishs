"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TotemFactory = void 0;
class TotemFactory {
    sourceEntity;
    constructor(sourceEntity) {
        this.sourceEntity = sourceEntity;
    }
    isTeammate(id) {
        return this.sourceEntity.data.find((e) => e.id == id);
    }
}
exports.TotemFactory = TotemFactory;
