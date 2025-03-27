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
exports.getTokenImage = exports.getPumpVision = exports.getTokenDetails = exports.getTokenList = exports.getNewTokenList = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const graphql_1 = require("../utils/graphql");
const pump_1 = require("../utils/pump");
const solana_1 = require("../utils/solana");
const newPumpTokens_1 = __importDefault(require("../model/pump/newPumpTokens"));
exports.getNewTokenList = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tokens = yield newPumpTokens_1.default.find({}).limit(100);
    res.status(200).json({ status: true, tokens });
}));
exports.getTokenList = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { newToken, status } = req.query;
        newToken = Boolean(newToken);
        let data = yield (0, graphql_1.bullxGraphql)("tokens", "", Object.assign(Object.assign({}, req.query), { volume: {
                min: Number(req.query.volumeMin),
                max: Number(req.query.volumeMax),
            }, liquidity: {
                min: Number(req.query.liquidityMin),
                max: Number(req.query.liquidityMax),
            }, marketcap: {
                min: Number(req.query.marketcapMin),
                max: Number(req.query.marketcapMax),
            }, txns: {
                min: Number(req.query.txnsMin),
                max: Number(req.query.txnsMax),
            }, buys: {
                min: Number(req.query.buysMin),
                max: Number(req.query.buysMax),
            }, sells: {
                min: Number(req.query.sellsMin),
                max: Number(req.query.sellsMax),
            } }));
        let newTokens = [...data.data], tokens = [];
        if (newToken) {
            const now = Math.floor(new Date().getTime() / 1000);
            for (let i = 0; i < newTokens.length; i++) {
                const oneDay = 24 * 3600;
                if (newTokens[i].creationTimestamp + oneDay < now)
                    continue;
                const tokenInfo = yield (0, graphql_1.bullxGraphql)("tokeninfo", newTokens[i].address);
                newTokens[i].tokenInfo = tokenInfo.data[newTokens[i].address];
                tokens.push(newTokens[i]);
            }
        }
        else {
            for (let i = 0; i < newTokens.length; i++) {
                const tokenInfo = yield (0, graphql_1.bullxGraphql)("tokeninfo", newTokens[i].address);
                const liquidity = yield (0, graphql_1.bullxGraphql)("liquidity", tokenInfo.name);
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
}));
exports.getTokenDetails = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Fetching token detail");
    const { mintAddress } = req.query;
    try {
        const newAddress = yield (0, graphql_1.getPairAddress)(mintAddress);
        const bondingCurveAddress = newAddress.toString();
        const bondingCurveData = yield (0, pump_1.getPumpCurveState)(bondingCurveAddress);
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
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.log("error :>> ", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
}));
exports.getPumpVision = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { status } = req.query;
        let graduateStatus = Number(status);
        console.log("here!@!---> ", req.query);
        let data = yield (0, graphql_1.bullxGraphql)("pumpVision", "", {}, graduateStatus);
        let newTokens = [...data.data], tokens = [];
        for (let i = 0; i < newTokens.length; i++) {
            //const tokenInfo = await bullxGraphql("tokeninfo", newTokens[i].address as string);
            //console.log(tokenInfo);
            console.log("added one logo");
        }
        tokens = newTokens;
        console.log("here");
        res.status(200).json({ success: true, tokens });
    }
    catch (error) {
        res.status(500).json({ success: false, tokens: [] });
    }
}));
exports.getTokenImage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { address } = req.query;
        const tokenInfo = yield (0, graphql_1.bullxGraphql)("tokeninfo", address);
        console.log("token Info:", tokenInfo.data[address].logo);
        res.status(200).json({ success: true, data: tokenInfo.data[address].logo });
    }
    catch (error) {
        res.status(500).json({ success: false });
    }
}));
