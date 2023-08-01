"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Api_1 = __importDefault(require("./routes/Api"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json({
    limit: "6mb"
}));
app.use('/api', Api_1.default);
app.use(express_1.default.static(path_1.default.resolve(__dirname, '../../client/build')));
app.listen(3000); //sg
