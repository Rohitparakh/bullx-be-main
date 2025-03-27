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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletTokens = exports.trade = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = __importDefault(require("../model/user"));
const pump_1 = require("../utils/pump");
const trade_1 = require("../utils/trade");
const token_1 = __importDefault(require("../model/token"));
exports.trade = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mint, amount, telegramId, isBuy } = req.body;
    let result;
    if (!isBuy) {
        result = yield (0, trade_1.sell)(mint, amount, telegramId);
    }
    else {
        result = yield (0, trade_1.buy)(mint, amount, telegramId);
    }
    if (result.success) {
        res.status(200).json({ success: result.success });
    }
    else {
        res.status(500).json({ success: result.success, msg: result.msg });
    }
}));
exports.walletTokens = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { telegramId } = req.body;
    const user = yield user_1.default.findOne({ userId: telegramId });
    const tokens = yield token_1.default.find({ userId: telegramId });
    const solBalance = user === null || user === void 0 ? void 0 : user.solBalance;
    let totalValue = solBalance;
    const tokenList = [];
    for (const token of tokens) {
        try {
            const tokenData = yield (0, pump_1.getTokenDetails)(token.mint);
            const liquidityPools = Object.values(tokenData.liquidityPools);
            const price = liquidityPools[0].protocolData.price0;
            totalValue = totalValue
                ? totalValue + price * token.amount
                : price * token.amount;
            tokenList.push({
                name: token.name,
                symbol: token.symbol,
                mint: token.mint,
                amount: token.amount,
                invested: token.invested,
                sold: token.sold,
                price,
            });
        }
        catch (error) {
            console.error("Error fetching token details:", error);
        }
    }
    const solPrice = yield (0, pump_1.getSolPrice)();
    res.status(200).json({
        success: true,
        data: { solBalance, totalValue, solPrice, tokenList },
    });
}));
