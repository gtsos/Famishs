export class IP {
    ip: string;
    connectionCount: number;
    connectionTimestamp: number;
    constructor(ip: any) {

        this.ip = ip;
        this.connectionCount = 0;
        this.connectionTimestamp = +new Date();
        

    }
}