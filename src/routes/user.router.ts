import routerx from "express-promise-router";
import { setBalance } from "../controller/user.contoller"
import Router from "express";

// const userRouter = routerx();
const userRouter = Router();

// userRouter.post("/",userRegist);
userRouter.post("/set/balance", setBalance);
export default userRouter;