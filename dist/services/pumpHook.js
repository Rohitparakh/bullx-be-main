"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runListener = void 0;
const constants_1 = require("../config/constants");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
let globalLogListener = null;
const runListener = () => {
    const connection = new web3_js_1.Connection(config_1.RPC_ENDPOINT, "confirmed");
    try {
        globalLogListener = connection.onLogs(constants_1.PUMP_FUN_PROGRAM, async ({ logs, err, signature }) => {
            console.log(logs);
            const isTrade = logs.filter((log) => log.includes("Buy") || log.includes("Sell"));
            console.log("isTrade :>> ", isTrade);
            console.log(signature);
        }, "finalized");
    }
    catch (err) {
        console.log(err);
    }
};
exports.runListener = runListener;
