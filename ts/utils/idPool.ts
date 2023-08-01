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

export class IdPool {
    public pool: number[];
    private id_list: number[];
    private currentId: number;

    public constructor (startAt: number = 1) {
        this.pool = [];
        this.id_list = [];
        this.currentId = startAt;
    }

    public nextId (): number {
        let id = this.pool.pop() ?? this.currentId++;

        if (this.id_list.includes(id)) {
            return this.nextId();
        }

        this.id_list.push(id);
        return id;
    }

    public lookNextId (): number {
        return this.pool.length == 0 ? this.currentId + 1 : this.pool[this.pool.length - 1];
    }

    public dispose (id: number) {
        this.pool.push(id);
        this.id_list = this.id_list.filter(_Id => _Id != id);
    }
}
//aa