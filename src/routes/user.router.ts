import routerx from "express-promise-router";
import { userRegist, setBalance } from "../controller/user.contoller"

const userRouter = routerx();

userRouter.post("/",userRegist);
userRouter.post("/set/balance", setBalance);
export default userRouter;