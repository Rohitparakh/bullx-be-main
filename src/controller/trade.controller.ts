import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import User, { UserData } from "../model/user";
import { getSolPrice, getTokenDetails } from "../utils/pump";
import { sell, buy, priceFetchUSD } from "../utils/trade";
import Token, { TokenData } from "../model/token";
import Trade, { TradeData } from "../model/trade";
import * as LRU from 'lru-cache';
import pLimit from 'p-limit';

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

// === In-Memory Caches ===
const tokenDetailCache = new Map<string, any>();
const priceCache = new Map<string, number>();
const solPriceCache = new Map<string, number>();


// === Cached Wrappers ===
async function getTokenDetailsCached(mint: string) {
  if (tokenDetailCache.has(mint)) return tokenDetailCache.get(mint);
  const data = await getTokenDetails(mint);
  tokenDetailCache.set(mint, data);
  return data;
}

async function priceFetchUSDCached(mint: string) {
  if (priceCache.has(mint)) return priceCache.get(mint);
  const price = await priceFetchUSD(mint)||0;
  priceCache.set(mint, price);
  return price;
}

async function getSolPriceCached() {
  if (solPriceCache.has('sol')) return solPriceCache.get('sol');
  const price = await getSolPrice();
  solPriceCache.set('sol', price);
  return price;
}

export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.time('walletTokens');
    const { id } = req.body;

    const [user, tokens, trade, solPrice] = await Promise.all([
      User.findOne({ id }).lean(),
      Token.find({ id }).lean(),
      Trade.find({ id }).lean(),
      getSolPriceCached(),
    ]);

    if (!user) {
      res.status(404).json({ success: false, msg: 'User not found' });
      return;
    }

    let solBalance = user.solBalance ?? 0;
    let totalValue = 0;
    if(solPrice){totalValue = solBalance * solPrice;}
    const tokenList = [];

    const mintSet = new Set(tokens.map((t:any) => t.mint));
    const mintArray = Array.from(mintSet);

    const limit = pLimit(5); // max 5 concurrent calls

    // Fetch Token Details and Prices with caching + throttling
    console.time('getTokenDetails+Prices');

    const [tokenDetailsMap, usdPricesMap] = await Promise.all([
      Promise.all(
        mintArray.map((mint:any) =>
          limit(async () => {
            try {
              const data = await getTokenDetailsCached(mint);
              return { mint, data };
            } catch {
              return { mint, data: null };
            }
          })
        )
      ),
      Promise.all(
        mintArray.map((mint:any) =>
          limit(async () => {
            try {
              const price = await priceFetchUSDCached(mint);
              return { mint, price };
            } catch {
              return { mint, price: null };
            }
          })
        )
      ),
    ]);

    console.timeEnd('getTokenDetails+Prices');

    const detailsByMint = Object.fromEntries(tokenDetailsMap.map((d) => [d.mint, d.data]));
    const usdPriceByMint = Object.fromEntries(usdPricesMap.map((p) => [p.mint, p.price]));

    // Process token data
    console.time('processTokens');

    const processedTokens = await Promise.all(
      tokens.map(async (token:any) => {
        const tokenData = detailsByMint[token.mint];
        if (!tokenData) return null;

        const pools = Object.values(tokenData.liquidityPools || {});
        const firstPool = pools[0] as any;

        let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
        const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;

        if (tokenPriceSOL > altPriceSOL) {
          const tokenPriceUSD = usdPriceByMint[token.mint];
          if (tokenPriceUSD !== null && solPrice && solPrice>= 0) {
            tokenPriceSOL = tokenPriceUSD / solPrice;
          } else {
            return null;
          }
        }
        let tokenPrice=0;
        if(solPrice)tokenPrice = tokenPriceSOL * solPrice;
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

    console.timeEnd('processTokens');

    tokenList.push(...processedTokens.filter(Boolean));

    console.timeEnd('walletTokens');

    res.status(200).json({
      success: true,
      data: {
        solBalance,
        totalValue,
        solPrice,
        tokenList,
        tradeHistory: trade,
      },
    });
  } catch (error) {
    console.error('Error fetching wallet tokens:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// export const walletTokens = expressAsyncHandler(async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { id } = req.body;

//     const [user, tokens, trade, solPrice] = await Promise.all([
//       User.findOne({ id }).lean(),
//       Token.find({ id }).lean(),
//       Trade.find({ id }).lean(),
//       getSolPrice(), // Should be cached
//     ]);

//     if (!user) {
//       res.status(404).json({ success: false, msg: "User not found" });
//       return;
//     }

//     let solBalance = user.solBalance ?? 0;
//     let totalValue = solBalance * solPrice;
//     const tokenList = [];

//     // === Cache Results for getTokenDetails & priceFetchUSD ===
//     const mintSet = new Set(tokens.map(t => t.mint));
//     const mintArray = Array.from(mintSet);

//     const [tokenDetailsMap, usdPricesMap] = await Promise.all([
//       Promise.all(mintArray.map(async (mint) => {
//         try {
//           const data = await getTokenDetails(mint);
//           return { mint, data };
//         } catch {
//           return { mint, data: null };
//         }
//       })),
//       Promise.all(mintArray.map(async (mint) => {
//         try {
//           const price = await priceFetchUSD(mint);
//           return { mint, price };
//         } catch {
//           return { mint, price: null };
//         }
//       }))
//     ]);

//     const detailsByMint = Object.fromEntries(tokenDetailsMap.map(d => [d.mint, d.data]));
//     const usdPriceByMint = Object.fromEntries(usdPricesMap.map(p => [p.mint, p.price]));

//     // === Process Tokens in Parallel ===
//     const processedTokens = await Promise.all(
//       tokens.map(async (token) => {
//         const tokenData = detailsByMint[token.mint];
//         if (!tokenData) return null;

//         const pools = Object.values(tokenData.liquidityPools || {});
//         const firstPool = pools[0] as any;

//         let tokenPriceSOL = firstPool?.protocolData?.price0 ?? 0;
//         const altPriceSOL = firstPool?.protocolData?.price1 ?? 0;

//         if (tokenPriceSOL > altPriceSOL) {
//           const tokenPriceUSD = usdPriceByMint[token.mint];
//           if (tokenPriceUSD !== null && solPrice !== 0) {
//             tokenPriceSOL = tokenPriceUSD / solPrice;
//           } else {
//             return null;
//           }
//         }

//         let tokenPrice = tokenPriceSOL * solPrice;
//         if (!tokenPrice || isNaN(tokenPrice)) {
//           tokenPrice = usdPriceByMint[token.mint] ?? 0;
//         }

//         totalValue += tokenPrice * token.amount;

//         return {
//           name: token.name,
//           symbol: token.symbol,
//           mint: token.mint,
//           amount: token.amount,
//           invested: token.invested,
//           sold: token.sold,
//           price: tokenPrice,
//         };
//       })
//     );

//     tokenList.push(...processedTokens.filter(Boolean));

//     res.status(200).json({
//       success: true,
//       data: { solBalance, totalValue, solPrice, tokenList, tradeHistory: trade },
//     });
//   } catch (error) {
//     console.error("Error fetching wallet tokens:", error);
//     res.status(500).json({ success: false, msg: "Server error" });
//   }
// });
