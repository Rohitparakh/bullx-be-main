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
Object.defineProperty(exports, "__esModule", { value: true });
exports.bullxGraphql = exports.generateFilterBullXBody = exports.generatePumpVisionBullXBody = exports.generateBullXBody = exports.generateBullXHeaders = exports.getAuthToken = exports.getPairAddress = exports.jwtTokenCache = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.jwtTokenCache = {
    authToken: "",
    jwtToken: "",
    updatedAt: 0,
    updateTimer: 24e4,
};
const networkId = 1399811149;
const API_URL = "https://graph.codex.io/graphql";
const TRADE_PROGRAM_ID = new web3_js_1.PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
const BONDING_ADDR_SEED = new Uint8Array([
    98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101,
]);
const getPairAddress = (mintAddress) => {
    const tokenMint = new web3_js_1.PublicKey(mintAddress);
    // get the address of bonding curve and associated bonding curve
    const [bonding] = web3_js_1.PublicKey.findProgramAddressSync([BONDING_ADDR_SEED, tokenMint.toBuffer()], TRADE_PROGRAM_ID);
    return bonding;
};
exports.getPairAddress = getPairAddress;
const getAuthToken = () => __awaiter(void 0, void 0, void 0, function* () {
    const resp = yield fetch("https://securetoken.googleapis.com/v1/token?key=AIzaSyCdU8BxOul-NOOJ-e-eCf_-5QCz8ULqIPg", {
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded",
            priority: "u=1, i",
            "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "x-client-data": "CLK1yQEIlbbJAQiktskBCKmdygEIr4/LAQiTocsBCJv+zAEIhaDNAQjbws4BCMrEzgEIk8bOARj1yc0B",
            "x-client-version": "Chrome/JsCore/10.12.2/FirebaseCore-web",
            "x-firebase-gmpid": "1:82013512367:web:8b085e7c341587f3d56a5a",
            Referer: "https://bullx.io/",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: "grant_type=refresh_token&refresh_token=AMf-vBwzm0pxdBPSV-C3LLUaurFtBHyYrSL9uZQh6tq_8z7N071OfL2dXLnYdlZ4sHcGo7mPY2-QFNXZublp4c9N8BomisVZFUEkJz-dnp8f14669FLO8JyFN-RM5GovK8YTLCQkvR90x1cJvY8sfvgOuCVsuKc9SbsaoLRc9CLSLkGC20CencD6t4pRUcGzUg6-aYg6fgtlT60oO034z4UEcPufJ0lOWcuBaRikR7n8F5k-b7XDuCw",
        method: "POST",
    });
    const data = yield resp.json();
    return data;
});
exports.getAuthToken = getAuthToken;
const getJwtToken = () => __awaiter(void 0, void 0, void 0, function* () {
    if (exports.jwtTokenCache.jwtToken &&
        Date.now() - exports.jwtTokenCache.updatedAt < exports.jwtTokenCache.updateTimer) {
        return exports.jwtTokenCache.jwtToken;
    }
    const fetchedAuthToken = yield (0, exports.getAuthToken)();
    exports.jwtTokenCache.authToken = fetchedAuthToken.access_token;
    exports.jwtTokenCache.updatedAt = Date.now();
    console.log("🚀 ~ fetched ~ access_token for bullx");
    return exports.jwtTokenCache.jwtToken;
});
const jwtTokenGeneration = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield getJwtToken();
        setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            yield getJwtToken();
        }), exports.jwtTokenCache.updateTimer);
    }
    catch (error) {
        console.log("error :>> ", error);
    }
});
jwtTokenGeneration();
// BullX API
const generateBullXHeaders = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!exports.jwtTokenCache.authToken) {
        yield getJwtToken();
    }
    return {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        authorization: `Bearer ${exports.jwtTokenCache.authToken}`,
        "content-type": "text/plain",
        priority: "u=1, i",
        "sec-ch-ua": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Referer: "https://bullx.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    };
});
exports.generateBullXHeaders = generateBullXHeaders;
const generateBullXBody = (apiType, mintAddress) => {
    let body = "";
    switch (apiType) {
        case "tokeninfo":
            body = `{\"name\":\"resolveTokens\",\"data\":{\"addresses\":[\"${mintAddress}\"],\"chainId\":${networkId}}}`;
            break;
        case "holders":
            body = `{\"name\":\"holdersSummary\",\"data\":{\"tokenAddress\":\"${mintAddress}\",\"sortBy\":\"balance\",\"chainId\":${networkId}}}`;
            break;
        case "trade":
            body = `{\"name\":\"tradeHistory\",\"data\":{\"baseTokenAddress\":\"${mintAddress}\",\"quoteTokenAddress\":\"So11111111111111111111111111111111111111112\",\"fetchTokensMetadata\":false,\"chainId\":${networkId}}}`;
            break;
        case "ohlc":
            const to = Math.floor(new Date().getTime() / 1000);
            const from = to - 500;
            body = `{"name":"chart","data":{"chainId":${networkId},"base":"${mintAddress}","quote":"So11111111111111111111111111111111111111112","from":${from},"to":${to},"intervalSecs":1,"countBack":329}}`;
            break;
        default:
            break;
    }
    return body;
};
exports.generateBullXBody = generateBullXBody;
const generatePumpVisionBullXBody = (graduateStatus) => {
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let bodyString = `
      {
        "name": "getNewPairs",
        "data": {
          "poolCreationBlockTimestamp": ${timestamp},
          "filters": {
            "Top 10 Holders": false,
            "With at least 1 social": false,
            "B.Curve %": { "percentage": true },
            "Dev holding %": { "percentage": true },
            "Holders": {},
            "Liquidity": { "dollar": true },
            "Volume": { "dollar": true },
            "Market Cap": { "dollar": true },
            "Txns": {},
            "Buys": {},
            "Sells": {},
            "Token Age (mins)": {},
            "pumpFunEnabled": true,
            "moonshotTokenEnabled": true
          }
        }
      }
  `;
    let jsonBody = JSON.parse(bodyString);
    jsonBody.data["chainIds"] = [1399811149, 56, 42161, 81457, 8453];
    if (graduateStatus == 2) {
        jsonBody.data.filters["isAboutToGraduate"] = true;
    }
    else if (graduateStatus == 1) {
        jsonBody.data.filters["isGraduated"] = true;
    }
    bodyString = JSON.stringify(jsonBody);
    return bodyString;
};
exports.generatePumpVisionBullXBody = generatePumpVisionBullXBody;
const generateFilterBullXBody = ({ mintAuthDisabled = false, freezeAuthDisabled = false, lpBurned = false, topTenHolders = false, social = false, volume = null, liquidity = null, marketcap = null, txns = null, buys = null, sells = null, }) => {
    let timestamp = Math.floor(new Date().getTime() / 1000);
    let bodyString = `{"name":"getNewPairs",
                    "data":{"chainIds":[${networkId}],
                    "poolCreationBlockTimestamp":${timestamp},
                    "filters":{
                      "Mint Auth Disabled":${mintAuthDisabled},
                      "Freeze Auth Disabled":${freezeAuthDisabled},
                      "LP Burned":${lpBurned},
                      "Top 10 Holders":${topTenHolders},
                      "With at least 1 social":${social},
                      "Liquidity":{"dollar":true},
                      "Volume":{"dollar":true, "min":80,"max":100},
                      "Market Cap":{"dollar":true},
                      "Txns":{},
                      "Buys":{},
                      "Sells":{}
                      }
                    }
                  }`;
    let jsonBody = JSON.parse(bodyString);
    if (volume && volume.min && volume.max) {
        jsonBody.data.filters["Volume"].min = volume.min;
        jsonBody.data.filters["Volume"].max = volume.max;
    }
    if (liquidity && liquidity.min && liquidity.max) {
        jsonBody.data.filters["Liquidity"].min = liquidity.min;
        jsonBody.data.filters["Liquidity"].max = liquidity.max;
    }
    if (marketcap && marketcap.min && marketcap.max) {
        jsonBody.data.filters["Market Cap"].min = marketcap.min;
        jsonBody.data.filters["Market Cap"].max = marketcap.max;
    }
    if (txns && txns.min && txns.max) {
        jsonBody.data.filters["Txns"].min = txns.min;
        jsonBody.data.filters["Txns"].max = txns.max;
    }
    if (buys && buys.min && buys.max) {
        jsonBody.data.filters["Buys"].min = buys.min;
        jsonBody.data.filters["Buys"].max = buys.max;
    }
    if (sells && sells.min && sells.max) {
        jsonBody.data.filters["Sells"].min = sells.min;
        jsonBody.data.filters["Sells"].max = sells.max;
    }
    bodyString = JSON.stringify(jsonBody);
    return bodyString;
};
exports.generateFilterBullXBody = generateFilterBullXBody;
const bullxGraphql = (apiType, mintAddress, filters, graduateStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const headers = yield (0, exports.generateBullXHeaders)();
    let body = "";
    if (apiType === "tokens" && filters) {
        body = (0, exports.generateFilterBullXBody)(filters);
    }
    else if (graduateStatus) {
        body = (0, exports.generatePumpVisionBullXBody)(graduateStatus);
    }
    else {
        body = (0, exports.generateBullXBody)(apiType, mintAddress);
    }
    const endpoint = apiType === "ohlc"
        ? "https://api-edge.bullx.io/chart"
        : "https://api-edge.bullx.io/api";
    const resp = yield fetch(endpoint, {
        headers,
        body,
        method: "POST",
    });
    console.log("endpoint:", endpoint);
    console.log("status:", graduateStatus);
    console.log("header:", headers);
    console.log("body:", body);
    const jsonData = yield resp.json();
    console.log("response:", jsonData);
    return jsonData;
});
exports.bullxGraphql = bullxGraphql;
