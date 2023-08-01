import devConfig from "../staticSettings/devconfig.json";
import serverConfig from "../settings/serverconfig.json";
import { TokenScore } from '../utils/tokenManager';

export class IHandshake {
    public readonly name: string;
    public readonly token: string;
    public readonly token_id: string;
    public readonly sw: number;
    public readonly sh: number;
    public readonly version: number;
    
    
    constructor (name: string, token: string , token_id: string, sw: number, sh: number, version: number) {
        this.name = name === "" ? `unnnamed#${Math.floor(Math.random() * 1001)}` : name;
        /**
         * If our nick size > 16 we slice other elemts
         * If our nick size > 200 it means player trying to fuck whole server with large data
         * so we set their name to clown
         */
        if(this.name.length > 200) this.name = "clown";
        if (this.name.length > 16) this.name = this.name.slice(16, this.name.length);
        /**
         * Token for response
         */
        this.token = token;
        this.token_id = token_id;

        /**
         * Settings max ISS Port montior size
         */
        this.sw = Math.min(serverConfig.viewport.width_max,Math.max(0,sw));
        this.sh = Math.min(serverConfig.viewport.height_max,Math.max(0,sh));

        this.version = version > devConfig.server_version ? -1 : version;

    }
}