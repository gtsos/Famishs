"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntity = exports.EntityAbstractType = void 0;
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
const EntityType_1 = require("../enums/EntityType");
const entityList = serverconfig_json_1.default.entities;
var EntityAbstractType;
(function (EntityAbstractType) {
    EntityAbstractType[EntityAbstractType["LIVING"] = 0] = "LIVING";
    EntityAbstractType[EntityAbstractType["STATIC"] = 1] = "STATIC";
    EntityAbstractType[EntityAbstractType["UPDATABLE"] = 2] = "UPDATABLE";
    EntityAbstractType[EntityAbstractType["DEFAULT"] = 3] = "DEFAULT";
})(EntityAbstractType = exports.EntityAbstractType || (exports.EntityAbstractType = {}));
function getEntity(type) {
    let currentEntity = null;
    for (const entity in entityList) {
        if (EntityType_1.EntityType[entity.toUpperCase()] === type) {
            currentEntity = entityList[entity];
        }
        ;
    }
    return currentEntity;
}
exports.getEntity = getEntity;
;
