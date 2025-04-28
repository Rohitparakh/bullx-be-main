"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTokenData = exports.fetchBondingCurve = exports.structure = exports.getRaydiumTokenPrice = exports.getTokenDetails = exports.saveNewPumpToken = exports.getPumpCurveDataByBondingCurveKey = exports.getPumpCurveData = exports.getPumpMeta = exports.getOHLC = exports.getTransactions = exports.getSolPrice = void 0;
exports.getPumpCurveState = getPumpCurveState;
exports.calculatePumpCurvePrice = calculatePumpCurvePrice;
exports.getRaydiumTokenData = getRaydiumTokenData;
exports.bondingCurveData = bondingCurveData;
exports.getTokenSymbol = getTokenSymbol;
const web3 = __importStar(require("@solana/web3.js"));
const borsh_1 = require("@coral-xyz/borsh");
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../config");
const axios_1 = __importDefault(require("axios"));
const solana_1 = require("./solana");
const web3_js_2 = require("@solana/web3.js");
const pumptoken_1 = __importDefault(require("../model/pump/pumptoken"));
const graphql_1 = require("./graphql");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
//////////////////////////////////////////////////
function readBytes(buf, offset, length) {
    const end = offset + length;
    if (buf.byteLength < end)
        throw new RangeError("range out of bounds");
    return buf.subarray(offset, end);
}
function readBigUintLE(buf, offset, length) {
    switch (length) {
        case 1:
            return BigInt(buf.readUint8(offset));
        case 2:
            return BigInt(buf.readUint16LE(offset));
        case 4:
            return BigInt(buf.readUint32LE(offset));
        case 8:
            return buf.readBigUint64LE(offset);
    }
    throw new Error(`unsupported data size (${length} bytes)`);
}
function readBoolean(buf, offset, length) {
    const data = readBytes(buf, offset, length);
    for (const b of data) {
        if (b)
            return true;
    }
    return false;
}
//////////////////////////////////////////////////
const PUMP_CURVE_TOKEN_DECIMALS = 6;
// Calculated as the first 8 bytes of: `sha256("account:BondingCurve")`.
const PUMP_CURVE_STATE_SIGNATURE = Uint8Array.from([
    0x17, 0xb7, 0xf8, 0x37, 0x60, 0xd8, 0xac, 0x60,
]);
const PUMP_CURVE_STATE_SIZE = 0x29;
const PUMP_CURVE_STATE_OFFSETS = {
    VIRTUAL_TOKEN_RESERVES: 0x08,
    VIRTUAL_SOL_RESERVES: 0x10,
    REAL_TOKEN_RESERVES: 0x18,
    REAL_SOL_RESERVES: 0x20,
    TOKEN_TOTAL_SUPPLY: 0x28,
    COMPLETE: 0x30,
};
// Fetches account data of a Pump.fun bonding curve, and deserializes it
// according to `accounts.BondingCurve` (see: Pump.fun program's Anchor IDL).
async function getPumpCurveState(curveAddress) {
    // console.log('RPC: ',RPC_ENDPOINT)
    const conn = new web3.Connection(config_1.RPC_ENDPOINT, "confirmed");
    const pubKey = new web3.PublicKey(curveAddress);
    // console.log("Curve Address: ",curveAddress)
    // console.log("PUBKEY: ",pubKey)
    // console.log("Fetching account info for:", curveAddress);
    const response = await conn.getAccountInfo(pubKey);
    console.log("Response: ", response?.data);
    if (!response) {
        console.error("Account not found. Possible reasons:");
        console.error("- The account does not exist.");
        console.error("- The account is closed.");
        console.error("- RPC rate limits are hit.");
        throw new Error("Unexpected curve state: Account not found.");
        // await fetchBondingCurve(mintAddress);
    }
    // console.log("Account Data Length:", response.data?.byteLength);
    // const response = await conn.getAccountInfo(pubKey);
    if (!response ||
        !response.data ||
        response.data.byteLength <
            PUMP_CURVE_STATE_SIGNATURE.byteLength + PUMP_CURVE_STATE_SIZE) {
        // console.log(response)
        throw new Error("unexpected curve state");
    }
    const idlSignature = readBytes(response.data, 0, PUMP_CURVE_STATE_SIGNATURE.byteLength);
    if (idlSignature.compare(PUMP_CURVE_STATE_SIGNATURE) !== 0) {
        throw new Error("unexpected curve state IDL signature");
    }
    return {
        virtualTokenReserves: readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.VIRTUAL_TOKEN_RESERVES, 8),
        virtualSolReserves: readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.VIRTUAL_SOL_RESERVES, 8),
        realTokenReserves: readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.REAL_TOKEN_RESERVES, 8),
        realSolReserves: readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.REAL_SOL_RESERVES, 8),
        tokenTotalSupply: readBigUintLE(response.data, PUMP_CURVE_STATE_OFFSETS.TOKEN_TOTAL_SUPPLY, 8),
        complete: readBoolean(response.data, PUMP_CURVE_STATE_OFFSETS.COMPLETE, 1),
    };
}
// Calculates token price (in SOL) of a Pump.fun bonding curve.
function calculatePumpCurvePrice(curveState) {
    if (curveState === null ||
        typeof curveState !== "object" ||
        !(typeof curveState.virtualTokenReserves === "bigint" &&
            typeof curveState.virtualSolReserves === "bigint")) {
        throw new TypeError("curveState must be a PumpCurveState");
    }
    if (curveState.virtualTokenReserves <= 0 ||
        curveState.virtualSolReserves <= 0) {
        throw new RangeError("curve state contains invalid reserve data");
    }
    return (Number(curveState.virtualSolReserves) /
        web3.LAMPORTS_PER_SOL /
        (Number(curveState.virtualTokenReserves) / 10 ** PUMP_CURVE_TOKEN_DECIMALS));
}
const getSolPrice = async () => {
    const primaryRequest = axios_1.default.get(config_1.SOL_PRICE_URL, { timeout: 2000 }).then(res => {
        const price = res.data?.solPrice;
        if (typeof price === 'number' && price > 0) {
            return price;
        }
        throw new Error('Invalid primary SOL price');
    });
    const fallbackRequest = axios_1.default.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
        timeout: 3000,
        params: {
            symbol: 'SOL',
            convert: 'USD',
        },
        headers: {
            'X-CMC_PRO_API_KEY': config_1.CMC_API_KEY,
        },
    }).then(res => {
        const price = res.data?.data?.SOL?.quote?.USD?.price;
        if (typeof price === 'number' && price > 0) {
            return price;
        }
        throw new Error('Invalid fallback SOL price');
    });
    try {
        // Whichever resolves first (primary preferred)
        return await Promise.any([primaryRequest, fallbackRequest]);
    }
    catch {
        // If both fail
        return 0;
    }
};
exports.getSolPrice = getSolPrice;
// export const getSolPrice = async (): Promise<number> => {
//   try {
//     const { data } = await axios.get(SOL_PRICE_URL);
//     const solPrice = data?.solPrice;
//     if (typeof solPrice === 'number' && solPrice > 0) {
//       return solPrice;
//     }
//     throw new Error("Invalid SOL price, using fallback");
//   } catch {
//     // Fallback to CoinMarketCap
//     try {
//       const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
//         params: {
//           symbol: 'SOL',
//           convert: 'USD',
//         },
//         headers: {
//           'X-CMC_PRO_API_KEY': CMC_API_KEY,
//         },
//       });
//       const price = response.data?.data?.SOL?.quote?.USD?.price;
//       return typeof price === 'number' ? price : 0;
//     } catch {
//       return 0;
//     }
//   }
// };
// export const getSolPrice = async () => {
//   const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
//   console.log("SOL PRICE URL")
//   console.log(SOL_PRICE_URL)
//   console.log("CMC_API_KEY")
//   console.log(CMC_API_KEY)
//   try {
//     const { data } = await axios.get(SOL_PRICE_URL);
//     console.log("DATAaaaa", data);
//     if (!data?.solPrice || data.solPrice <= 0) {
//       throw new Error("Invalid SOL price, falling back to CoinMarketCap API");
//     }
//     return data.solPrice;
//   } catch (error:any) {
//     // console.error("Error fetching SOL price from primary source:", error.message);
//     // Fallback to CoinMarketCap API
//     try {
//       const response = await axios.get(url, {
//         params: {
//           symbol: 'SOL',
//           convert: 'USD',
//         },
//         headers: {
//           'X-CMC_PRO_API_KEY': CMC_API_KEY,
//         },
//       });
//       const price = response.data.data.SOL.quote.USD.price;
//       console.log(`The current price of Solana (SOL) is $${price.toFixed(2)} USD.`);
//       return price.toFixed(2);
//     } catch (fallbackError:any) {
//       // console.error("Error fetching SOL price from CoinMarketCap:", fallbackError.message);
//       return 0;  // Return 0 if both APIs fail
//     }
//   }
// };
const getTransactions = async (address, limit = 200, offset = 0, minimumSize = 0) => {
    try {
        const { data } = await axios_1.default.get(`${config_1.TRANSCATION_URL}/${address}?limit=${limit}&offset=${offset}&minimumSize=${minimumSize}`);
        return data;
    }
    catch (error) {
        return [];
    }
};
exports.getTransactions = getTransactions;
const getOHLC = async (address, offset = 0, limit = 1000, timeframe = 5) => {
    try {
        const { data } = await axios_1.default.get(`${config_1.OHLC_BASE_URL}/${address}?offset=${offset}&limit=${limit}&timeframe=${timeframe}`);
        return data;
    }
    catch (error) {
        return [];
    }
};
exports.getOHLC = getOHLC;
const getPumpMeta = async (address) => {
    try {
        const response = await (0, solana_1.getMetadata)(address);
        return response;
    }
    catch (error) {
        console.log(error);
        return 0;
    }
};
exports.getPumpMeta = getPumpMeta;
const getPumpCurveData = async (address) => {
    const newAddress = await (0, graphql_1.getPairAddress)(address);
    const bondingCurveAddress = newAddress.toString();
    const bondingCurveData = await getPumpCurveState(bondingCurveAddress);
    // const testCurveData = await testPumpCurveAccount(bondingCurveAddress);
    const pumpCurvePrice = calculatePumpCurvePrice(bondingCurveData);
    const marketCap = pumpCurvePrice * 10 ** 9;
    const liquidity = (Number(bondingCurveData.realSolReserves) * 2) / web3_js_2.LAMPORTS_PER_SOL;
    const solPrice = await (0, exports.getSolPrice)();
    const bondingProgress = ((marketCap * solPrice) / 690) * 2;
    return { pumpCurvePrice, marketCap, liquidity, bondingProgress };
};
exports.getPumpCurveData = getPumpCurveData;
const getPumpCurveDataByBondingCurveKey = async (bondingCurveAddress) => {
    const bondingCurveData = await getPumpCurveState(bondingCurveAddress);
    // const testCurveData = await testPumpCurveAccount(bondingCurveAddress);
    const pumpCurvePrice = calculatePumpCurvePrice(bondingCurveData);
    const marketCap = pumpCurvePrice * 10 ** 9;
    const liquidity = (Number(bondingCurveData.realSolReserves) * 2) / web3_js_2.LAMPORTS_PER_SOL;
    const solPrice = await (0, exports.getSolPrice)();
    const bondingProgress = ((marketCap * solPrice) / 690) * 2;
    return { pumpCurvePrice, marketCap, liquidity, bondingProgress };
};
exports.getPumpCurveDataByBondingCurveKey = getPumpCurveDataByBondingCurveKey;
const saveNewPumpToken = async (coinData) => {
    try {
        // const mcData: ITokenMC = await getPumpCurveDataByBondingCurveKey(
        //   coinData.bonding_curve_key as string
        // );
        // const newCoinData: IPumpToken = { ...coinData, mc_data: mcData };
        const newCoinData = { ...coinData };
        const newCoin = new pumptoken_1.default(newCoinData);
        newCoin.save();
    }
    catch (error) {
        console.log(error);
    }
};
exports.saveNewPumpToken = saveNewPumpToken;
const node_fetch_1 = __importDefault(require("node-fetch"));
// const RAYDIUM_API = "https://api-v3.raydium.io/amm/pairs";
// export const getRaydiumTokenInfo = async (mintAddress: string) => {
//   try {
//     const response:any = await fetch(`${RAYDIUM_API}`);
//     const data:any = await response.json();
//     const tokenData = data?.pairs?.find((pair: any) =>
//       pair.mintAddresses.includes(mintAddress)
//     );
//     if (!tokenData) {
//       console.log("Token not found on Raydium.");
//       return null;
//     }
//     return {
//       price: tokenData.price,
//       liquidity: tokenData.liquidity,
//       volume: tokenData.volume24h,
//       apr: tokenData.apr,
//     };
//   } catch (error) {
//     console.error("Error fetching Raydium token info:", error);
//     return null;
//   }
// };
// Fetch token data from Raydium API
// export async function getRaydiumTokenData(mintAddress: string) {
//   try {
//     console.log("A")
//     const response = await fetch(`${RAYDIUM_API}`, {
//       method: 'GET', // Specify method explicitly
//       headers: {
//         'X-CMC_PRO_API_KEY': CMC_API_KEY,
//       },
//     });
//     console.log("b")
//     const data: any = await response.json();
//     console.log("c")
//     console.log("Data: ",response)
//     console.log("d")
//     // Find token data by mint address
//     const tokenData = data?.find((pair: any) => pair.baseMint === mintAddress || pair.quoteMint === mintAddress);
//     console.log("e")
//     if (!tokenData) {
//       throw new Error("Token not found on Raydium.");
//     }
//     return {
//       price: tokenData.price,
//       volume24h: tokenData.volume24h,
//       liquidity: tokenData.liquidity,
//       baseMint: tokenData.baseMint,
//       quoteMint: tokenData.quoteMint,
//     };
//   } catch (error) {
//     console.error("Error fetching Raydium token data:", error);
//     return null;
//   }
// }
const RAYDIUM_API = "https://api-v3.raydium.io/pools/info/mint";
async function getRaydiumTokenData(mintAddress) {
    try {
        console.log("Fetching data for:", mintAddress);
        const response = await (0, node_fetch_1.default)(`${RAYDIUM_API}?mint1=${mintAddress}&poolType=all&poolSortField=default&sortType=asc&pageSize=1000&page=1`, {
            method: 'GET',
        });
        // console.log(response)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Raw API Response:", JSON.stringify(data, null, 2));
        if (!data || Object.keys(data).length === 0) {
            throw new Error("Token not found on Raydium.");
        }
        // Extract correct properties based on actual response structure
        const tokenData = Object.values(data)[0];
        if (!tokenData) {
            throw new Error("Invalid token data.");
        }
        return {
            price: tokenData.price ?? null,
            volume24h: tokenData.volume24h ?? null,
            liquidity: tokenData.liquidity ?? null,
            baseMint: tokenData.baseMint ?? null,
            quoteMint: tokenData.quoteMint ?? null,
        };
    }
    catch (error) {
        console.error("Error fetching Raydium token data:", error);
        return null;
    }
}
const getTokenDetails = async (mintAddress) => {
    try {
        let bondingCurveData = null;
        let raydiumData = null;
        let isPumpFun = false;
        try {
            // Check if the token is from Pump.fun
            const newAddress = (0, graphql_1.getPairAddress)(mintAddress);
            const bondingCurveAddress = newAddress.toString();
            bondingCurveData = await getPumpCurveState(bondingCurveAddress);
            isPumpFun = true;
        }
        catch (error) {
            console.log("Not a Pump.fun token, fetching from Raydium...");
        }
        if (!isPumpFun) {
            // Fetch data from Raydium if it's not a Pump.fun token
            raydiumData = await getRaydiumTokenData(mintAddress);
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
        // Return data with appropriate source
        return {
            source: isPumpFun ? "Pump.fun" : "Raydium",
            bondingCurve: isPumpFun ? bondingCurveData.complete : false,
            raydium: !isPumpFun,
            ...tokenInfo.data[mintAddress],
            holders,
            transactions: tradeInfo.tradeHistory,
            ohlc,
        };
    }
    catch (error) {
        console.log("Error fetching token details:", error);
        return null;
    }
};
exports.getTokenDetails = getTokenDetails;
// export const getTokenDetails = async (mintAddress: string) => {
//   try {
//     const newAddress = getPairAddress(mintAddress as string);
//     const bondingCurveAddress = newAddress.toString();
//     const bondingCurveData: any = await getPumpCurveState(bondingCurveAddress);
//     // getRaydiumTokenPrice(mintAddress);
//     // const testCurveData = await testPumpCurveAccount(bondingCurveAddress);
//     let holders = await bullxGraphql("holders", mintAddress as string);
//     const tokenInfo = await bullxGraphql("tokeninfo", mintAddress as string);
//     const tradeInfo = await bullxGraphql("trade", mintAddress as string);
//     const ohlcData = await bullxGraphql("ohlc", mintAddress as string);
//     const ohlc: any[] = [];
//     for (let ind in ohlcData.t) {
//       const ohlcObj = {
//         o: ohlcData.o[ind],
//         h: ohlcData.h[ind],
//         l: ohlcData.l[ind],
//         c: ohlcData.c[ind],
//         t: ohlcData.t[ind],
//         v: ohlcData.v[ind],
//       };
//       ohlc.push(ohlcObj);
//     }
//     if (holders.length > 10) {
//       holders = holders.slice(0, 9);
//     }
//     for (let i = 0; i < holders.length; i++) {
//       const firstNumber = new BigNumber(holders[i].currentlyHoldingAmount);
//       const toNumber = new BigNumber(bondingCurveData.tokenTotalSupply);
//       holders[i] = {
//         percentage: formatNumber(
//           firstNumber.dividedBy(toNumber).multipliedBy(100).toNumber()
//         ),
//         ...holders[i],
//       };
//     }
//     const data = {
//       bondingCurve: bondingCurveData.complete,
//       raydium: !bondingCurveData.complete,
//       ...tokenInfo.data[mintAddress as string],
//       holders,
//       transactions: tradeInfo.tradeHistory,
//       ohlc,
//     };
//     // console.log("Token Data:", data)
//     return data;
//   } catch (error) {
//     console.log("error :>> ", error);
//     return null;
//   }
// };
async function getRaydiumPoolInfo(mintAddress) {
    const apiUrl = `https://api.raydium.io/v2/ammV3/ammPools`;
    try {
        const { data } = await axios_1.default.get(apiUrl);
        // const pool = data.official.find(
        //   (p: any) => p.lpMint === mintAddress || p.baseMint === mintAddress
        // );
        // console.log(pool?.market)
        // return pool ? pool.market : null;
        console.log(data);
        return data;
    }
    catch (error) {
        console.error("Error fetching Raydium pool info:", error);
        return null;
    }
}
const getRaydiumTokenPrice = (mintAddress) => (0, express_async_handler_1.default)(async (req, res) => {
    {
        let address = mintAddress;
        if (address == undefined) {
            let params = req.params;
            address = params.mintAddress;
        }
        const poolAddress = await getRaydiumPoolInfo(address);
        if (!poolAddress) {
            throw new Error("Token not found in Raydium pools.");
        }
        const apiUrl = `https://api.raydium.io/v2/main/ammPools`;
        try {
            const { data } = await axios_1.default.get(apiUrl);
            const poolData = data.ammPools.find((p) => p.id === poolAddress);
            if (!poolData) {
                throw new Error("Liquidity pool not found.");
            }
            // Calculate price using the pool's reserves
            const result = Number(poolData.quoteReserve) / Number(poolData.baseReserve);
            // const result = poolData.quoteReserve / poolData.baseReserve
            res.status(200).json({
                success: true,
                data: { data: result },
            });
            // return Number(poolData.quoteReserve) / Number(poolData.baseReserve);
        }
        catch (error) {
            console.error("Error fetching Raydium token price:", error);
            res.status(500).json({ message: "Error fetching Raydium token price" });
        }
    }
});
exports.getRaydiumTokenPrice = getRaydiumTokenPrice;
exports.structure = (0, borsh_1.struct)([
    (0, borsh_1.u64)("discriminator"),
    (0, borsh_1.u64)("virtualTokenReserves"),
    (0, borsh_1.u64)("virtualSolReserves"),
    (0, borsh_1.u64)("realTokenReserves"),
    (0, borsh_1.u64)("realSolReserves"),
    (0, borsh_1.u64)("tokenTotalSupply"),
    (0, borsh_1.bool)("complete"),
]);
function bondingCurveData(buffer) {
    let value = exports.structure.decode(buffer);
    const discriminator = BigInt(value.discriminator);
    const virtualTokenReserves = BigInt(value.virtualTokenReserves);
    const virtualSolReserves = BigInt(value.virtualSolReserves);
    const realTokenReserves = BigInt(value.realTokenReserves);
    const realSolReserves = BigInt(value.realSolReserves);
    const tokenTotalSupply = BigInt(value.tokenTotalSupply);
    const complete = value.complete;
    return {
        discriminator,
        virtualTokenReserves,
        virtualSolReserves,
        realTokenReserves,
        realSolReserves,
        tokenTotalSupply,
        complete
    };
}
const connection = new web3.Connection("https://api.mainnet-beta.solana.com");
// export async function fetchBondingCurve(req: Request,res: Response) {
//   let tokenAddress = req.params.mint;
//   const accountInfo = await connection.getAccountInfo(new web3.PublicKey(tokenAddress));
//   if (accountInfo) {
//     const buffer = accountInfo.data;
//     const decodedData = bondingCurveData(buffer);
//     console.log("decodedData");
//     console.log(decodedData);
//     return decodedData;
//   } else {
//     console.log("Account not found");
//   }
// }
exports.fetchBondingCurve = (0, express_async_handler_1.default)(async (req, res) => {
    const { mint } = req.params;
    if (!mint) {
        res.status(400).json({ success: false, message: "Mint address is required" });
        return;
    }
    const tokenAddress = new web3_js_1.PublicKey(mint);
    const accountInfo = await connection.getAccountInfo(tokenAddress);
    if (!accountInfo) {
        res.status(404).json({ success: false, message: "Account not found" });
        return;
    }
    const buffer = accountInfo.data;
    const decodedData = bondingCurveData(buffer);
    console.log("Decoded Data:", decodedData);
    res.json({
        success: true,
        data: JSON.parse(JSON.stringify(decodedData, (_, value) => typeof value === "bigint" ? value.toString() : value)),
    });
    console.error("Error fetching bonding curve:");
    res.status(500).json({ success: false, message: "Internal server error" });
});
// export const fetchBondingCurve = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const tokenAddress = new PublicKey(mint);
//     const accountInfo = await connection.getAccountInfo(tokenAddress);
//     if (!accountInfo) {
//       res.status(404).json({ success: false, message: "Account not found" });
//       return;
//     }
//     const buffer = accountInfo.data;
//     const decodedData = bondingCurveData(buffer);
//     console.log("Decoded Data:", decodedData);
//     res.json({ success: true, data: decodedData });
//   } catch (error) {
//     console.error("Error fetching bonding curve:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };
const TOKEN_LIST_URL = "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json";
async function getTokenSymbol(mintAddress) {
    try {
        const requestOptions = {
            method: "GET",
            headers: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MjM2Nzk3MDgxOTgsImVtYWlsIjoiZHJlYW15dGdib3RAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzIzNjc5NzA4fQ.qEG3q2DSX_i60f8eNhAZ_XEQgmbRHZmQPgY4_7RhZQU" }
        };
        const response = await (0, node_fetch_1.default)(`https://pro-api.solscan.io/v2.0/token/meta?address=${mintAddress}`, requestOptions);
        // console.log(response)
        if (!response.ok) {
            throw new Error(`Failed to fetch token data: ${response.statusText}`);
        }
        const data = (await response.json());
        if (!data?.data?.symbol) {
            console.log("Token symbol not found.");
            return null;
        }
        return data.data.symbol;
    }
    catch (error) {
        console.error("Error fetching token symbol:", error);
        return null;
    }
}
exports.fetchTokenData = (0, express_async_handler_1.default)(async (req, res) => {
    const { mint } = req.params;
    if (!mint) {
        res.status(400).json({ success: false, message: "Mint address is required" });
        return;
    }
    try {
        // Fetch Token Data from Solscan API
        console.log(config_1.SOLSCAN_TOKEN);
        const requestOptions = {
            method: "GET",
            headers: {
                "token": `${config_1.SOLSCAN_TOKEN}`
            }
        };
        const solscanResponse = await (0, node_fetch_1.default)(`https://pro-api.solscan.io/v2.0/token/meta?address=${mint}`, requestOptions);
        if (!solscanResponse.ok) {
            throw new Error(`Failed to fetch token data: ${solscanResponse.statusText}`);
        }
        // Fix: Explicitly define the response type using `as`
        const solscanData = (await solscanResponse.json());
        if (!solscanData?.data || Object.keys(solscanData.data).length === 0) {
            res.status(404).json({ success: false, message: "Token not found in Solana network" });
            return;
        }
        // Extract relevant data
        const tokenInfo = solscanData.data;
        res.json({
            success: true,
            data: {
                symbol: tokenInfo.symbol || "N/A",
                name: tokenInfo.name || "N/A",
                price: tokenInfo.price || "N/A",
                marketCap: tokenInfo.market_cap || "N/A",
                totalSupply: tokenInfo.supply || "N/A",
                volume: tokenInfo.volume_24h || "N/A",
                holders: tokenInfo.holder || "N/A",
                circulatingSupply: tokenInfo.circulatingSupply || "N/A",
                liquidity: tokenInfo.liquidity || "N/A"
            },
        });
    }
    catch (error) {
        console.error("Error fetching token data:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
// export const fetchTokenData = expressAsyncHandler(
//   async (req: Request, res: Response) => {
//     const { mint } = req.params;
//     if (!mint) {
//       res.status(400).json({ success: false, message: "Mint address is required" });
//       return;
//     }
//     try {
//       // Step 1: Get Token Symbol from Mint Address
//       const symbol = await getTokenSymbol(mint);
//       // console.log(symbol)
//       if (!symbol) {
//         res.status(404).json({ success: false, message: "Token not found in Solana token list" });
//         return;
//       }
//       // Step 2: Fetch Data from CoinMarketCap
//       const response = await axios.get(
//         "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
//         {
//           params: {
//             symbol: symbol,
//             convert: "USD",
//           },
//           headers: {
//             "X-CMC_PRO_API_KEY": CMC_API_KEY,
//           },
//         }
//       );
//       console.log(response)
//       const tokenData = response.data?.data?.[symbol];
//       if (!tokenData) {
//         res.status(404).json({ success: false, message: "Token not found on CoinMarketCap" });
//         return;
//       }
//       res.json({
//         success: true,
//         data: {
//           price: tokenData.quote.USD.price,
//           marketCap: tokenData.quote.USD.market_cap,
//           liquidity: tokenData.quote.USD.liquidity_score || "N/A", // Liquidity score if available
//           totalSupply: tokenData.total_supply,
//           circulatingSupply: tokenData.circulating_supply,
//         },
//       });
//     } catch (error) {
//       console.error("Error fetching token data:", error);
//       res.status(500).json({ success: false, message: "Internal server error" });
//     }
//   }
// );
