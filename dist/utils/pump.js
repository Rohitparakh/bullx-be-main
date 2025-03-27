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
exports.getTokenDetails = exports.saveNewPumpToken = exports.getPumpCurveDataByBondingCurveKey = exports.getPumpCurveData = exports.getPumpMeta = exports.getOHLC = exports.getTransactions = exports.getSolPrice = void 0;
exports.getPumpCurveState = getPumpCurveState;
exports.calculatePumpCurvePrice = calculatePumpCurvePrice;
const web3 = __importStar(require("@solana/web3.js"));
const config_1 = require("../config");
const axios_1 = __importDefault(require("axios"));
const solana_1 = require("./solana");
const web3_js_1 = require("@solana/web3.js");
const pumptoken_1 = __importDefault(require("../model/pump/pumptoken"));
const graphql_1 = require("./graphql");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
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
function getPumpCurveState(curveAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const conn = new web3.Connection(config_1.RPC_ENDPOINT, "confirmed");
        const pubKey = new web3.PublicKey(curveAddress);
        const response = yield conn.getAccountInfo(pubKey);
        if (!response ||
            !response.data ||
            response.data.byteLength <
                PUMP_CURVE_STATE_SIGNATURE.byteLength + PUMP_CURVE_STATE_SIZE) {
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
    });
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
const getSolPrice = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data } = yield axios_1.default.get(config_1.SOL_PRICE_URL);
        return data.solPrice;
    }
    catch (error) {
        return 0;
    }
});
exports.getSolPrice = getSolPrice;
const getTransactions = (address_1, ...args_1) => __awaiter(void 0, [address_1, ...args_1], void 0, function* (address, limit = 200, offset = 0, minimumSize = 0) {
    try {
        const { data } = yield axios_1.default.get(`${config_1.TRANSCATION_URL}/${address}?limit=${limit}&offset=${offset}&minimumSize=${minimumSize}`);
        return data;
    }
    catch (error) {
        return [];
    }
});
exports.getTransactions = getTransactions;
const getOHLC = (address_1, ...args_1) => __awaiter(void 0, [address_1, ...args_1], void 0, function* (address, offset = 0, limit = 1000, timeframe = 5) {
    try {
        const { data } = yield axios_1.default.get(`${config_1.OHLC_BASE_URL}/${address}?offset=${offset}&limit=${limit}&timeframe=${timeframe}`);
        return data;
    }
    catch (error) {
        return [];
    }
});
exports.getOHLC = getOHLC;
const getPumpMeta = (address) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield (0, solana_1.getMetadata)(address);
        return response;
    }
    catch (error) {
        console.log(error);
        return 0;
    }
});
exports.getPumpMeta = getPumpMeta;
const getPumpCurveData = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const newAddress = yield (0, graphql_1.getPairAddress)(address);
    const bondingCurveAddress = newAddress.toString();
    const bondingCurveData = yield getPumpCurveState(bondingCurveAddress);
    const pumpCurvePrice = calculatePumpCurvePrice(bondingCurveData);
    const marketCap = pumpCurvePrice * 10 ** 9;
    const liquidity = (Number(bondingCurveData.realSolReserves) * 2) / web3_js_1.LAMPORTS_PER_SOL;
    const solPrice = yield (0, exports.getSolPrice)();
    const bondingProgress = ((marketCap * solPrice) / 690) * 2;
    return { pumpCurvePrice, marketCap, liquidity, bondingProgress };
});
exports.getPumpCurveData = getPumpCurveData;
const getPumpCurveDataByBondingCurveKey = (bondingCurveAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const bondingCurveData = yield getPumpCurveState(bondingCurveAddress);
    const pumpCurvePrice = calculatePumpCurvePrice(bondingCurveData);
    const marketCap = pumpCurvePrice * 10 ** 9;
    const liquidity = (Number(bondingCurveData.realSolReserves) * 2) / web3_js_1.LAMPORTS_PER_SOL;
    const solPrice = yield (0, exports.getSolPrice)();
    const bondingProgress = ((marketCap * solPrice) / 690) * 2;
    return { pumpCurvePrice, marketCap, liquidity, bondingProgress };
});
exports.getPumpCurveDataByBondingCurveKey = getPumpCurveDataByBondingCurveKey;
const saveNewPumpToken = (coinData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const mcData: ITokenMC = await getPumpCurveDataByBondingCurveKey(
        //   coinData.bonding_curve_key as string
        // );
        // const newCoinData: IPumpToken = { ...coinData, mc_data: mcData };
        const newCoinData = Object.assign({}, coinData);
        const newCoin = new pumptoken_1.default(newCoinData);
        newCoin.save();
    }
    catch (error) {
        console.log(error);
    }
});
exports.saveNewPumpToken = saveNewPumpToken;
const getTokenDetails = (mintAddress) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newAddress = (0, graphql_1.getPairAddress)(mintAddress);
        const bondingCurveAddress = newAddress.toString();
        const bondingCurveData = yield getPumpCurveState(bondingCurveAddress);
        let holders = yield (0, graphql_1.bullxGraphql)("holders", mintAddress);
        const tokenInfo = yield (0, graphql_1.bullxGraphql)("tokeninfo", mintAddress);
        const tradeInfo = yield (0, graphql_1.bullxGraphql)("trade", mintAddress);
        const ohlcData = yield (0, graphql_1.bullxGraphql)("ohlc", mintAddress);
        const ohlc = [];
        for (let ind in ohlcData.t) {
            const ohlcObj = {
                o: ohlcData.o[ind],
                h: ohlcData.h[ind],
                l: ohlcData.l[ind],
                c: ohlcData.c[ind],
                t: ohlcData.t[ind],
                v: ohlcData.v[ind],
            };
            ohlc.push(ohlcObj);
        }
        if (holders.length > 10) {
            holders = holders.slice(0, 9);
        }
        for (let i = 0; i < holders.length; i++) {
            const firstNumber = new bignumber_js_1.default(holders[i].currentlyHoldingAmount);
            const toNumber = new bignumber_js_1.default(bondingCurveData.tokenTotalSupply);
            holders[i] = Object.assign({ percentage: (0, solana_1.formatNumber)(firstNumber.dividedBy(toNumber).multipliedBy(100).toNumber()) }, holders[i]);
        }
        const data = Object.assign(Object.assign({ bondingCurve: bondingCurveData.complete, raydium: !bondingCurveData.complete }, tokenInfo.data[mintAddress]), { holders, transactions: tradeInfo.tradeHistory, ohlc });
        return data;
    }
    catch (error) {
        console.log("error :>> ", error);
        return null;
    }
});
exports.getTokenDetails = getTokenDetails;
