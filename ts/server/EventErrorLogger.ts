import { Loggers } from "../logs/Logger";

export enum EventErrors {
    PARAMS_PARSE_FAIL = "Famishs.EventLoop.constructParams.NullException",
    NODE_NOT_FOUND = "Famishs.EventLoop.readEventName.NullException"
}
//   Loggers.game.error(`Famishs.EventLoop.constructParrams.NullException:\n         Suspected Event: '{0}'\n         `, nodeName)
export function constructError (evtError: EventErrors, evtName: string, evtDescription: string, addictData: any = null) {
    Loggers.game.warn(`---------------------------`);
    Loggers.game.error(`${evtError}:\n         Suspected Event: '{0}'\n         Error Description: {1}${addictData ? "\n         Data: {2}" : ""}`, evtName, evtDescription, addictData)
    Loggers.game.warn(`---------------------------`);
}