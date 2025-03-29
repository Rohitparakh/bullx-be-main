import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import User, { UserData } from "../model/user";
import { getSolPrice, getTokenDetails } from "../utils/pump";
import { sell, buy, priceFetchUSD } from "../utils/trade";
import Token, { TokenData } from "../model/token";
import Trade, { TradeData } from "../model/trade";

export const priceFetchinUSD = expressAsyncHandler(
  async (req: Request, res: Response) => {
    // const { mint, amount, prvKey, isBuy } = req.body;
    const{ mint } = req.params;
    
    let result: any;
    let priceUSD = await priceFetchUSD(mint);
    // console.log("prrr ", priceUSD)
    if (Number(priceUSD)>0) {
      res.status(200).json({ success: true , data: { price: priceUSD}});
    } else {
      res.status(500).json({ success: false, msg: "Error Fetching Price" });
    }
  }
);

export const trade = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { mint, amount, prvKey, isBuy } = req.body;

    let result: any;
    if (!isBuy) {
      result = await sell(mint, amount, prvKey);
    } else {
      result = await buy(mint, amount, prvKey);
    }
    if (result.success) {
      res.status(200).json({ success: result.success });
    } else {
      res.status(500).json({ success: result.success, msg: result.msg });
    }
  }
);

export const walletTokens = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { prvKey } = req.body;
    const user = await User.findOne({ prvKey: prvKey });
    const tokens: TokenData[] = await Token.find({ prvKey: prvKey });
    const trade: TradeData[] = await Trade.find({ prvKey: prvKey });
    console.log("User: ", user)
    console.log("Tokens: ", tokens)
    console.log("Trade: ", trade)
    const solBalance = user?.solBalance ?? 0; // Ensure solBalance is always a number
    const solPrice = await getSolPrice(); // Fetch Solana price in USD
    // console.log(solBalance,"sol bal")
    // console.log(solPrice)
    let totalValue = solBalance * solPrice; // Convert SOL balance to USD
    const tokenList = [];

    if(tokens.length>0){
    for (const token of tokens) {
      try {
        const tokenData = await getTokenDetails(token.mint);
        const liquidityPools: any = Object.values(tokenData.liquidityPools);

        // Get token price in SOL
        let tokenPriceSOL: number = liquidityPools[0].protocolData.price0;    
        
        if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
          let tokenPriceUSD: number | null = await priceFetchUSD(token.mint);
          // console.log("Token Price USD:", tokenPriceUSD);
        
          if (tokenPriceUSD !== null && solPrice !== 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
          } else {
            console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
            res.status(500).json({ success: false, msg: "Error fetching token price" });
            return;
          }
        }
        // Convert token price to USD
        let tokenPrice = tokenPriceSOL * solPrice;
        // If tokenPrice is 0, fetch price in USD
        if (!tokenPrice || Number.isNaN(tokenPrice)) {
          const fetchedPrice = await priceFetchUSD(token.mint);
          tokenPrice = fetchedPrice ?? 0; // Ensure it's a number
        }
        // Add token's USD value to totalValue
        totalValue += tokenPrice * token.amount;

        tokenList.push({
          name: token.name,
          symbol: token.symbol,
          mint: token.mint,
          amount: token.amount,
          invested: token.invested,
          sold: token.sold,
          price: tokenPrice,
        });
      } catch (error) {
        console.error("Error fetching token details:", error);
      }
    }
  }

    res.status(200).json({
      success: true,
      data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
    });
  }
);


