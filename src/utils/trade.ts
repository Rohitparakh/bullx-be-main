import { getSolPrice, getTokenDetails } from "./pump";
import User, { UserData } from "../model/user";
import Token from "../model/token";
import Trade from "../model/trade";


export const sell = async (
  mint: string,
  amount: number,
  id: string
) => {
  const tokenData = await getTokenDetails(mint);
  if (!tokenData) return { success: false, msg: "No token detail" };

  const liquidityPools: any[] = Object.values(tokenData.liquidityPools);

  let tokenPriceSOL: number = liquidityPools[0].protocolData.price0;
  // tokenPriceSOL = !tokenPriceSOL ? liquidityPools[1].protocolData.price1 : tokenPriceSOL;
  const solPrice = await getSolPrice();
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
  const tokenPrice = tokenPriceSOL * solPrice;

  const { name, symbol }: { name: string; symbol: string } = tokenData;

  let newSolBalance: number = 0;
  const user: UserData | null = await User.findOne({ id: id });
  if (user) {
    const solBalance: number = user.solBalance;
    newSolBalance = solBalance + tokenPriceSOL * amount;
    if (newSolBalance < 0)
      return { success: false, msg: "Insufficient Sol balance" };
  } else {
    return { success: false, msg: "No user" };
  }

  const token = await Token.findOne({ id: id, mint });
  if (token) {
    const tokenAmount = token.amount;
    const newTokenAmount = Number(tokenAmount) - Number(amount);
    const sold = token.sold + amount * tokenPrice;
    if (newTokenAmount < 0)
      return { success: false, msg: "Insufficient token" };
    try {
      await Token.updateOne(
        { id: id, mint },
        { amount: newTokenAmount, sold }
      );
    } catch (error) {
      console.log(error);
      return { success: false, msg: "Token update error" };
    }
  } else {
    return { success: false, msg: "No token to sell" };
  }



  const newTrade = new Trade({
    id: id,
    mint,
    name,
    symbol,
    priceSol: Number(amount) * Number(tokenPriceSOL),
    priceUsd: Number(amount) * Number(tokenPriceSOL) * solPrice,
    amount: amount,
    tradeType: "SELL"    
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


export const buy = async (mint: string, amount: number, id: string) => {
  const tokenData = await getTokenDetails(mint);
  if (!tokenData) return { success: false, msg: "No token detail" };

  const liquidityPools: any[] = Object.values(tokenData.liquidityPools);
  // console.log("Token Data:", liquidityPools[0].protocolData);

  let tokenPriceSOL: number;
  let solPrice: number = await getSolPrice(), tokenPrice:number;
  // if(liquidityPools[0].protocolData.price0 > liquidityPools[0].protocolData.price1){
    // tokenPriceSOL = liquidityPools[0].protocolData.price0 / 1000000000;
    // tokenPrice = tokenPriceSOL;
  // } else{
    tokenPriceSOL = liquidityPools[0].protocolData.price0;    
    tokenPrice = tokenPriceSOL * solPrice;
  // }
  // tokenPriceSOL = !tokenPriceSOL ? liquidityPools[1].protocolData.price1 : tokenPriceSOL;
  
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