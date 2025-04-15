import routerx from "express-promise-router";
import { setBalance } from "../controller/user.contoller"
import express from "express";

// const userRouter = routerx();
const userRouter = express.Router();

// userRouter.post("/",userRegist);
userRouter.post("/set/balance", setBalance);
export default userRouter;