"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trade_controller_1 = require("../controller/trade.controller");
const pump_1 = require("../utils/pump");
const pump_2 = require("../utils/pump");
const router = (0, express_1.Router)();
router.post("/trade", trade_controller_1.trade);
router.post("/wallet", trade_controller_1.walletTokens);
router.get("/price/:mint", trade_controller_1.priceFetchinUSD);
router.get("/raydium/:mint", pump_1.fetchBondingCurve);
router.get("/tokenData/:mint", pump_2.fetchTokenData);
exports.default = router;
