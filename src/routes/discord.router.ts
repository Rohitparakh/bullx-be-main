import { discordLogin } from "../controller/discord.controller"
import express from "express";

// const userRouter = routerx();
const discordRouter = express.Router();

discordRouter.get("/auth/discord/callback",discordLogin);
// discordRouter.get("/auth/discord/callback", (req, res, next) => {
//     console.log("Hit /auth/discord/callback route");
//     return discordLogin(req, res, next);
//   });
  
// discordRouter.post("/set/balance", setBalance);
export default discordRouter;