import { PublicKey } from "@solana/web3.js";
import { IFilters, IRange } from "./types";

export const jwtTokenCache = {
  authToken: "",
  jwtToken: "",
  updatedAt: 0,
  updateTimer: 24e4,
};
const networkId = 1399811149;
const API_URL = "https://graph.codex.io/graphql";

const TRADE_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);
const BONDING_ADDR_SEED = new Uint8Array([
  98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101,
]);

export const getPairAddress = (mintAddress: string) => {
  const tokenMint = new PublicKey(mintAddress);
  // get the address of bonding curve and associated bonding curve
  const [bonding] = PublicKey.findProgramAddressSync(
    [BONDING_ADDR_SEED, tokenMint.toBuffer()],
    TRADE_PROGRAM_ID
  );
  return bonding;
};

export const getAuthToken = async () => {
  const resp = await fetch(
    "https://securetoken.googleapis.com/v1/token?key=AIzaSyCdU8BxOul-NOOJ-e-eCf_-5QCz8ULqIPg",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-client-data":
          "CLK1yQEIlbbJAQiktskBCKmdygEIr4/LAQiTocsBCJv+zAEIhaDNAQjbws4BCMrEzgEIk8bOARj1yc0B",
        "x-client-version": "Chrome/JsCore/10.12.2/FirebaseCore-web",
        "x-firebase-gmpid": "1:82013512367:web:8b085e7c341587f3d56a5a",
        Referer: "https://bullx.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: "grant_type=refresh_token&refresh_token=AMf-vBwzm0pxdBPSV-C3LLUaurFtBHyYrSL9uZQh6tq_8z7N071OfL2dXLnYdlZ4sHcGo7mPY2-QFNXZublp4c9N8BomisVZFUEkJz-dnp8f14669FLO8JyFN-RM5GovK8YTLCQkvR90x1cJvY8sfvgOuCVsuKc9SbsaoLRc9CLSLkGC20CencD6t4pRUcGzUg6-aYg6fgtlT60oO034z4UEcPufJ0lOWcuBaRikR7n8F5k-b7XDuCw",
      method: "POST",
    }
  );

  const data = await resp.json();
  return data;
};

const getJwtToken = async () => {
  if (
    jwtTokenCache.jwtToken &&
    Date.now() - jwtTokenCache.updatedAt < jwtTokenCache.updateTimer
  ) {
    return jwtTokenCache.jwtToken;
  }
  const fetchedAuthToken = await getAuthToken();
  jwtTokenCache.authToken = fetchedAuthToken.access_token;
  jwtTokenCache.updatedAt = Date.now();
  console.log("🚀 ~ fetched ~ access_token for bullx");
  return jwtTokenCache.jwtToken;
};

const jwtTokenGeneration = async () => {
  try {
    await getJwtToken();
    setInterval(async () => {
      await getJwtToken();
    }, jwtTokenCache.updateTimer);
  } catch (error) {
    console.log("error :>> ", error);
  }
};

jwtTokenGeneration();

