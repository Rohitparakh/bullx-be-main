"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_contoller_1 = require("../controller/user.contoller");
const express_1 = __importDefault(require("express"));
// const userRouter = routerx();
const userRouter = (0, express_1.default)();
userRouter.post("/", user_contoller_1.userRegist);
userRouter.post("/set/balance", user_contoller_1.setBalance);
exports.default = userRouter;
