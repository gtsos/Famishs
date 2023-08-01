"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loggers = exports.LoggerFactory = exports.setLogLevel = exports.Logger = void 0;
const xregexp_1 = __importDefault(require("xregexp"));
const loglevel_1 = require("./loglevel");
const theme_1 = require("./theme");
const util = __importStar(require("util"));
const regexp = (0, xregexp_1.default)(/{\w+(:(?<modifiers>\w+))?}/g);
let logLevel = loglevel_1.LogLevel.Verbose;
class Logger {
    name;
    constructor(name) {
        this.name = name;
    }
    colorify(arg, modifiers) {
        if (typeof arg == 'undefined')
            arg = theme_1.Theme.Undefined('undefined');
        if (typeof arg == 'string')
            arg = theme_1.Theme.String(arg.toString());
        if (typeof arg == 'number')
            arg = theme_1.Theme.Number(arg.toString());
        if (typeof arg == 'boolean')
            arg = arg ? theme_1.Theme.True(arg.toString()) : theme_1.Theme.False(arg.toString());
        if (typeof arg == 'object') {
            if (Array.isArray(arg)) {
                arg = arg.map(x => {
                    if (typeof x == 'string')
                        x = `'` + x + `'`;
                    return this.colorify(x, []);
                });
                arg = '[ ' + arg.join(', ') + ' ]';
            }
            else
                arg = theme_1.Theme.Object(util.inspect(arg, { depth: modifiers.includes('d') ? Infinity : 0 }));
        }
        if (arg == null)
            arg = theme_1.Theme.Null('null');
        return arg;
    }
    log(level, info, ...args) {
        if (level > logLevel)
            return;
        const logArgs = xregexp_1.default.match(info, regexp);
        for (let i = 0; i < logArgs.length; i++) {
            const target = logArgs[i];
            let arg = args[i];
            const _modifiers = xregexp_1.default.exec(info, regexp).groups.modifiers ?? '';
            const modifiers = _modifiers.split('');
            info = info.replaceAll(target, this.colorify(arg, modifiers));
        }
        console.log(theme_1.Theme.constructLog(this.name, level) + info);
    }
    info(info, ...args) {
        this.log(loglevel_1.LogLevel.Info, info, ...args);
    }
    warn(info, ...args) {
        this.log(loglevel_1.LogLevel.Warning, info, ...args);
    }
    error(info, ...args) {
        this.log(loglevel_1.LogLevel.Error, info, ...args);
    }
    fatal(info, ...args) {
        this.log(loglevel_1.LogLevel.Fatal, info, ...args);
    }
    debug(info, ...args) {
        this.log(loglevel_1.LogLevel.Debug, info, ...args);
    }
    verbose(info, ...args) {
        this.log(loglevel_1.LogLevel.Verbose, info, ...args);
    }
}
exports.Logger = Logger;
function setLogLevel(level) {
    logLevel = level;
}
exports.setLogLevel = setLogLevel;
const loggers = {};
class LoggerFactory {
    static createLogger(name) {
        return loggers[name] ??= new Logger(name);
    }
}
exports.LoggerFactory = LoggerFactory;
exports.Loggers = {
    app: LoggerFactory.createLogger('App'),
    game: LoggerFactory.createLogger("Game")
};
