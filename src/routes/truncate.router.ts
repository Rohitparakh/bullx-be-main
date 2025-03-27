import Router from "express";
import {truncateTokens, truncateTrades, truncateUsers} from "../controller/truncate.controller";

const router = Router();

router.get("/tokens", truncateTokens);
router.get("/trades", truncateTrades);
router.get("/users", truncateUsers);

export default router;
