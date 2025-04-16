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
    const { mint, amount, id, isBuy } = req.body;
    let result;
    if (!isBuy) {
        result = yield (0, trade_1.sell)(mint, amount, id);
    }
    else {
        result = yield (0, trade_1.buy)(mint, amount, id);
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
    try {
        const { id } = req.body;
        const [user, tokens, trade, solPrice] = yield Promise.all([
            user_1.default.findOne({ id }).lean(),
            token_1.default.find({ id }).lean(),
            trade_2.default.find({ id }).lean(),
            (0, pump_1.getSolPrice)(), // Cached SOL price
        ]);
        if (!user) {
            res.status(404).json({ success: false, msg: "User not found" });
            return;
        }
        let solBalance = (_a = user.solBalance) !== null && _a !== void 0 ? _a : 0;
        let totalValue = solBalance * solPrice;
        const tokenList = [];
        if (tokens.length > 0) {
            const tokenDetails = yield Promise.all(tokens.map((token) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                try {
                    const tokenData = yield (0, pump_1.getTokenDetails)(token.mint);
                    const liquidityPools = Object.values(tokenData.liquidityPools);
                    const firstPool = liquidityPools[0]; // Ensure it’s an object
                    let tokenPriceSOL = (_b = (_a = firstPool === null || firstPool === void 0 ? void 0 : firstPool.protocolData) === null || _a === void 0 ? void 0 : _a.price0) !== null && _b !== void 0 ? _b : 0;
                    if (tokenPriceSOL > ((_d = (_c = firstPool === null || firstPool === void 0 ? void 0 : firstPool.protocolData) === null || _c === void 0 ? void 0 : _c.price1) !== null && _d !== void 0 ? _d : 0)) {
                        const tokenPriceUSD = yield (0, trade_1.priceFetchUSD)(token.mint);
                        if (tokenPriceUSD !== null && solPrice !== 0) {
                            tokenPriceSOL = tokenPriceUSD / solPrice;
                        }
                        else {
                            console.error(`Invalid token price: ${tokenPriceUSD}, SOL: ${solPrice}`);
                            return null;
                        }
                    }
                    let tokenPrice = tokenPriceSOL * solPrice;
                    if (!tokenPrice || isNaN(tokenPrice)) {
                        tokenPrice = (_e = (yield (0, trade_1.priceFetchUSD)(token.mint))) !== null && _e !== void 0 ? _e : 0;
                    }
                    totalValue += tokenPrice * token.amount;
                    return {
                        name: token.name,
                        symbol: token.symbol,
                        mint: token.mint,
                        amount: token.amount,
                        invested: token.invested,
                        sold: token.sold,
                        price: tokenPrice,
                    };
                }
                catch (error) {
                    console.error("Error fetching token details:", error);
                    return null; // Skip failed tokens
                }
            })));
            tokenList.push(...tokenDetails.filter(Boolean));
        }
        res.status(200).json({
            success: true,
            data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
        });
    }
    catch (error) {
        console.error("Error fetching wallet tokens:", error);
        res.status(500).json({ success: false, msg: "Server error" });
    }
}));
// export const walletTokens = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     const { prvKey } = req.body;
//     const user = await User.findOne({ prvKey: prvKey });
//     const tokens: TokenData[] = await Token.find({ prvKey: prvKey });
//     const trade: TradeData[] = await Trade.find({ prvKey: prvKey });
//     console.log("User: ", user)
//     console.log("Tokens: ", tokens)
//     console.log("Trade: ", trade)
//     const solBalance = user?.solBalance ?? 0; // Ensure solBalance is always a number
//     const solPrice = await getSolPrice(); // Fetch Solana price in USD
//     // console.log(solBalance,"sol bal")
//     // console.log(solPrice)
//     let totalValue = solBalance * solPrice; // Convert SOL balance to USD
//     const tokenList = [];
//     if(tokens.length>0){
//     for (const token of tokens) {
//       try {
//         const tokenData = await getTokenDetails(token.mint);
//         const liquidityPools: any = Object.values(tokenData.liquidityPools);
//         // Get token price in SOL
//         let tokenPriceSOL: number = liquidityPools[0].protocolData.price0;    
//         if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
//           let tokenPriceUSD: number | null = await priceFetchUSD(token.mint);
//           // console.log("Token Price USD:", tokenPriceUSD);
//           if (tokenPriceUSD !== null && solPrice !== 0) {
//             tokenPriceSOL = tokenPriceUSD / solPrice;
//           } else {
//             console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
//             res.status(500).json({ success: false, msg: "Error fetching token price" });
//             return;
//           }
//         }
//         // Convert token price to USD
//         let tokenPrice = tokenPriceSOL * solPrice;
//         // If tokenPrice is 0, fetch price in USD
//         if (!tokenPrice || Number.isNaN(tokenPrice)) {
//           const fetchedPrice = await priceFetchUSD(token.mint);
//           tokenPrice = fetchedPrice ?? 0; // Ensure it's a number
//         }
//         // Add token's USD value to totalValue
//         totalValue += tokenPrice * token.amount;
//         tokenList.push({
//           name: token.name,
//           symbol: token.symbol,
//           mint: token.mint,
//           amount: token.amount,
//           invested: token.invested,
//           sold: token.sold,
//           price: tokenPrice,
//         });
//       } catch (error) {
//         console.error("Error fetching token details:", error);
//       }
//     }
//   }
//     res.status(200).json({
//       success: true,
//       data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
//     });
//   }
// );
