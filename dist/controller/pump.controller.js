"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendingTokens = exports.getTokenImage = exports.getPumpVision = exports.getTokenDetails = exports.getTokenList = exports.getNewTokenList = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const graphql_1 = require("../utils/graphql");
const pump_1 = require("../utils/pump");
const solana_1 = require("../utils/solana");
const newPumpTokens_1 = __importDefault(require("../model/pump/newPumpTokens"));
exports.getNewTokenList = (0, express_async_handler_1.default)(async (req, res) => {
    const tokens = await newPumpTokens_1.default.find({}).limit(100);
    res.status(200).json({ status: true, tokens });
});
exports.getTokenList = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        let { newToken, status } = req.query;
        newToken = Boolean(newToken);
        let data = await (0, graphql_1.bullxGraphql)("tokens", "", {
            ...req.query,
            volume: {
                min: Number(req.query.volumeMin),
                max: Number(req.query.volumeMax),
            },
            liquidity: {
                min: Number(req.query.liquidityMin),
                max: Number(req.query.liquidityMax),
            },
            marketcap: {
                min: Number(req.query.marketcapMin),
                max: Number(req.query.marketcapMax),
            },
            txns: {
                min: Number(req.query.txnsMin),
                max: Number(req.query.txnsMax),
            },
            buys: {
                min: Number(req.query.buysMin),
                max: Number(req.query.buysMax),
            },
            sells: {
                min: Number(req.query.sellsMin),
                max: Number(req.query.sellsMax),
            },
        });
        let newTokens = [...data.data], tokens = [];
        if (newToken) {
            const now = Math.floor(new Date().getTime() / 1000);
            for (let i = 0; i < newTokens.length; i++) {
                const oneDay = 24 * 3600;
                if (newTokens[i].creationTimestamp + oneDay < now)
                    continue;
                const tokenInfo = await (0, graphql_1.bullxGraphql)("tokeninfo", newTokens[i].address);
                newTokens[i].tokenInfo = tokenInfo.data[newTokens[i].address];
                tokens.push(newTokens[i]);
            }
        }
        else {
            for (let i = 0; i < newTokens.length; i++) {
                const tokenInfo = await (0, graphql_1.bullxGraphql)("tokeninfo", newTokens[i].address);
                const liquidity = await (0, graphql_1.bullxGraphql)("liquidity", tokenInfo.name);
                newTokens[i].tokenInfo = tokenInfo.data[newTokens[i].address].logo;
            }
            tokens = newTokens;
            console.log("here");
        }
        res.status(200).json({ success: true, tokens });
    }
    catch (error) {
        res.status(500).json({ success: false, tokens: [] });
    }
});
// Original 
// export const getTokenDetails = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     // console.log("Fetching token detail")
//     const { mintAddress } = req.query;
//     try {
//       const newAddress = await getPairAddress(mintAddress as string);
//       const bondingCurveAddress = newAddress.toString();
//       const bondingCurveData: any = await getPumpCurveState(
//         bondingCurveAddress        
//       );
//       let holders = await bullxGraphql("holders", mintAddress as string);
//       const tokenInfo = await bullxGraphql("tokeninfo", mintAddress as string);
//       const tradeInfo = await bullxGraphql("trade", mintAddress as string);
//       const ohlcData = await bullxGraphql("ohlc", mintAddress as string);
//       const ohlc: any[] = [];
//       for (let ind in ohlcData.t) {
//         const ohlcObj = {
//           o: ohlcData.o[ind],
//           h: ohlcData.h[ind],
//           l: ohlcData.l[ind],
//           c: ohlcData.c[ind],
//           t: ohlcData.t[ind],
//           v: ohlcData.v[ind],
//         };
//         ohlc.push(ohlcObj);
//       }
//       if (holders.length > 10) {
//         holders = holders.slice(0, 9);
//       }
//       for (let i = 0; i < holders.length; i++) {
//         const firstNumber = new BigNumber(holders[i].currentlyHoldingAmount);
//         const toNumber = new BigNumber(bondingCurveData.tokenTotalSupply);
//         holders[i] = {
//           percentage: formatNumber(
//             firstNumber.dividedBy(toNumber).multipliedBy(100).toNumber()
//           ),
//           ...holders[i],
//         };
//       }
//       const data = {
//         bondingCurve: bondingCurveData.complete,
//         raydium: !bondingCurveData.complete,
//         ...tokenInfo.data[mintAddress as string],
//         holders,
//         transactions: tradeInfo.tradeHistory,
//         ohlc,
//       };
//       res.status(200).json({ success: true, data });
//     } catch (error) {
//       console.log("error :>> ", error);
//       res.status(500).json({ success: false, message: "Something went wrong" });
//     }
//   }
// );
exports.getTokenDetails = (0, express_async_handler_1.default)(async (req, res) => {
    // console.log("Fetching token detail")
    const { mintAddress } = req.query;
    try {
        let bondingCurveData = null;
        let raydiumData = null;
        let isPumpFun = false;
        try {
            // Check if the token is from Pump.fun
            const newAddress = (0, graphql_1.getPairAddress)(mintAddress);
            const bondingCurveAddress = newAddress.toString();
            bondingCurveData = await (0, pump_1.getPumpCurveState)(bondingCurveAddress);
            isPumpFun = true;
        }
        catch (error) {
            console.log("Not a Pump.fun token, fetching from Raydium...");
        }
        if (!isPumpFun) {
            // Fetch data from Raydium if it's not a Pump.fun token
            raydiumData = await (0, pump_1.getRaydiumTokenData)((String(mintAddress)));
            if (!raydiumData) {
                throw new Error("Token not found on Pump.fun or Raydium.");
            }
        }
        // Fetch token info from GraphQL
        let holders = await (0, graphql_1.bullxGraphql)("holders", mintAddress);
        const tokenInfo = await (0, graphql_1.bullxGraphql)("tokeninfo", mintAddress);
        const tradeInfo = await (0, graphql_1.bullxGraphql)("trade", mintAddress);
        const ohlcData = await (0, graphql_1.bullxGraphql)("ohlc", mintAddress);
        // Process OHLC data
        const ohlc = ohlcData.t.map((_, ind) => ({
            o: ohlcData.o[ind],
            h: ohlcData.h[ind],
            l: ohlcData.l[ind],
            c: ohlcData.c[ind],
            t: ohlcData.t[ind],
            v: ohlcData.v[ind],
        }));
        // Limit holders to 10
        if (holders.length > 10) {
            holders = holders.slice(0, 9);
        }
        // Calculate holder percentages for Pump.fun tokens
        if (isPumpFun) {
            for (let i = 0; i < holders.length; i++) {
                const firstNumber = new bignumber_js_1.default(holders[i].currentlyHoldingAmount);
                const toNumber = new bignumber_js_1.default(bondingCurveData.tokenTotalSupply);
                holders[i] = {
                    percentage: (0, solana_1.formatNumber)(firstNumber.dividedBy(toNumber).multipliedBy(100).toNumber()),
                    ...holders[i],
                };
            }
        }
        let data = {
            source: isPumpFun ? "Pump.fun" : "Raydium",
            bondingCurve: isPumpFun ? bondingCurveData.complete : false,
            raydium: !isPumpFun,
            ...tokenInfo.data[mintAddress],
            holders,
            transactions: tradeInfo.tradeHistory,
            ohlc,
        };
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.log("Error fetching token details:", error);
        // return null;
        res.status(500).json({ success: false, message: error });
    }
});
// From pump.ts 
// export const getTokenDetails = async (mintAddress: string) => {
//   try {
//     let bondingCurveData: any = null;
//     let raydiumData: any = null;
//     let isPumpFun = false;
//     try {
//       // Check if the token is from Pump.fun
//       const newAddress = getPairAddress(mintAddress as string);
//       const bondingCurveAddress = newAddress.toString();
//       bondingCurveData = await getPumpCurveState(bondingCurveAddress);
//       isPumpFun = true;
//     } catch (error) {
//       console.log("Not a Pump.fun token, fetching from Raydium...");
//     }
//     if (!isPumpFun) {
//       // Fetch data from Raydium if it's not a Pump.fun token
//       raydiumData = await getRaydiumTokenData(mintAddress);
//       if (!raydiumData) {
//         throw new Error("Token not found on Pump.fun or Raydium.");
//       }
//     }
//     // Fetch token info from GraphQL
//     let holders = await bullxGraphql("holders", mintAddress as string);
//     const tokenInfo = await bullxGraphql("tokeninfo", mintAddress as string);
//     const tradeInfo = await bullxGraphql("trade", mintAddress as string);
//     const ohlcData = await bullxGraphql("ohlc", mintAddress as string);
//     // Process OHLC data
//     const ohlc: any[] = ohlcData.t.map((_:any, ind:any) => ({
//       o: ohlcData.o[ind],
//       h: ohlcData.h[ind],
//       l: ohlcData.l[ind],
//       c: ohlcData.c[ind],
//       t: ohlcData.t[ind],
//       v: ohlcData.v[ind],
//     }));
//     // Limit holders to 10
//     if (holders.length > 10) {
//       holders = holders.slice(0, 9);
//     }
//     // Calculate holder percentages for Pump.fun tokens
//     if (isPumpFun) {
//       for (let i = 0; i < holders.length; i++) {
//         const firstNumber = new BigNumber(holders[i].currentlyHoldingAmount);
//         const toNumber = new BigNumber(bondingCurveData.tokenTotalSupply);
//         holders[i] = {
//           percentage: formatNumber(
//             firstNumber.dividedBy(toNumber).multipliedBy(100).toNumber()
//           ),
//           ...holders[i],
//         };
//       }
//     }
//     // Return data with appropriate source
//     return {
//       source: isPumpFun ? "Pump.fun" : "Raydium",
//       bondingCurve: isPumpFun ? bondingCurveData.complete : false,
//       raydium: !isPumpFun,
//       ...tokenInfo.data[mintAddress as string],
//       holders,
//       transactions: tradeInfo.tradeHistory,
//       ohlc,
//     };
//       res.status(200).json({ success: true, data });
//   } catch (error) {
//     console.log("Error fetching token details:", error);
//     return null;
//   }
// };
exports.getPumpVision = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        let { status } = req.query;
        let graduateStatus = Number(status);
        console.log("here!@!---> ", req.query);
        let data = await (0, graphql_1.bullxGraphql)("pumpVision", "", {}, graduateStatus);
        let newTokens = [...data.data], tokens = [];
        for (let i = 0; i < newTokens.length; i++) {
            //const tokenInfo = await bullxGraphql("tokeninfo", newTokens[i].address as string);
            //console.log(tokenInfo);
            // console.log("added one logo")
        }
        tokens = newTokens;
        console.log("here");
        res.status(200).json({ success: true, tokens });
    }
    catch (error) {
        res.status(500).json({ success: false, tokens: [] });
    }
});
// export const getTokenImage = expressAsyncHandler(
//   async(req: Request, res:Response) => {
//     try{
//       let {address} = req.query;
//       const tokenInfo = await bullxGraphql("tokeninfo", address as string);
//       console.log("token Info:", tokenInfo.data[address as keyof typeof tokenInfo.data].logo);
//       res.status(200).json({ success: true, data:tokenInfo.data[address as keyof typeof tokenInfo.data].logo });
//     }catch(error){
//       res.status(500).json({success:false});
//     }
//   }
// )
exports.getTokenImage = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        let { address } = req.query;
        const tokenInfo = await (0, graphql_1.bullxGraphql)("tokeninfo", address);
        const logo = tokenInfo.data[address]?.logo;
        // Check if logo starts with "http://" or "https://"
        const isValidUrl = typeof logo === "string" && /^(https?:\/\/)/.test(logo);
        // console.log("Token Info:", logo);
        res.status(200).json({ success: true, data: isValidUrl ? logo : null });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error });
    }
});
exports.getTrendingTokens = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { timeframe } = req.query;
        const timeInSeconds = Number(timeframe) || 300; // Default: last 5 minutes
        // Timestamp for filtering recent tokens
        // const timestamp = Math.floor(Date.now() / 1000) - timeInSeconds;
        console.log(timeframe);
        // console.log(timestamp)
        let data = await (0, graphql_1.bullxGraphql)("tokens", "", {
            // poolCreationBlockTimestamp: timestamp, // ✅ Pass timestamp directly
            volume: { min: 300000 },
            marketcap: { min: 100000 },
            liquidity: { min: 25000 },
            txns: { min: 100 },
            buys: { min: 5 },
            sells: { min: 5 },
        });
        res.status(200).json({ success: true, tokens: data });
    }
    catch (error) {
        console.error("Error fetching trending tokens:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
});
