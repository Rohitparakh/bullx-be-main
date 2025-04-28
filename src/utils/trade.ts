import { getSolPrice, getTokenDetails } from "./pump";
import User, { UserData } from "../model/user";
import Token from "../model/token";
import Trade from "../model/trade";

export const sell = async (mint: string, amount: number, id: string) => {
  try {
    // Step 1: Fetch token details and SOL price in parallel
    const [tokenData, solPrice, user] = await Promise.all([
      getTokenDetails(mint),
      getSolPrice(),
      User.findOne({ id }),
    ]);

    if (!tokenData) return { success: false, msg: "No token detail" };
    if (!user) return { success: false, msg: "No user" };

    const liquidityPools: any[] = Object.values(tokenData.liquidityPools || {});
    if (liquidityPools.length === 0) return { success: false, msg: "No liquidity pool found" };

    let tokenPriceSOL = liquidityPools[0].protocolData?.price0;
    const altPriceSOL = liquidityPools[1]?.protocolData?.price0;

    // Step 2: Use USD price as fallback if price0 > price1
    if (tokenPriceSOL > altPriceSOL) {
      const tokenPriceUSD = await priceFetchUSD(mint);
      if (!tokenPriceUSD || solPrice === 0) {
        console.error(`Invalid token price, USD: ${tokenPriceUSD}, SOL: ${solPrice}`);
        return { success: false, msg: "Error fetching token price" };
      }
      tokenPriceSOL = tokenPriceUSD / solPrice;
    }

    const tokenPrice = tokenPriceSOL * solPrice;

    // Step 3: Validate balance
    const newSolBalance = user.solBalance + tokenPriceSOL * amount;
    if (newSolBalance < 0) return { success: false, msg: "Insufficient SOL balance" };

    // Step 4: Update token balance
    const token = await Token.findOne({ id, mint });
    if (!token) return { success: false, msg: "No token to sell" };

    const newTokenAmount = token.amount - amount;
    const sold = token.sold + amount * tokenPrice;

    if (newTokenAmount < 0) return { success: false, msg: "Insufficient token amount" };

    const [tokenUpdateRes, tradeSaveRes] = await Promise.all([
      Token.updateOne({ id, mint }, { amount: newTokenAmount, sold }),
      new Trade({
        id,
        mint,
        name: tokenData.name,
        symbol: tokenData.symbol,
        priceSol: amount * tokenPriceSOL,
        priceUsd: amount * tokenPrice,
        amount,
        tradeType: "SELL",
      }).save(),
    ]);

    // Step 5: Update user SOL balance
    await User.updateOne({ id }, { solBalance: newSolBalance });

    return { success: true };
  } catch (error) {
    console.error("Error in sell function:", error);
    return { success: false, msg: "Internal server error" };
  }
};

// export const sell = async (
//   mint: string,
//   amount: number,
//   id: string
// ) => {
//   const tokenData = await getTokenDetails(mint);
//   if (!tokenData) return { success: false, msg: "No token detail" };

//   const liquidityPools: any[] = Object.values(tokenData.liquidityPools);

//   let tokenPriceSOL: number = liquidityPools[0].protocolData.price0;
//   // tokenPriceSOL = !tokenPriceSOL ? liquidityPools[1].protocolData.price1 : tokenPriceSOL;
//   const solPrice = await getSolPrice();
//   if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
//     let tokenPriceUSD: number | null = await priceFetchUSD(mint);
//     // console.log("Token Price USD:", tokenPriceUSD);
  
//     if (tokenPriceUSD !== null && solPrice !== 0) {
//       tokenPriceSOL = tokenPriceUSD / solPrice;
//     } else {
//       console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
//       return { success: false, msg: "Error fetching token price" };
//     }
//   }
//   const tokenPrice = tokenPriceSOL * solPrice;

//   const { name, symbol }: { name: string; symbol: string } = tokenData;

//   let newSolBalance: number = 0;
//   const user: UserData | null = await User.findOne({ id: id });
//   if (user) {
//     const solBalance: number = user.solBalance;
//     newSolBalance = solBalance + tokenPriceSOL * amount;
//     if (newSolBalance < 0)
//       return { success: false, msg: "Insufficient Sol balance" };
//   } else {
//     return { success: false, msg: "No user" };
//   }

//   const token = await Token.findOne({ id: id, mint });
//   if (token) {
//     const tokenAmount = token.amount;
//     const newTokenAmount = Number(tokenAmount) - Number(amount);
//     const sold = token.sold + amount * tokenPrice;
//     if (newTokenAmount < 0)
//       return { success: false, msg: "Insufficient token" };
//     try {
//       await Token.updateOne(
//         { id: id, mint },
//         { amount: newTokenAmount, sold }
//       );
//     } catch (error) {
//       console.log(error);
//       return { success: false, msg: "Token update error" };
//     }
//   } else {
//     return { success: false, msg: "No token to sell" };
//   }



