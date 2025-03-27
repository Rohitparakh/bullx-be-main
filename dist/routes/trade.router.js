"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trade_controller_1 = require("../controller/trade.controller");
const router = (0, express_1.Router)();
router.post("/trade", trade_controller_1.trade);
router.post("/wallet", trade_controller_1.walletTokens);
exports.default = router;
