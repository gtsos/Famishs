"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameProfile = exports.Badges = void 0;
var Badges;
(function (Badges) {
    Badges[Badges["Developer"] = 2] = "Developer";
    Badges[Badges["YouTuber"] = 4] = "YouTuber";
    Badges[Badges["Tester"] = 8] = "Tester";
})(Badges = exports.Badges || (exports.Badges = {}));
class GameProfile {
    name;
    skin;
    accessory;
    book;
    box;
    baglook;
    level;
    badges;
    deadBox;
    score;
    days;
    surviveStart;
    token;
    token_id;
    kills;
    googleToken;
    constructor(name, skin, accessory, box, baglook, level, badges, deadBox, days, score, book, surviveStart, token, token_id, google = 0) {
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
exports.GameProfile = GameProfile;