//   const newTrade = new Trade({
//     id: id,
//     mint,
//     name,
//     symbol,
//     priceSol: Number(amount) * Number(tokenPriceSOL),
//     priceUsd: Number(amount) * Number(tokenPriceSOL) * solPrice,
//     amount: amount,
//     tradeType: "SELL"    
//   });
//   try {
//     await newTrade.save();
//   } catch (error) {
//     console.log(error);
//     return { success: false, msg: `Saving trade error: ${error}` };
//   }



//   await User.updateOne({ id: id }, { solBalance: newSolBalance });
//   return { success: true };
// };

export const priceFetchUSD = async (address: string): Promise<number | null> => {
  const requestOptions = {
    method: "get",
    headers: {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MjM2Nzk3MDgxOTgsImVtYWlsIjoiZHJlYW15dGdib3RAZ21haWwuY29tIiwiYWN0aW9uIjoidG9rZW4tYXBpIiwiYXBpVmVyc2lvbiI6InYyIiwiaWF0IjoxNzIzNjc5NzA4fQ.qEG3q2DSX_i60f8eNhAZ_XEQgmbRHZmQPgY4_7RhZQU"
    }
  };

  // console.log("Fetching price for mint:", address);

  try {
    const response = await fetch(`https://pro-api.solscan.io/v2.0/token/price?address=${address}`, requestOptions);
    const jsonResponse = await response.json();

    if (jsonResponse.success && jsonResponse.data.length > 0) {
      const price = jsonResponse.data[jsonResponse.data.length-1].price;
      // console.log("Token Price USD:", price);
      return price;
    } else {
      console.error("Invalid API response format or no price data:", jsonResponse);
      return null;
    }
  } catch (error) {
    console.error("Error fetching token price:", error);
    return null;
  }
};

// export const buy = async (mint: string, amount: number, id: string) => {
//   const tokenData = await getTokenDetails(mint);
//   if (!tokenData) return { success: false, msg: "No token detail" };

//   const liquidityPools: any[] = Object.values(tokenData.liquidityPools);

//   let tokenPriceSOL: number = liquidityPools[0].protocolData.price0;
//   const solPrice = await getSolPrice();
//   let tokenPrice = tokenPriceSOL * solPrice;

//   if (
//     tokenPriceSOL > liquidityPools[0].protocolData.price1 ||
//     Number.isNaN(tokenPriceSOL)
//   ) {
//     const tokenPriceUSD = await priceFetchUSD(mint);
//     if (tokenPriceUSD !== null && solPrice !== 0) {
//       tokenPriceSOL = tokenPriceUSD / solPrice;
//       tokenPrice = tokenPriceUSD;
//     } else {
//       console.error(
//         `Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`
//       );
//       return { success: false, msg: "Error fetching token price" };
//     }
//   }

//   const { name, symbol }: { name: string; symbol: string } = tokenData;

//   const user: UserData | null = await User.findOne({ id: id });
//   if (!user) return { success: false, msg: "No user" };

//   const solBalance = user.solBalance;
//   const newSolBalance = solBalance - amount;
//   if (newSolBalance < 0)
//     return { success: false, msg: "Insufficient Sol balance" };

//   const token = await Token.findOne({ id: id, mint });
//   const tokenAmountToAdd = Number(amount) / Number(tokenPriceSOL);
//   let invested = amount * solPrice;

//   try {
//     if (token) {
//       const newTokenAmount = token.amount + tokenAmountToAdd;
//       invested += token.invested;
//       await Token.updateOne(
//         { id: id, mint },
//         { amount: newTokenAmount, invested }
//       );
//     } else {
//       const newToken = new Token({
//         id,
//         mint,
//         name,
//         symbol,
//         amount: tokenAmountToAdd,
//         invested,
//         sold: 0,
//       });
//       await newToken.save();
//     }
//   } catch (error) {
//     console.error("Token update/save error", error);
//     return { success: false, msg: `Token update error: ${error}` };
//   }

//   const newTrade = new Trade({
//     id,
//     mint,
//     name,
//     symbol,
//     priceSol: amount,
//     priceUsd: amount * solPrice,
//     amount: tokenAmountToAdd,
//     tradeType: "BUY",
//   });

//   try {
//     await newTrade.save();
//   } catch (error) {
//     console.error("Trade save error", error);
//     return { success: false, msg: `Saving trade error: ${error}` };
//   }

//   await User.updateOne({ id }, { solBalance: newSolBalance });

//   return { success: true };
// };



