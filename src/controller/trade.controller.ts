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
    const { mint, amount, id, isBuy } = req.body;

    let result: any;
    if (!isBuy) {
      result = await sell(mint, amount, id);
    } else {
      result = await buy(mint, amount, id);
    }
    if (result.success) {
      res.status(200).json({ success: result.success });
    } else {
      res.status(500).json({ success: result.success, msg: result.msg });
    }
  }
);

export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;

    const [user, tokens, trade, solPrice] = await Promise.all([
      User.findOne({ id }).lean(),
      Token.find({ id }).lean(),
      Trade.find({ id }).lean(),
      getSolPrice(), // Should be cached
    ]);

    if (!user) {
      res.status(404).json({ success: false, msg: "User not found" });
      return;
    }

    let solBalance = user.solBalance ?? 0;
    let totalValue = solBalance * solPrice;
    const tokenList = [];

    // === Cache Results for getTokenDetails & priceFetchUSD ===
    const mintSet = new Set(tokens.map(t => t.mint));
    const mintArray = Array.from(mintSet);

    const [tokenDetailsMap, usdPricesMap] = await Promise.all([
      Promise.all(mintArray.map(async (mint) => {
        try {
          const data = await getTokenDetails(mint);
          return { mint, data };
        } catch {
          return { mint, data: null };
        }
      })),
      Promise.all(mintArray.map(async (mint) => {
        try {
          const price = await priceFetchUSD(mint);
          return { mint, price };
        } catch {
          return { mint, price: null };
        }
      }))
    ]);

    const detailsByMint = Object.fromEntries(tokenDetailsMap.map(d => [d.mint, d.data]));
    const usdPriceByMint = Object.fromEntries(usdPricesMap.map(p => [p.mint, p.price]));

    // === Process Tokens in Parallel ===
    const processedTokens = await Promise.all(
      tokens.map(async (token) => {
        const tokenData = detailsByMint[token.mint];
        if (!tokenData) return null;

        const pools = Object.values(tokenData.liquidityPools || {});
        const firstPool = pools[0] as any;

        let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
        const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;

        if (tokenPriceSOL > altPriceSOL) {
          const tokenPriceUSD = usdPriceByMint[token.mint];
          if (tokenPriceUSD !== null && solPrice !== 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
          } else {
            return null;
          }
        }

        let tokenPrice = tokenPriceSOL * solPrice;
        if (!tokenPrice || isNaN(tokenPrice)) {
          tokenPrice = usdPriceByMint[token.mint] ?? 0;
        }

        totalValue += tokenPrice * token.amount;

        return {
          name: token.name,
          symbol: token.symbol,
          mint: token.mint,
          amount: token.amount,
          invested: token.invested,
          sold: token.sold,
          price: tokenPrice,
        };
      })
    );

    tokenList.push(...processedTokens.filter(Boolean));

    res.status(200).json({
      success: true,
      data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
    });
  } catch (error) {
    console.error("Error fetching wallet tokens:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});


// export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.body;

//     const [user, tokens, trade, solPrice] = await Promise.all([
//       User.findOne({ id }).lean(),
//       Token.find({ id }).lean(),
//       Trade.find({ id }).lean(),
//       getSolPrice(), // Cached SOL price
//     ]);

//     if (!user) {
//       res.status(404).json({ success: false, msg: "User not found" });
//       return;
//     }

//     let solBalance = user.solBalance ?? 0;
//     let totalValue = solBalance * solPrice;
//     const tokenList = [];

//     if (tokens.length > 0) {
//       const tokenDetails = await Promise.all(
//         tokens.map(async (token) => {
//           try {
//             const tokenData = await getTokenDetails(token.mint);
//             const liquidityPools = Object.values(tokenData.liquidityPools);
//             const firstPool = liquidityPools[0] as any; // Ensure it’s an object

//             let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;

//             if (tokenPriceSOL > (firstPool?.protocolData?.price1 ?? 0)) {
//               const tokenPriceUSD = await priceFetchUSD(token.mint);
//               if (tokenPriceUSD !== null && solPrice !== 0) {
//                 tokenPriceSOL = tokenPriceUSD / solPrice;
//               } else {
//                 console.error(`Invalid token price: ${tokenPriceUSD}, SOL: ${solPrice}`);
//                 return null;
//               }
//             }

//             let tokenPrice = tokenPriceSOL * solPrice;
//             if (!tokenPrice || isNaN(tokenPrice)) {
//               tokenPrice = (await priceFetchUSD(token.mint)) ?? 0;
//             }

//             totalValue += tokenPrice * token.amount;

//             return {
//               name: token.name,
//               symbol: token.symbol,
//               mint: token.mint,
//               amount: token.amount,
//               invested: token.invested,
//               sold: token.sold,
//               price: tokenPrice,
//             };
//           } catch (error) {
//             console.error("Error fetching token details:", error);
//             return null; // Skip failed tokens
//           }
//         })
//       );

//       tokenList.push(...tokenDetails.filter(Boolean));
//     }

//     res.status(200).json({
//       success: true,
//       data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
//     });
//   } catch (error) {
//     console.error("Error fetching wallet tokens:", error);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// });


