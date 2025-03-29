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
exports.walletTokens = exports.trade = exports.priceFetchinUSD = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = __importDefault(require("../model/user"));
const pump_1 = require("../utils/pump");
const trade_1 = require("../utils/trade");
const token_1 = __importDefault(require("../model/token"));
const trade_2 = __importDefault(require("../model/trade"));
exports.priceFetchinUSD = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // const { mint, amount, prvKey, isBuy } = req.body;
    const { mint } = req.params;
    let result;
    let priceUSD = yield (0, trade_1.priceFetchUSD)(mint);
    // console.log("prrr ", priceUSD)
    if (Number(priceUSD) > 0) {
        res.status(200).json({ success: true, data: { price: priceUSD } });
    }
    else {
        res.status(500).json({ success: false, msg: "Error Fetching Price" });
    }
}));
exports.trade = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mint, amount, prvKey, isBuy } = req.body;
    let result;
    if (!isBuy) {
        result = yield (0, trade_1.sell)(mint, amount, prvKey);
    }
    else {
        result = yield (0, trade_1.buy)(mint, amount, prvKey);
    }
    if (result.success) {
        res.status(200).json({ success: result.success });
    }
    else {
        res.status(500).json({ success: result.success, msg: result.msg });
    }
}));
exports.walletTokens = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { prvKey } = req.body;
    const user = yield user_1.default.findOne({ prvKey: prvKey });
    const tokens = yield token_1.default.find({ prvKey: prvKey });
    const trade = yield trade_2.default.find({ prvKey: prvKey });
    console.log("User: ", user);
    console.log("Tokens: ", tokens);
    console.log("Trade: ", trade);
    const solBalance = (_a = user === null || user === void 0 ? void 0 : user.solBalance) !== null && _a !== void 0 ? _a : 0; // Ensure solBalance is always a number
    const solPrice = yield (0, pump_1.getSolPrice)(); // Fetch Solana price in USD
    // console.log(solBalance,"sol bal")
    // console.log(solPrice)
    let totalValue = solBalance * solPrice; // Convert SOL balance to USD
    const tokenList = [];
    if (tokens.length > 0) {
        for (const token of tokens) {
            try {
                const tokenData = yield (0, pump_1.getTokenDetails)(token.mint);
                const liquidityPools = Object.values(tokenData.liquidityPools);
                // Get token price in SOL
                let tokenPriceSOL = liquidityPools[0].protocolData.price0;
                if (tokenPriceSOL > liquidityPools[0].protocolData.price1) {
                    let tokenPriceUSD = yield (0, trade_1.priceFetchUSD)(token.mint);
                    // console.log("Token Price USD:", tokenPriceUSD);
                    if (tokenPriceUSD !== null && solPrice !== 0) {
                        tokenPriceSOL = tokenPriceUSD / solPrice;
                    }
                    else {
                        console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
                        res.status(500).json({ success: false, msg: "Error fetching token price" });
                        return;
                    }
                }
                // Convert token price to USD
                let tokenPrice = tokenPriceSOL * solPrice;
                // If tokenPrice is 0, fetch price in USD
                if (!tokenPrice || Number.isNaN(tokenPrice)) {
                    const fetchedPrice = yield (0, trade_1.priceFetchUSD)(token.mint);
                    tokenPrice = fetchedPrice !== null && fetchedPrice !== void 0 ? fetchedPrice : 0; // Ensure it's a number
                }
                // Add token's USD value to totalValue
                totalValue += tokenPrice * token.amount;
                tokenList.push({
                    name: token.name,
                    symbol: token.symbol,
                    mint: token.mint,
                    amount: token.amount,
                    invested: token.invested,
                    sold: token.sold,
                    price: tokenPrice,
                });
            }
            catch (error) {
                console.error("Error fetching token details:", error);
            }
        }
    }
    res.status(200).json({
        success: true,
        data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
    });
}));