export const buy = async (mint: string, amount: number, id: string) => {
  const tokenData = await getTokenDetails(mint);
if (!tokenData) return { success: false, msg: "No token detail" };

const liquidityPools: any[] = Object.values(tokenData.liquidityPools);
if (liquidityPools.length === 0) return { success: false, msg: "No liquidity pools" };

let tokenPriceSOL: number;
const solPrice: number = await getSolPrice();
let tokenPrice: number;

// Try to fetch price0 safely
let price0 = Number(liquidityPools[0]?.protocolData?.price0);

// If price0 is invalid (NaN or 0), try price1 from next pool
if (isNaN(price0) || price0 === 0) {
  if (liquidityPools[1]) {
    price0 = Number(liquidityPools[1]?.protocolData?.price0);
  }
}

if (isNaN(price0) || price0 === 0) {
  return { success: false, msg: "Invalid token price" };
}

tokenPriceSOL = price0;
tokenPrice = tokenPriceSOL * solPrice;

  console.log("tokenPriceSOL", tokenPriceSOL)
  console.log("solPrice", solPrice)
  console.log("tokenPrice", tokenPrice)

  const { name, symbol }: { name: string; symbol: string } = tokenData;

  let newSolBalance: number = 0;
  const user: UserData | null = await User.findOne({ id: id });
  if (user) {
    const solBalance: number = user.solBalance;
    newSolBalance = solBalance - amount;
    if (newSolBalance < 0)
      return { success: false, msg: "Insufficient Sol balance" };
  } else {
    return { success: false, msg: "No user" };
  }

  let invested = amount * solPrice;

  const token = await Token.findOne({ id: id, mint });
  if (token) {
    const tokenAmount = token.amount;
    if (tokenPriceSOL>liquidityPools[0].protocolData.price1 || Number.isNaN(tokenPriceSOL)) {
      let tokenPriceUSD: number | null = await priceFetchUSD(mint);
      // console.log("Token Price USD:", tokenPriceUSD);
    
      if (tokenPriceUSD !== null && solPrice !== 0) {
        tokenPriceSOL = tokenPriceUSD / solPrice;
      } else {
        console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
        return { success: false, msg: "Error fetching token price" };
      }
    }

    console.log("Num", amount);
    console.log("TPSOL",tokenPriceSOL);
    const newTokenAmount =
      Number(tokenAmount) + Number(amount) / Number(tokenPriceSOL) ;
    invested += token.invested;
    try {
      await Token.updateOne(
        { id: id, mint },
        { amount: newTokenAmount, invested }
      );
    } catch (error) {
      console.log(error);
      return { success: false, msg: `Token update error ${error}` };
    }
  } else {
    console.log(invested, "invested")
    console.log(tokenPriceSOL, "tokenPriceSOL")
    console.log(Number.isNaN(tokenPriceSOL))
   
    

  // if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
    let tokenPriceUSD: number | null = await priceFetchUSD(mint);
    // console.log("Token Price USD:", tokenPriceUSD);
  
    if (tokenPriceUSD !== null && solPrice !== 0) {
      tokenPriceSOL = tokenPriceUSD / solPrice;
    } else {
      console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
      return { success: false, msg: "Error fetching token price" };
    }

    console.log("solPrice USD", solPrice)
    console.log("TokenUSD Price before creating token", tokenPriceUSD)
  // }
    console.log("TokenSOL Price before creating token", tokenPriceSOL)
    const newToken = new Token({
      id: id,
      mint,
      name,
      symbol,
      amount: Number(amount) / Number(tokenPriceSOL),
      invested,
      sold: 0
    });
    try {
      await newToken.save();
    } catch (error) {
      console.log(error);
      return { success: false, msg: `Saving token error: ${amount} ${error}` };
    }
  }





  if (tokenPriceSOL>liquidityPools[0].protocolData.price1) {
    let tokenPriceUSD: number | null = await priceFetchUSD(mint);
    // console.log("Token Price USD:", tokenPriceUSD);
  
    if (tokenPriceUSD !== null && solPrice !== 0) {
      tokenPriceSOL = tokenPriceUSD / solPrice;
    } else {
      console.error(`Invalid token price, cannot compute tokenPriceSOL. ${tokenPriceUSD} ${solPrice}`);
      return { success: false, msg: "Error fetching token price" };
    }
  }
  
  const newTrade = new Trade({
    id: id,
    mint,
    name,
    symbol,
    priceSol: amount,
    priceUsd: amount * solPrice,
    amount: Number(amount) / Number(tokenPriceSOL),
    tradeType: "BUY"    
  });
  try {
    await newTrade.save();
  } catch (error) {
    console.log(error);
    return { success: false, msg: `Saving trade error: ${error}` };
  }







  
  await User.updateOne({ id: id }, { solBalance: newSolBalance });
  return { success: true };
};