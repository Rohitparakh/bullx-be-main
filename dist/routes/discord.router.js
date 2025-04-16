"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_controller_1 = require("../controller/discord.controller");
const express_1 = __importDefault(require("express"));
// const userRouter = routerx();
const discordRouter = express_1.default.Router();
discordRouter.get("/auth/discord/callback", discord_controller_1.discordLogin);
// discordRouter.get("/auth/discord/callback", (req, res, next) => {
//     console.log("Hit /auth/discord/callback route");
//     return discordLogin(req, res, next);
//   });
// discordRouter.post("/set/balance", setBalance);
exports.default = discordRouter;
