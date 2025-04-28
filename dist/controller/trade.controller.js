"use strict";
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
const p_limit_1 = __importDefault(require("p-limit"));
exports.priceFetchinUSD = (0, express_async_handler_1.default)(async (req, res) => {
    // const { mint, amount, prvKey, isBuy } = req.body;
    const { mint } = req.params;
    let result;
    let priceUSD = await (0, trade_1.priceFetchUSD)(mint);
    // console.log("prrr ", priceUSD)
    if (Number(priceUSD) > 0) {
        res.status(200).json({ success: true, data: { price: priceUSD } });
    }
    else {
        res.status(500).json({ success: false, msg: "Error Fetching Price" });
    }
});
exports.trade = (0, express_async_handler_1.default)(async (req, res) => {
    const { mint, amount, id, isBuy } = req.body;
    let result;
    if (!isBuy) {
        result = await (0, trade_1.sell)(mint, amount, id);
    }
    else {
        result = await (0, trade_1.buy)(mint, amount, id);
    }
    if (result.success) {
        res.status(200).json({ success: result.success });
    }
    else {
        res.status(500).json({ success: result.success, msg: result.msg });
    }
});
// === In-Memory Caches ===
const tokenDetailCache = new Map();
const priceCache = new Map();
const solPriceCache = new Map();
// === Cached Wrappers ===
async function getTokenDetailsCached(mint) {
    if (tokenDetailCache.has(mint))
        return tokenDetailCache.get(mint);
    const data = await (0, pump_1.getTokenDetails)(mint);
    tokenDetailCache.set(mint, data);
    return data;
}
async function priceFetchUSDCached(mint) {
    if (priceCache.has(mint))
        return priceCache.get(mint);
    const price = await (0, trade_1.priceFetchUSD)(mint) || 0;
    priceCache.set(mint, price);
    return price;
}
async function getSolPriceCached() {
    if (solPriceCache.has('sol'))
        return solPriceCache.get('sol');
    const price = await (0, pump_1.getSolPrice)();
    solPriceCache.set('sol', price);
    return price;
}
exports.walletTokens = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        console.time('walletTokens');
        const { id } = req.body;
        const [user, tokens, trade, solPrice] = await Promise.all([
            user_1.default.findOne({ id }).lean(),
            token_1.default.find({ id }).lean(),
            trade_2.default.find({ id }).lean(),
            getSolPriceCached(),
        ]);
        if (!user) {
            res.status(404).json({ success: false, msg: 'User not found' });
            return;
        }
        let solBalance = user.solBalance ?? 0;
        let totalValue = solPrice ? solBalance * solPrice : 0;
        const tokenList = [];
        if (tokens.length > 0) {
            const mintSet = new Set(tokens.map((t) => t.mint));
            const mintArray = Array.from(mintSet);
            const limit = (0, p_limit_1.default)(7); // Increase concurrency to 7 safely
            console.time('fetchTokenDataAndPrices');
            // fetch both tokenDetails and USD prices together
            const mintData = await Promise.all(mintArray.map((mint) => limit(async () => {
                const [details, usdPrice] = await Promise.all([
                    getTokenDetailsCached(mint),
                    priceFetchUSDCached(mint),
                ]);
                return { mint, details, usdPrice };
            })));
            const detailsByMint = Object.fromEntries(mintData.map(d => [d.mint, d.details]));
            const usdPriceByMint = Object.fromEntries(mintData.map(d => [d.mint, d.usdPrice]));
            console.timeEnd('fetchTokenDataAndPrices');
            console.time('processTokens');
            for (const token of tokens) {
                const tokenData = detailsByMint[token.mint];
                if (!tokenData)
                    continue;
                const pools = Object.values(tokenData.liquidityPools || {});
                const firstPool = pools[0];
                let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
                const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;
                if (tokenPriceSOL > altPriceSOL) {
                    const tokenPriceUSD = usdPriceByMint[token.mint];
                    if (tokenPriceUSD !== null && solPrice && solPrice >= 0) {
                        tokenPriceSOL = tokenPriceUSD / solPrice;
                    }
                    else {
                        continue; // Skip invalid token
                    }
                }
                let tokenPrice = solPrice ? tokenPriceSOL * solPrice : 0;
                if (!tokenPrice || isNaN(tokenPrice)) {
                    tokenPrice = usdPriceByMint[token.mint] ?? 0;
                }
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
            console.timeEnd('processTokens');
        }
        console.timeEnd('walletTokens');
        res.status(200).json({
            success: true,
            data: {
                solBalance,
                totalValue,
                solPrice,
                tokenList,
                tradeHistory: trade,
            },
        });
    }
    catch (error) {
        console.error('Error fetching wallet tokens:', error);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});
