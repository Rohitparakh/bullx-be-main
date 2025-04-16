"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TradeSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    mint: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    amount: { type: Number, required: true },
    priceSol: { type: Number, required: true },
    priceUsd: { type: Number, required: true },
    tradeType: { type: String, enum: ["BUY", "SELL"], required: true },
    tradeDate: { type: Date, default: Date.now },
});
const Trade = (0, mongoose_1.model)("Trade", TradeSchema);
exports.default = Trade;
