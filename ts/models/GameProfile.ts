export enum Badges {
    Developer = 1 << 1,
    YouTuber = 1 << 2,
    Tester = 1 << 3
}

export class GameProfile {
    public name: string;
    public skin: number;
    public accessory: number;
    public book: number;
    public box: number;
    public baglook: number;
    public level: number;
    public badges: number;
    public deadBox: number;
    public score: number;
    public days: number;
    public surviveStart: number;
    public token: string;
    public token_id: string;
    public kills;
    public googleToken: string;

    public constructor(name: string,skin: number, accessory: number, box: number, baglook: number,
        level: number, badges: number, deadBox: number, days: number, score: number, book: number,
        surviveStart: number, token: string, token_id: string, google: any = 0) {
           // new GameProfile("unnamed", ~~(Math.random() * 155), ~~(Math.random() * 94), 0, 0, 0, 0, 0, 0, 0, 0, +new Date(), token, token_id);
        this.name = name;
        this.skin = 0;
        this.accessory = 0;
        this.box = 0;
        this.book = 0;
        this.baglook = 0;
        this.deadBox = 0;
        this.badges = badges;
        this.level = level;
        this.score = score; 
        this.days = days;
        this.surviveStart = surviveStart;
        this.token = token;
        this.token_id = token_id;

        this.kills = 0;
        this.googleToken = google;
    }
}