// export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
//   try {
//     console.time('walletTokens');
//     const { id } = req.body;
//     const [user, tokens, trade, solPrice] = await Promise.all([
//       User.findOne({ id }).lean(),
//       Token.find({ id }).lean(),
//       Trade.find({ id }).lean(),
//       getSolPriceCached(),
//     ]);
//     if (!user) {
//       res.status(404).json({ success: false, msg: 'User not found' });
//       return;
//     }
//     let solBalance = user.solBalance ?? 0;
//     let totalValue = 0;
//     if(solPrice){totalValue = solBalance * solPrice;}
//     const tokenList = [];
//     const mintSet = new Set(tokens.map((t:any) => t.mint));
//     const mintArray = Array.from(mintSet);
//     const limit = pLimit(5); // max 5 concurrent calls
//     // Fetch Token Details and Prices with caching + throttling
//     console.time('getTokenDetails+Prices');
//     const [tokenDetailsMap, usdPricesMap] = await Promise.all([
//       Promise.all(
//         mintArray.map((mint:any) =>
//           limit(async () => {
//             try {
//               const data = await getTokenDetailsCached(mint);
//               return { mint, data };
//             } catch {
//               return { mint, data: null };
//             }
//           })
//         )
//       ),
//       Promise.all(
//         mintArray.map((mint:any) =>
//           limit(async () => {
//             try {
//               const price = await priceFetchUSDCached(mint);
//               return { mint, price };
//             } catch {
//               return { mint, price: null };
//             }
//           })
//         )
//       ),
//     ]);
//     console.timeEnd('getTokenDetails+Prices');
//     const detailsByMint = Object.fromEntries(tokenDetailsMap.map((d) => [d.mint, d.data]));
//     const usdPriceByMint = Object.fromEntries(usdPricesMap.map((p) => [p.mint, p.price]));
//     // Process token data
//     console.time('processTokens');
//     const processedTokens = await Promise.all(
//       tokens.map(async (token:any) => {
//         const tokenData = detailsByMint[token.mint];
//         if (!tokenData) return null;
//         const pools = Object.values(tokenData.liquidityPools || {});
//         const firstPool = pools[0] as any;
//         let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
//         const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;
//         if (tokenPriceSOL > altPriceSOL) {
//           const tokenPriceUSD = usdPriceByMint[token.mint];
//           if (tokenPriceUSD !== null && solPrice && solPrice>= 0) {
//             tokenPriceSOL = tokenPriceUSD / solPrice;
//           } else {
//             return null;
//           }
//         }
//         let tokenPrice=0;
//         if(solPrice)tokenPrice = tokenPriceSOL * solPrice;
//         if (!tokenPrice || isNaN(tokenPrice)) {
//           tokenPrice = usdPriceByMint[token.mint] ?? 0;
//         }
//         totalValue += tokenPrice * token.amount;
//         return {
//           name: token.name,
//           symbol: token.symbol,
//           mint: token.mint,
//           amount: token.amount,
//           invested: token.invested,
//           sold: token.sold,
//           price: tokenPrice,
//         };
//       })
//     );
//     console.timeEnd('processTokens');
//     tokenList.push(...processedTokens.filter(Boolean));
//     console.timeEnd('walletTokens');
//     res.status(200).json({
//       success: true,
//       data: {
//         solBalance,
//         totalValue,
//         solPrice,
//         tokenList,
//         tradeHistory: trade,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching wallet tokens:', error);
//     res.status(500).json({ success: false, msg: 'Server error' });
//   }
// });
// export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.body;
//     const [user, tokens, trade, solPrice] = await Promise.all([
//       User.findOne({ id }).lean(),
//       Token.find({ id }).lean(),
//       Trade.find({ id }).lean(),
//       getSolPrice(), // Should be cached
//     ]);
//     if (!user) {
//       res.status(404).json({ success: false, msg: "User not found" });
//       return;
//     }
//     let solBalance = user.solBalance ?? 0;
//     let totalValue = solBalance * solPrice;
//     const tokenList = [];
//     // === Cache Results for getTokenDetails & priceFetchUSD ===
//     const mintSet = new Set(tokens.map(t => t.mint));
//     const mintArray = Array.from(mintSet);
//     const [tokenDetailsMap, usdPricesMap] = await Promise.all([
//       Promise.all(mintArray.map(async (mint) => {
//         try {
//           const data = await getTokenDetails(mint);
//           return { mint, data };
//         } catch {
//           return { mint, data: null };
//         }
//       })),
//       Promise.all(mintArray.map(async (mint) => {
//         try {
//           const price = await priceFetchUSD(mint);
//           return { mint, price };
//         } catch {
//           return { mint, price: null };
//         }
//       }))
//     ]);
//     const detailsByMint = Object.fromEntries(tokenDetailsMap.map(d => [d.mint, d.data]));
//     const usdPriceByMint = Object.fromEntries(usdPricesMap.map(p => [p.mint, p.price]));
//     // === Process Tokens in Parallel ===
//     const processedTokens = await Promise.all(
//       tokens.map(async (token) => {
//         const tokenData = detailsByMint[token.mint];
//         if (!tokenData) return null;
//         const pools = Object.values(tokenData.liquidityPools || {});
//         const firstPool = pools[0] as any;
//         let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
//         const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;
//         if (tokenPriceSOL > altPriceSOL) {
//           const tokenPriceUSD = usdPriceByMint[token.mint];
//           if (tokenPriceUSD !== null && solPrice !== 0) {
//             tokenPriceSOL = tokenPriceUSD / solPrice;
//           } else {
//             return null;
//           }
//         }
//         let tokenPrice = tokenPriceSOL * solPrice;
//         if (!tokenPrice || isNaN(tokenPrice)) {
//           tokenPrice = usdPriceByMint[token.mint] ?? 0;
//         }
//         totalValue += tokenPrice * token.amount;
//         return {
//           name: token.name,
//           symbol: token.symbol,
//           mint: token.mint,
//           amount: token.amount,
//           invested: token.invested,
//           sold: token.sold,
//           price: tokenPrice,
//         };
//       })
//     );
//     tokenList.push(...processedTokens.filter(Boolean));
//     res.status(200).json({
//       success: true,
//       data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
//     });
//   } catch (error) {
//     console.error("Error fetching wallet tokens:", error);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// });
