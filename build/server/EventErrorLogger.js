"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructError = exports.EventErrors = void 0;
const Logger_1 = require("../logs/Logger");
var EventErrors;
(function (EventErrors) {
    EventErrors["PARAMS_PARSE_FAIL"] = "Famishs.EventLoop.constructParams.NullException";
    EventErrors["NODE_NOT_FOUND"] = "Famishs.EventLoop.readEventName.NullException";
})(EventErrors = exports.EventErrors || (exports.EventErrors = {}));
//   Loggers.game.error(`Famishs.EventLoop.constructParrams.NullException:\n         Suspected Event: '{0}'\n         `, nodeName)
function constructError(evtError, evtName, evtDescription, addictData = null) {
    Logger_1.Loggers.game.warn(`---------------------------`);
    Logger_1.Loggers.game.error(`${evtError}:\n         Suspected Event: '{0}'\n         Error Description: {1}${addictData ? "\n         Data: {2}" : ""}`, evtName, evtDescription, addictData);
    Logger_1.Loggers.game.warn(`---------------------------`);
}
exports.constructError = constructError;
