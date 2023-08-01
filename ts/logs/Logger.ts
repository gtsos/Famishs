import XRegExp from 'xregexp';
import { LogLevel } from './loglevel';
import { blue } from 'colorette';
import { Theme } from './theme';
import * as util from 'util';

const regexp = XRegExp(/{\w+(:(?<modifiers>\w+))?}/g);
let logLevel = LogLevel.Verbose;

export class Logger {
    public readonly name: string;
    public constructor(name: string) {
        this.name = name;
    }

    public colorify(arg: any, modifiers: string[]) {
        if(typeof arg == 'undefined') arg = Theme.Undefined('undefined');
        if(typeof arg == 'string') arg = Theme.String(arg.toString());
        if(typeof arg == 'number') arg = Theme.Number(arg.toString());
        if(typeof arg == 'boolean') arg = arg ? Theme.True(arg.toString()) : Theme.False(arg.toString());
        if(typeof arg == 'object') {
            if(Array.isArray(arg)) {
                arg = arg.map(x => {
                    if(typeof x == 'string') x = `'` + x + `'`;
                    return this.colorify(x, []);
                });
                arg = '[ ' + arg.join(', ') + ' ]';
            } else arg = Theme.Object(
                util.inspect(arg, { depth: modifiers.includes('d') ? Infinity : 0 }));
        }

        if(arg == null) arg = Theme.Null('null')
        return arg;
    }

    private log(level: LogLevel, info: string, ...args: any[]) {
        if(level > logLevel) return;

        const logArgs = XRegExp.match(info, regexp)!;
        for(let i = 0; i < logArgs.length; i++) {
            const target = logArgs[i];
            let arg = args[i];

            const _modifiers = XRegExp.exec(info, regexp)!.groups!.modifiers ?? '';
            const modifiers = _modifiers.split('');

            info = info.replaceAll(target, this.colorify(arg, modifiers));
        }

        console.log(Theme.constructLog(this.name, level) + info);
    }

    public info(info: string, ...args: any[]) {
        this.log(LogLevel.Info, info, ...args);
    }

    public warn(info: string, ...args: any[]) {
        this.log(LogLevel.Warning, info, ...args);
    }

    public error(info: string, ...args: any[]) {
        this.log(LogLevel.Error, info, ...args);
    }

    public fatal(info: string, ...args: any[]) {
        this.log(LogLevel.Fatal, info, ...args);
    }

    public debug(info: string, ...args: any[]) {
        this.log(LogLevel.Debug, info, ...args);
    }

    public verbose(info: string, ...args: any[]) {
        this.log(LogLevel.Verbose, info, ...args);
    }
}

export function setLogLevel(level: LogLevel): void {
    logLevel = level;
}

const loggers: Record<string, Logger> = {};
export class LoggerFactory {
    public static createLogger(name: string): Logger {
        return loggers[name] ??= new Logger(name);
    }
}

export const Loggers = {
    app: LoggerFactory.createLogger('App'),
    game: LoggerFactory.createLogger("Game")
};