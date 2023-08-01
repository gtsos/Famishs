"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Theme = void 0;
const colorette_1 = require("colorette");
const loglevel_1 = require("./loglevel");
const luxon_1 = require("luxon");
class Theme {
    static Null = colorette_1.redBright;
    static Undefined = colorette_1.redBright;
    static Object = colorette_1.yellowBright;
    static String = colorette_1.yellowBright;
    static Number = colorette_1.blueBright;
    static True = colorette_1.greenBright;
    static False = colorette_1.redBright;
    static constructLog(name, level) {
        let levelColor = colorette_1.whiteBright;
        switch (level) {
            case loglevel_1.LogLevel.Info:
                levelColor = colorette_1.blueBright;
                break;
            case loglevel_1.LogLevel.Warning:
                levelColor = colorette_1.yellowBright;
                break;
            case loglevel_1.LogLevel.Error:
                levelColor = colorette_1.redBright;
                break;
            case loglevel_1.LogLevel.Fatal:
                levelColor = colorette_1.magentaBright;
                break;
            case loglevel_1.LogLevel.Debug:
                levelColor = colorette_1.blueBright;
                break;
            case loglevel_1.LogLevel.Verbose:
                levelColor = colorette_1.cyanBright;
                break;
        }
        return `[${luxon_1.DateTime.now().toFormat('HH:mm:ss')}] [${(0, colorette_1.blueBright)(name)}] [${levelColor(loglevel_1.LogLevel[level])}]: `;
    }
}
exports.Theme = Theme;
