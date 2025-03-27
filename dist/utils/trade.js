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
exports.buy = exports.sell = void 0;
const pump_1 = require("./pump");
const user_1 = __importDefault(require("../model/user"));
const token_1 = __importDefault(require("../model/token"));
const sell = (mint, amount, telegramId) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield (0, pump_1.getTokenDetails)(mint);
    if (!tokenData)
        return { success: false, msg: "No token detail" };
    const liquidityPools = Object.values(tokenData.liquidityPools);
    let tokenPrice = liquidityPools[0].protocolData.price0;
    tokenPrice = !tokenPrice ? liquidityPools[1].protocolData.price1 : tokenPrice;
    const { name, symbol } = tokenData;
    let newSolBalance = 0;
    const user = yield user_1.default.findOne({ userId: telegramId });
    if (user) {
        const solBalance = user.solBalance;
        newSolBalance = solBalance + tokenPrice * amount;
        if (newSolBalance < 0)
            return { success: false, msg: "Insufficient Sol balance" };
    }
    else {
        return { success: false, msg: "No user" };
    }
    const token = yield token_1.default.findOne({ userId: telegramId, mint });
    if (token) {
        const tokenAmount = token.amount;
        const newTokenAmount = Number(tokenAmount) - Number(amount);
        const sold = token.sold + amount * tokenPrice;
        if (newTokenAmount < 0)
            return { success: false, msg: "Insufficient token" };
        try {
            yield token_1.default.updateOne({ userId: telegramId, mint }, { amount: newTokenAmount, sold });
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: "Token update error" };
        }
    }
    else {
        return { success: false, msg: "No token to sell" };
    }
    yield user_1.default.updateOne({ userId: telegramId }, { solBalance: newSolBalance });
    return { success: true };
});
exports.sell = sell;
const buy = (mint, amount, telegramId) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield (0, pump_1.getTokenDetails)(mint);
    if (!tokenData)
        return { success: false, msg: "No token detail" };
    const liquidityPools = Object.values(tokenData.liquidityPools);
    let tokenPrice = liquidityPools[0].protocolData.price0;
    tokenPrice = !tokenPrice ? liquidityPools[1].protocolData.price1 : tokenPrice;
    const { name, symbol } = tokenData;
    let newSolBalance = 0;
    const user = yield user_1.default.findOne({ userId: telegramId });
    if (user) {
        const solBalance = user.solBalance;
        newSolBalance = solBalance - amount;
        if (newSolBalance < 0)
            return { success: false, msg: "Insufficient Sol balance" };
    }
    else {
        return { success: false, msg: "No user" };
    }
    const solPrice = yield (0, pump_1.getSolPrice)();
    let invested = 0;
    const token = yield token_1.default.findOne({ userId: telegramId, mint });
    if (token) {
        const tokenAmount = token.amount;
        const newTokenAmount = Number(tokenAmount) + Number(amount) / Number(tokenPrice);
        invested = token.invested + amount * solPrice;
        try {
            yield token_1.default.updateOne({ userId: telegramId, mint }, { amount: newTokenAmount, invested });
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: "Token update error" };
        }
    }
    else {
        const newToken = new token_1.default({
            userId: telegramId,
            mint,
            name,
            symbol,
            amount: Number(amount) / Number(tokenPrice),
            invested
        });
        try {
            yield newToken.save();
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: "Saving token error" };
        }
    }
    yield user_1.default.updateOne({ userId: telegramId }, { solBalance: newSolBalance });
    return { success: true };
});
exports.buy = buy;
