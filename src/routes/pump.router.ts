import Router from "express";
import {
  getPumpVision,
  getTrendingTokens,
  getTokenDetails,
  getTokenList,
  getTokenImage
} from "../controller/pump.controller";
// import { getTokenDetails } from "../utils/pump";



const router = Router();

router.get("/trending", getTrendingTokens);
router.get("/recent/new-tokens", getTokenList);
router.get("/pumpVision", getPumpVision);
router.get("/token", getTokenDetails);
router.get("/tokenImage", getTokenImage);

export default router;
