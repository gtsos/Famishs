"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IHandshake = void 0;
const devconfig_json_1 = __importDefault(require("../staticSettings/devconfig.json"));
const serverconfig_json_1 = __importDefault(require("../settings/serverconfig.json"));
class IHandshake {
    name;
    token;
    token_id;
    sw;
    sh;
    version;
    constructor(name, token, token_id, sw, sh, version) {
        this.name = name === "" ? `unnnamed#${Math.floor(Math.random() * 1001)}` : name;
        /**
         * If our nick size > 16 we slice other elemts
         * If our nick size > 200 it means player trying to fuck whole server with large data
         * so we set their name to clown
         */
        if (this.name.length > 200)
            this.name = "clown";
        if (this.name.length > 16)
            this.name = this.name.slice(16, this.name.length);
        /**
         * Token for response
         */
        this.token = token;
        this.token_id = token_id;
        /**
         * Settings max ISS Port montior size
         */
        this.sw = Math.min(serverconfig_json_1.default.viewport.width_max, Math.max(0, sw));
        this.sh = Math.min(serverconfig_json_1.default.viewport.height_max, Math.max(0, sh));
        this.version = version > devconfig_json_1.default.server_version ? -1 : version;
    }
}
exports.IHandshake = IHandshake;
