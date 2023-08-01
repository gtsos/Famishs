import { Loggers } from "../logs/Logger";
import { ConnectionPlayer } from "../network/ConnectionPlayer";

export class DataAnalyzer {
    iConnection: ConnectionPlayer;
    constructor(iCn: ConnectionPlayer) {
        this.iConnection = iCn;
    }

    public analyzeRequest (packetName: string): boolean {
        let responseState = true;
        const request = this.iConnection.request;
        
        const splObscured = request.url?.split("/") as any;
       
        if(splObscured.length < 2) {
            this.iConnection.gameServer.globalAnalyzer.addToBlackList(this.iConnection.userIp);
            Loggers.game.info(`Banned Bot Attempt from ${this.iConnection.userIp} with name ${packetName}`)
            return false;
        }
        
        const requestData = splObscured[1];

        return responseState;
    }
}