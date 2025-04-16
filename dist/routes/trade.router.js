"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trade_controller_1 = require("../controller/trade.controller");
const pump_1 = require("../utils/pump");
const pump_2 = require("../utils/pump");
const discord_controller_1 = require("../controller/discord.controller");
const router = express_1.default.Router();
router.post("/trade", trade_controller_1.trade);
router.post("/wallet", trade_controller_1.walletTokens);
router.get("/price/:mint", trade_controller_1.priceFetchinUSD);
router.get("/raydium/:mint", pump_1.fetchBondingCurve);
router.get("/tokenData/:mint", pump_2.fetchTokenData);
router.get("/auth/discord/callback", discord_controller_1.discordLogin);
exports.default = router;
