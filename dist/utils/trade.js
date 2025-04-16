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
exports.buy = exports.priceFetchUSD = exports.sell = void 0;
const pump_1 = require("./pump");
const user_1 = __importDefault(require("../model/user"));
const token_1 = __importDefault(require("../model/token"));
const trade_1 = __importDefault(require("../model/trade"));
const sell = (mint, amount, id) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield (0, pump_1.getTokenDetails)(mint);
    if (!tokenData)
        return { success: false, msg: "No token detail" };
    const liquidityPools = Object.values(tokenData.liquidityPools);
    let tokenPriceSOL = liquidityPools[0].protocolData.price0;
    // tokenPriceSOL = !tokenPriceSOL ? liquidityPools[1].protocolData.price1 : tokenPriceSOL;
    const solPrice = yield (0, pump_1.getSolPrice)();
    if (tokenPriceSOL > liquidityPools[0].protocolData.price1) {
        let tokenPriceUSD = yield (0, exports.priceFetchUSD)(mint);
        // console.log("Token Price USD:", tokenPriceUSD);
        if (tokenPriceUSD !== null && solPrice !== 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
        }
        else {
            console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
            return { success: false, msg: "Error fetching token price" };
        }
    }
    const tokenPrice = tokenPriceSOL * solPrice;
    const { name, symbol } = tokenData;
    let newSolBalance = 0;
    const user = yield user_1.default.findOne({ id: id });
    if (user) {
        const solBalance = user.solBalance;
        newSolBalance = solBalance + tokenPriceSOL * amount;
        if (newSolBalance < 0)
            return { success: false, msg: "Insufficient Sol balance" };
    }
    else {
        return { success: false, msg: "No user" };
    }
    const token = yield token_1.default.findOne({ id: id, mint });
    if (token) {
        const tokenAmount = token.amount;
        const newTokenAmount = Number(tokenAmount) - Number(amount);
        const sold = token.sold + amount * tokenPrice;
        if (newTokenAmount < 0)
            return { success: false, msg: "Insufficient token" };
        try {
            yield token_1.default.updateOne({ id: id, mint }, { amount: newTokenAmount, sold });
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: "Token update error" };
        }
    }
    else {
        return { success: false, msg: "No token to sell" };
    }
    const newTrade = new trade_1.default({
        id: id,
        mint,
        name,
        symbol,
        priceSol: Number(amount) * Number(tokenPriceSOL),
        priceUsd: Number(amount) * Number(tokenPriceSOL) * solPrice,
        amount: amount,
        tradeType: "SELL"
    });
    try {
        yield newTrade.save();
    }
    catch (error) {
        console.log(error);
        return { success: false, msg: `Saving trade error: ${error}` };
    }
    yield user_1.default.updateOne({ id: id }, { solBalance: newSolBalance });
    return { success: true };
});
exports.sell = sell;
const priceFetchUSD = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const requestOptions = {
        method: "get",
        headers: {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MjM2Nzk3MDgxOTgsImVtYWlsIjoiZHJlYW15dGdib3RAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzIzNjc5NzA4fQ.qEG3q2DSX_i60f8eNhAZ_XEQgmbRHZmQPgY4_7RhZQU"
        }
    };
    // console.log("Fetching price for mint:", address);
    try {
        const response = yield fetch(`https://pro-api.solscan.io/v2.0/token/price?address=${address}`, requestOptions);
        const jsonResponse = yield response.json();
        if (jsonResponse.success && jsonResponse.data.length > 0) {
            const price = jsonResponse.data[jsonResponse.data.length - 1].price;
            // console.log("Token Price USD:", price);
            return price;
        }
        else {
            console.error("Invalid API response format or no price data:", jsonResponse);
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching token price:", error);
        return null;
    }
});
exports.priceFetchUSD = priceFetchUSD;
const buy = (mint, amount, id) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield (0, pump_1.getTokenDetails)(mint);
    if (!tokenData)
        return { success: false, msg: "No token detail" };
    const liquidityPools = Object.values(tokenData.liquidityPools);
    // console.log("Token Data:", liquidityPools[0].protocolData);
    let tokenPriceSOL;
    let solPrice = yield (0, pump_1.getSolPrice)(), tokenPrice;
    // if(liquidityPools[0].protocolData.price0 > liquidityPools[0].protocolData.price1){
    // tokenPriceSOL = liquidityPools[0].protocolData.price0 / 1000000000;
    // tokenPrice = tokenPriceSOL;
    // } else{
    tokenPriceSOL = liquidityPools[0].protocolData.price0;
    tokenPrice = tokenPriceSOL * solPrice;
    // }
    // tokenPriceSOL = !tokenPriceSOL ? liquidityPools[1].protocolData.price1 : tokenPriceSOL;
    console.log("tokenPriceSOL", tokenPriceSOL);
    console.log("solPrice", solPrice);
    console.log("tokenPrice", tokenPrice);
    const { name, symbol } = tokenData;
    let newSolBalance = 0;
    const user = yield user_1.default.findOne({ id: id });
    if (user) {
        const solBalance = user.solBalance;
        newSolBalance = solBalance - amount;
        if (newSolBalance < 0)
            return { success: false, msg: "Insufficient Sol balance" };
    }
    else {
        return { success: false, msg: "No user" };
    }
    let invested = amount * solPrice;
    const token = yield token_1.default.findOne({ id: id, mint });
    if (token) {
        const tokenAmount = token.amount;
        if (tokenPriceSOL > liquidityPools[0].protocolData.price1 || Number.isNaN(tokenPriceSOL)) {
            let tokenPriceUSD = yield (0, exports.priceFetchUSD)(mint);
            // console.log("Token Price USD:", tokenPriceUSD);
            if (tokenPriceUSD !== null && solPrice !== 0) {
                tokenPriceSOL = tokenPriceUSD / solPrice;
            }
            else {
                console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
                return { success: false, msg: "Error fetching token price" };
            }
        }
        console.log("Num", amount);
        console.log("TPSOL", tokenPriceSOL);
        const newTokenAmount = Number(tokenAmount) + Number(amount) / Number(tokenPriceSOL);
        invested += token.invested;
        try {
            yield token_1.default.updateOne({ id: id, mint }, { amount: newTokenAmount, invested });
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: `Token update error ${error}` };
        }
    }
    else {
        console.log(invested, "invested");
        console.log(tokenPriceSOL, "tokenPriceSOL");
        console.log(Number.isNaN(tokenPriceSOL));
        // if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
        let tokenPriceUSD = yield (0, exports.priceFetchUSD)(mint);
        // console.log("Token Price USD:", tokenPriceUSD);
        if (tokenPriceUSD !== null && solPrice !== 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
        }
        else {
            console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
            return { success: false, msg: "Error fetching token price" };
        }
        console.log("solPrice USD", solPrice);
        console.log("TokenUSD Price before creating token", tokenPriceUSD);
        // }
        console.log("TokenSOL Price before creating token", tokenPriceSOL);
        const newToken = new token_1.default({
            id: id,
            mint,
            name,
            symbol,
            amount: Number(amount) / Number(tokenPriceSOL),
            invested,
            sold: 0
        });
        try {
            yield newToken.save();
        }
        catch (error) {
            console.log(error);
            return { success: false, msg: `Saving token error: ${amount} ${error}` };
        }
    }
    if (tokenPriceSOL > liquidityPools[0].protocolData.price1) {
        let tokenPriceUSD = yield (0, exports.priceFetchUSD)(mint);
        // console.log("Token Price USD:", tokenPriceUSD);
        if (tokenPriceUSD !== null && solPrice !== 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
        }
        else {
            console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
            return { success: false, msg: "Error fetching token price" };
        }
    }
    const newTrade = new trade_1.default({
        id: id,
        mint,
        name,
        symbol,
        priceSol: amount,
        priceUsd: amount * solPrice,
        amount: Number(amount) / Number(tokenPriceSOL),
        tradeType: "BUY"
    });
    try {
        yield newTrade.save();
    }
    catch (error) {
        console.log(error);
        return { success: false, msg: `Saving trade error: ${error}` };
    }
    yield user_1.default.updateOne({ id: id }, { solBalance: newSolBalance });
    return { success: true };
});
exports.buy = buy;