// BullX API
export const generateBullXHeaders = async () => {
  if (!jwtTokenCache.authToken) {
    await getJwtToken();
  }

  return {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    authorization: `Bearer ${jwtTokenCache.authToken}`,
    "content-type": "text/plain",
    priority: "u=1, i",
    "sec-ch-ua":
      '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    Referer: "https://bullx.io/",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
};

export const generateBullXBody = (apiType: string, mintAddress?: string) => {
  let body: string = "";
  switch (apiType) {
    case "tokeninfo":
      body = `{\"name\":\"resolveTokens\",\"data\":{\"addresses\":[\"${mintAddress}\"],\"chainId\":${networkId}}}`;
      break;

    case "holders":
      body = `{\"name\":\"holdersSummary\",\"data\":{\"tokenAddress\":\"${mintAddress}\",\"sortBy\":\"balance\",\"chainId\":${networkId}}}`;
      break;

    case "trade":
      body = `{\"name\":\"tradeHistory\",\"data\":{\"baseTokenAddress\":\"${mintAddress}\",\"quoteTokenAddress\":\"So11111111111111111111111111111111111111112\",\"fetchTokensMetadata\":false,\"chainId\":${networkId}}}`;
      break;

    case "ohlc":
      const to = Math.floor(new Date().getTime() / 1000);
      const from = to - 500;
      body = `{"name":"chart","data":{"chainId":${networkId},"base":"${mintAddress}","quote":"So11111111111111111111111111111111111111112","from":${from},"to":${to},"intervalSecs":1,"countBack":329}}`;
      break;

    default:
      break;
  }  
  return body;
};
export const generatePumpVisionBullXBody = (graduateStatus: Number) => {
  let timestamp = Math.floor(new Date().getTime() / 1000);
  let bodyString = `
      {
        "name": "getNewPairs",
        "data": {
          "poolCreationBlockTimestamp": ${timestamp},
          "filters": {
            "Top 10 Holders": false,
            "With at least 1 social": false,
            "B.Curve %": { "percentage": true },
            "Dev holding %": { "percentage": true },
            "Holders": {},
            "Liquidity": { "dollar": true },
            "Volume": { "dollar": true },
            "Market Cap": { "dollar": true },
            "Txns": {},
            "Buys": {},
            "Sells": {},
            "Token Age (mins)": {},
            "pumpFunEnabled": true,
            "moonshotTokenEnabled": true
          }
        }
      }
  `;
  let jsonBody:any = JSON.parse(bodyString);
  jsonBody.data["chainIds"] = [1399811149, 56, 42161, 81457, 8453];
  if(graduateStatus == 2 ){
    jsonBody.data.filters["isAboutToGraduate"] = true;
  }else if (graduateStatus == 1){
    jsonBody.data.filters["isGraduated"] = true;
  }
  bodyString = JSON.stringify(jsonBody);
  return bodyString;

}
export const generateFilterBullXBody = ({
  mintAuthDisabled = false,
  freezeAuthDisabled = false,
  lpBurned = false,
  topTenHolders = false,
  social = false,
  volume = null,
  liquidity = null,
  marketcap = null,
  txns = null,
  buys = null,
  sells = null,
  poolCreationBlockTimestamp
}: IFilters) => {
  if(poolCreationBlockTimestamp==null) poolCreationBlockTimestamp = Math.floor(new Date().getTime() / 1000);
  let bodyString = `{"name":"getNewPairs",
                    "data":{"chainIds":[${networkId}],
                    "poolCreationBlockTimestamp":${poolCreationBlockTimestamp},
                    "filters":{
                      "Mint Auth Disabled":${mintAuthDisabled},
                      "Freeze Auth Disabled":${freezeAuthDisabled},
                      "LP Burned":${lpBurned},
                      "Top 10 Holders":${topTenHolders},
                      "With at least 1 social":${social},
                      "Liquidity":{"dollar":true, "min":${liquidity?.min?liquidity.min:0}, "max":${liquidity?.max?liquidity.max:1000000000}},
                      "Volume":{"dollar":true, "min":${volume?.min?volume.min:80},"max":${volume?.max?volume.max:10000000000}},
                      "Market Cap":{"dollar":true, "min":${marketcap?.min?marketcap.min:0}, "max":${marketcap?.max?marketcap.max:10000000000}},
                      "Txns":{},
                      "Buys":{},
                      "Sells":{}
                      }
                    }
                  }`;

  let jsonBody: any = JSON.parse(bodyString);
  if (volume && volume.min && volume.max) {
    jsonBody.data.filters["Volume"].min = volume.min;
    jsonBody.data.filters["Volume"].max = volume.max;
  }
  if (liquidity && liquidity.min && liquidity.max) {
    jsonBody.data.filters["Liquidity"].min = liquidity.min;
    jsonBody.data.filters["Liquidity"].max = liquidity.max;
  }
  if (marketcap && marketcap.min && marketcap.max) {
    jsonBody.data.filters["Market Cap"].min = marketcap.min;
    jsonBody.data.filters["Market Cap"].max = marketcap.max;
  }
  if (txns && txns.min && txns.max) {
    jsonBody.data.filters["Txns"].min = txns.min;
    jsonBody.data.filters["Txns"].max = txns.max;
  }
  if (buys && buys.min && buys.max) {
    jsonBody.data.filters["Buys"].min = buys.min;
    jsonBody.data.filters["Buys"].max = buys.max;
  }
  if (sells && sells.min && sells.max) {
    jsonBody.data.filters["Sells"].min = sells.min;
    jsonBody.data.filters["Sells"].max = sells.max;
  }

  bodyString = JSON.stringify(jsonBody);
  return bodyString;
};

export const bullxGraphql = async (
  apiType: string,
  mintAddress?: string,
  filters?: IFilters,
  graduateStatus?: Number
) => {
  const headers = await generateBullXHeaders();
  let body = "";
  if (apiType === "tokens" && filters) {
    body = generateFilterBullXBody(filters);
  }
  else if(graduateStatus){
    body = generatePumpVisionBullXBody(graduateStatus);
  }
  else {
    body = generateBullXBody(apiType, mintAddress);
  }
  const endpoint =
    apiType === "ohlc"
      ? "https://api-edge.bullx.io/chart"
      : "https://api-edge.bullx.io/api";
  const resp = await fetch(endpoint, {
    headers,
    body,
    method: "POST",
  });
  // console.log("endpoint:", endpoint);
  // console.log("status:", graduateStatus);
  // console.log("header:",headers);
  // console.log("body:", body);
  const jsonData = await resp.json();
  // console.log("response:", jsonData);
  return jsonData;
};

export const generateTrendingSolanaBody = (timeframe: number) => {
  let timestamp = Math.floor(new Date().getTime() / 1000) - timeframe;
  
  let bodyString = `{
    "name": "getNewPairs",
    "data": {
      "chainIds": [1399811149],  // Only Solana
      "poolCreationBlockTimestamp": ${timestamp},
      "filters": {
        "Liquidity": { "dollar": true },
        "Volume": { "dollar": true },
        "Txns": {},
        "Buys": {},
        "Sells": {},
        "pumpFunEnabled": true,
        "moonshotTokenEnabled": true
      }
    }
  }`;

  return JSON.stringify(JSON.parse(bodyString));
};
