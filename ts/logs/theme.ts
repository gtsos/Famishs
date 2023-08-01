import {
    blueBright,
    Color,
    cyanBright,
    greenBright, magenta,
    magentaBright,
    redBright,
    whiteBright,
    yellowBright
} from 'colorette';
import { LogLevel } from './loglevel';
import { DateTime } from 'luxon';

export class Theme {
    public static Null: Color = redBright;
    public static Undefined: Color = redBright;

    public static Object: Color = yellowBright;
    public static String: Color = yellowBright;
    public static Number: Color = blueBright;
    public static True: Color = greenBright;
    public static False: Color = redBright;

    public static constructLog(name: string, level: LogLevel): string {
        let levelColor = whiteBright;
        switch(level) {
            case LogLevel.Info: levelColor = blueBright; break;
            case LogLevel.Warning: levelColor = yellowBright; break;
            case LogLevel.Error: levelColor = redBright; break;
            case LogLevel.Fatal: levelColor = magentaBright; break;
            case LogLevel.Debug: levelColor = blueBright; break;
            case LogLevel.Verbose: levelColor = cyanBright; break;
        }

        return `[${DateTime.now().toFormat('HH:mm:ss')}] [${blueBright(name)}] [${levelColor(LogLevel[level])}]: `;
    }
}