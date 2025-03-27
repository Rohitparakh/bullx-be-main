"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runListener = void 0;
const constants_1 = require("../config/constants");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
let globalLogListener = null;
const runListener = () => {
    const connection = new web3_js_1.Connection(config_1.RPC_ENDPOINT, "confirmed");
    try {
        globalLogListener = connection.onLogs(constants_1.PUMP_FUN_PROGRAM, (_a) => __awaiter(void 0, [_a], void 0, function* ({ logs, err, signature }) {
            console.log(logs);
            const isTrade = logs.filter((log) => log.includes("Buy") || log.includes("Sell"));
            console.log("isTrade :>> ", isTrade);
            console.log(signature);
        }), "finalized");
    }
    catch (err) {
        console.log(err);
    }
};
exports.runListener = runListener;
