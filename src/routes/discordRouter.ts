import routerx from "express-promise-router";
import { discordLogin } from "../controller/discord.controller"
import Router from "express";
import express from "express";

// const userRouter = routerx();
const discordRouter = express.Router();

discordRouter.get("/auth/discord/callback",discordLogin);
// discordRouter.post("/set/balance", setBalance);
export default discordRouter;