"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const truncate_controller_1 = require("../controller/truncate.controller");
const router = (0, express_1.default)();
router.get("/tokens", truncate_controller_1.truncateTokens);
router.get("/trades", truncate_controller_1.truncateTrades);
router.get("/users", truncate_controller_1.truncateUsers);
exports.default = router;
