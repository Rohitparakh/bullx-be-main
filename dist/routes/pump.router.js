"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pump_controller_1 = require("../controller/pump.controller");
// import { getTokenDetails } from "../utils/pump";
const router = (0, express_1.default)();
router.get("/trending", pump_controller_1.getTrendingTokens);
router.get("/recent/new-tokens", pump_controller_1.getTokenList);
router.get("/pumpVision", pump_controller_1.getPumpVision);
router.get("/token", pump_controller_1.getTokenDetails);
router.get("/tokenImage", pump_controller_1.getTokenImage);
exports.default = router;
