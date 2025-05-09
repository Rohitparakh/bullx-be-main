"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetadata = exports.getPriceFromDexscreener = exports.verifySignature = exports.validateEd25519Address = exports.connection = void 0;
exports.formatNumber = formatNumber;
const tweetnacl_1 = require("tweetnacl");
const bs58_1 = __importDefault(require("bs58"));
const config_1 = require("../config");
const js_1 = require("@metaplex-foundation/js");
const web3_js_1 = require("@solana/web3.js");
require("dotenv/config");
exports.connection = new web3_js_1.Connection(config_1.RPC_ENDPOINT, "confirmed");
const validateEd25519Address = (address) => {
    try {
        const isValidAddress = web3_js_1.PublicKey.isOnCurve(address);
        if (isValidAddress)
            return true;
        else
            return false;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};
exports.validateEd25519Address = validateEd25519Address;
const verifySignature = (address, nonce, signature) => {
    try {
        const message = `${config_1.SIGN_MESSAGE} : ${nonce}`;
        return tweetnacl_1.sign.detached.verify(new TextEncoder().encode(message), bs58_1.default.decode(signature), bs58_1.default.decode(address));
    }
    catch (e) {
        console.error(e);
        return false;
    }
};
exports.verifySignature = verifySignature;
const getPriceFromDexscreener = async (pubKey) => {
    try {
        const response = await fetch("https://api.dexscreener.io/latest/dex/tokens/" + pubKey);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
            const price = parseFloat(data.pairs[0].priceUsd);
            return isNaN(price) ? null : price;
        }
        else {
            throw new Error("No pairs data found");
        }
    }
    catch (error) {
        console.error("Failed to fetch price:", error);
        return null;
    }
};
exports.getPriceFromDexscreener = getPriceFromDexscreener;
/**
 * Get metadata of SPL token
 * @param {string} pubKey
 * @returns
 */
const getMetadata = async (pubKey) => {
    const metaplex = js_1.Metaplex.make(exports.connection);
    const mintAddress = new web3_js_1.PublicKey(pubKey);
    const metadata = await metaplex
        .nfts()
        .findByMint({ mintAddress: mintAddress });
    return metadata;
};
exports.getMetadata = getMetadata;
function formatNumber(num) {
    if (num > 1) {
        return num.toFixed(2);
    }
    else if (num >= 0.5 && num <= 1) {
        return num.toFixed(4);
    }
    else {
        return num.toFixed(5);
    }
}
