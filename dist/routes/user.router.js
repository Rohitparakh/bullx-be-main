"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_promise_router_1 = __importDefault(require("express-promise-router"));
const user_contoller_1 = require("../controller/user.contoller");
const userRouter = (0, express_promise_router_1.default)();
userRouter.post("/", user_contoller_1.userRegist);
exports.default = userRouter;
