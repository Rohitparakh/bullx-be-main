"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToCreateToken = subscribeToCreateToken;
const ws_1 = __importDefault(require("ws"));
const config_1 = require("../config");
// import { pumpCurveData } from "../controller/pumpController";
const pump_1 = require("../utils/pump");
function subscribeToCreateToken() {
    const ws = new ws_1.default(config_1.PUMPPORTAL_WS_ENDPOINT);
    ws.on("open", () => {
        console.log("Connected to Pumpportal WebSocket");
        ws.send(JSON.stringify({ method: "subscribeNewToken" }));
    });
    ws.on("message", async (data) => {
        try {
            const parsedData = JSON.parse(data);
            if (parsedData.txType === "create") {
                const { mint, name, symbol, initialBuy, bondingCurveKey, vTokensInBondingCurve, vSolInBondingCurve, uri, } = parsedData;
                const coinData = {
                    mint,
                    name,
                    symbol,
                    uri: uri,
                    decimals: 6,
                    bonding_curve_key: bondingCurveKey,
                    created_at: new Date(),
                };
                setTimeout(() => {
                    (0, pump_1.saveNewPumpToken)(coinData);
                }, 1000);
            }
        }
        catch (error) {
            console.error("Error processing message from Pumpportal:", error);
        }
    });
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
    ws.on("close", () => {
        console.log("Disconnected from Pumpportal WebSocket");
    });
}
