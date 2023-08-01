"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Info"] = 0] = "Info";
    LogLevel[LogLevel["Warning"] = 1] = "Warning";
    LogLevel[LogLevel["Error"] = 2] = "Error";
    LogLevel[LogLevel["Fatal"] = 3] = "Fatal";
    LogLevel[LogLevel["Debug"] = 4] = "Debug";
    LogLevel[LogLevel["Verbose"] = 5] = "Verbose";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
