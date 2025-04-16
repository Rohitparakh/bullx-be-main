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
exports.truncateUsers = exports.truncateTrades = exports.truncateTokens = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const token_1 = __importDefault(require("../model/token"));
const trade_1 = __importDefault(require("../model/trade"));
const user_1 = __importDefault(require("../model/user"));
exports.truncateTokens = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prvKey, code } = req.body;
    const token = yield token_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { token },
    });
}));
exports.truncateTrades = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prvKey, code } = req.body;
    const trade = yield trade_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { trade },
    });
}));
exports.truncateUsers = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prvKey, code } = req.body;
    const user = yield user_1.default.deleteMany({});
    res.status(200).json({
        success: true,
        data: { user },
    });
}));
