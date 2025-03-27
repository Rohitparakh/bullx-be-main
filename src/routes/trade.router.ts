import { Router } from "express";
import { trade, walletTokens, priceFetchinUSD } from "../controller/trade.controller";
import { fetchBondingCurve } from "../utils/pump";
import { fetchTokenData } from "../utils/pump";

const router = Router();

router.post("/trade", trade);
router.post("/wallet", walletTokens);
router.get("/price/:mint",priceFetchinUSD);
router.get("/raydium/:mint", fetchBondingCurve);
router.get("/tokenData/:mint", fetchTokenData);

export default router;
