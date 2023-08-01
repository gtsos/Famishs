"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IP = void 0;
class IP {
    ip;
    connectionCount;
    connectionTimestamp;
    constructor(ip) {
        this.ip = ip;
        this.connectionCount = 0;
        this.connectionTimestamp = +new Date();
    }
}
exports.IP = IP;
