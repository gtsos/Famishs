"use strict";
/*export class IdPool {
    public readonly pool: number[];
    private currentId: number;

    public constructor(startAt: number) {
        this.pool = [];
        this.currentId = startAt;
    }

    public nextId(): number {
        return this.currentId++;
       
    }

    public dispose(id: number) {
        //this.pool.push(id);
    }
}////////a*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdPool = void 0;
class IdPool {
    pool;
    id_list;
    currentId;
    constructor(startAt = 1) {
        this.pool = [];
        this.id_list = [];
        this.currentId = startAt;
    }
    nextId() {
        let id = this.pool.pop() ?? this.currentId++;
        if (this.id_list.includes(id)) {
            return this.nextId();
        }
        this.id_list.push(id);
        return id;
    }
    lookNextId() {
        return this.pool.length == 0 ? this.currentId + 1 : this.pool[this.pool.length - 1];
    }
    dispose(id) {
        this.pool.push(id);
        this.id_list = this.id_list.filter(_Id => _Id != id);
    }
}
exports.IdPool = IdPool;
//aa
