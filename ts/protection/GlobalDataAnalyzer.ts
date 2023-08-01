import fs from "fs"
import { GameServer } from "../GameServer";
import path, { dirname } from 'path';
import { Loggers } from "../logs/Logger";


export class GlobalDataAnalyzer {
    
    blacListedData: any;
    gameServer: GameServer;
    hashedIpsList: any;
    tempBlockList: any;
    constructor(gameServer: GameServer) {

        this.blacListedData = [];
        this.gameServer = gameServer;
        this.hashedIpsList = [];
        this.tempBlockList = [];

        this.getListData();
    }
    addToBlackList(ip: string) {
        this.blacListedData.push(ip)
    }
    updateListData () {
        fs.writeFileSync(path.resolve(__dirname,'./data/blacklist.json'), JSON.stringify(this.blacListedData));
    }
    getListData () {


        try {
        const data = fs.readFileSync(path.resolve(__dirname,'./data/blacklist.json'));
        
        
        let jsonData = null;

        if(data) jsonData = JSON.parse(data as any);

        Loggers.game.info(`Loaded IP-BlackList within ${jsonData.length} blocked IPs`)

        this.blacListedData = jsonData;
        } catch(err) {
         fs.writeFileSync(path.resolve(__dirname,'./data/blacklist.json'), JSON.stringify([]));
         this.getListData()
        }
    }
    removeBlackList(ip: string) {
        const nList = this.blacListedData.filter((a: any) => a != ip);
////
        this.blacListedData = nList;
    }

    isBlackListed(ip: string) {
        return this.tempBlockList.includes(ip) || this.blacListedData.includes(ip);
    }
}