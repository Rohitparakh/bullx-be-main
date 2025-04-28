"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateUsers = exports.truncateTrades = exports.truncateTokens = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const token_1 = __importDefault(require("../model/token"));
const trade_1 = __importDefault(require("../model/trade"));
const user_1 = __importDefault(require("../model/user"));
exports.truncateTokens = (0, express_async_handler_1.default)(async (req, res) => {
    const { prvKey, code } = req.body;
    const token = await token_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { token },
    });
});
exports.truncateTrades = (0, express_async_handler_1.default)(async (req, res) => {
    const { prvKey, code } = req.body;
    const trade = await trade_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { trade },
    });
});
exports.truncateUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const { prvKey, code } = req.body;
    const user = await user_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { user },
    });
});
