"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const graphql_1 = require("./graphql");
const crypto_1 = require("crypto");
const fetchKeyApi = async (challenge) => {
    try {
        const response = await axios_1.default.get(`https://d2gndqco47nwa6.cloudfront.net?challenge=${encodeURIComponent(challenge)}`);
        return response.data;
    }
    catch (error) {
        console.error("Failed to fetch key:", error);
        return null;
    }
};
const getJwtToken = async () => {
    if (graphql_1.jwtTokenCache.jwtToken &&
        Date.now() - graphql_1.jwtTokenCache.updatedAt < graphql_1.jwtTokenCache.updateTimer) {
        return graphql_1.jwtTokenCache.jwtToken;
    }
    const challenge = (0, crypto_1.createHash)("sha256")
        .update((Math.floor(Date.now() / 1e3) -
        (Math.floor(Date.now() / 1e3) % 300)).toString())
        .digest("base64");
    try {
        const fetchedKey = await fetchKeyApi(challenge);
        if (!fetchedKey || fetchedKey.includes("Failed challenge")) {
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            return await getJwtToken();
        }
        graphql_1.jwtTokenCache.jwtToken = fetchedKey;
    }
    catch (error) { }
    graphql_1.jwtTokenCache.updatedAt = Date.now();
    console.log("🚀 ~ fetched ~ token for defined.fi");
    return graphql_1.jwtTokenCache.jwtToken;
};
