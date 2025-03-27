"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BEAREAR_TOKEN = exports.TOKEN_LIMIT = exports.PUMPPORTAL_WS_ENDPOINT = exports.endpoint = exports.BITQUERY_CLIENT_SECRET = exports.BITQUERY_CLIENT_ID = exports.BITQUERY_AUTH_URL = exports.BITQUERY_WS_URL = exports.TOKEN_DATA_URL = exports.TRANSCATION_URL = exports.LATEST_COIN_URL = exports.LATEST_TRADE_URL = exports.SOL_PRICE_URL = exports.OHLC_BASE_URL = exports.METADATA_URL = exports.RPC_ENDPOINT = exports.SIGN_MESSAGE = exports.TOKEN_EXPIRE_TIME = exports.JWT_SECRET = exports.PORT = exports.MONGO_URI = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.MONGO_URI = process.env.MONGO_URI || "";
exports.PORT = process.env.PORT || 5000;
exports.JWT_SECRET = process.env.JWT_SECRET || "JWT_SECRET";
exports.TOKEN_EXPIRE_TIME = process.env.TOKEN_EXPIRE_TIME || "1d";
exports.SIGN_MESSAGE = process.env.SIGN_MESSAGE || "Sign this message to authenticate your wallet";
exports.RPC_ENDPOINT = process.env.HELIUS_RPC || "https://api.mainnet-beta.solana.com";
exports.METADATA_URL = process.env.METADATA_URL || "";
// # OHLC GET
exports.OHLC_BASE_URL = process.env.OHLC_BASE_URL || "";
// # SOL PRICE GET
exports.SOL_PRICE_URL = process.env.SOL_PRICE_URL || "";
// # latest trade on pump.fun GET
exports.LATEST_TRADE_URL = process.env.LATEST_TRADE_URL || "";
// # latest coin GET
exports.LATEST_COIN_URL = process.env.LATEST_COIN_URL || "";
// # transaction history GET
exports.TRANSCATION_URL = process.env.TRANSCATION_URL || "";
// # token data(market cap, bondig)
exports.TOKEN_DATA_URL = process.env.TOKEN_DATA_URL || "";
exports.BITQUERY_WS_URL = "wss://streaming.bitquery.io/graphql";
exports.BITQUERY_AUTH_URL = "https://oauth2.bitquery.io/oauth2/token"; // Updated URL
exports.BITQUERY_CLIENT_ID = process.env.BITQUERY_CLIENT_ID;
exports.BITQUERY_CLIENT_SECRET = process.env.BITQUERY_CLIENT_SECRET;
exports.endpoint = "https://streaming.bitquery.io/eap";
exports.PUMPPORTAL_WS_ENDPOINT = process.env.PUMPPORTAL_WS_ENDPOINT;
exports.TOKEN_LIMIT = 30;
// export const BEAREAR_TOKEN =
//   "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZjYzNmY2I2NDAzMjc2MGVlYjljMjZmNzdkNDA3YTY5NGM1MmIwZTMiLCJ0eXAiOiJKV1QifQ.eyJsb2dpblZhbGlkVGlsbCI6IjIwMjUtMDEtMDFUMjA6MTk6MjMuMDExWiIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9ic2ctdjIiLCJhdWQiOiJic2ctdjIiLCJhdXRoX3RpbWUiOjE3Mjc5ODY3NjUsInVzZXJfaWQiOiIweDMzMDQ2ZTA3ZTNlZjZlODhiMmFiNjRhN2E3ZjVkZDQ3OGI5MTQ1NjkiLCJzdWIiOiIweDMzMDQ2ZTA3ZTNlZjZlODhiMmFiNjRhN2E3ZjVkZDQ3OGI5MTQ1NjkiLCJpYXQiOjE3Mjc5OTA0NTAsImV4cCI6MTcyNzk5NDA1MCwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6e30sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.U_XYfJ6xP6R2MYPLSqdZ4x9xYHBDwqnF3MMkimPE3FH4Jefhh9YDKcFnLh0i73kHCp6K_dM6xKtRuR9huGb04KLDIFtYZn2_4WYu2FjKZOWwQz4VqAtnU4bMPziByDHOvXAucjnWNfnbSo4nR1UO1mFlpm4NzLJkduItyhQ539iyicS2wCGuG2ro5g24UZXd4Fe9T6GCb6XQRx5NKXF0eADMBiGBlyKm3G-PrfMmgUYtwktrSAqWLI5TR94rZE-Wr6U8SK-7j0B2Pq3o30THciXjesu1Exkgsz9QGjx4ZsdPDK8yih-vt2D7-W0b95hGxDoF7mZRmfuMoM-202U2gA";
exports.BEAREAR_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjhkNzU2OWQyODJkNWM1Mzk5MmNiYWZjZWI2NjBlYmQ0Y2E1OTMxM2EiLCJ0eXAiOiJKV1QifQ.eyJsb2dpblZhbGlkVGlsbCI6IjIwMjUtMDEtMDFUMjA6MTk6MjMuMDExWiIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9ic2ctdjIiLCJhdWQiOiJic2ctdjIiLCJhdXRoX3RpbWUiOjE3Mjc5ODY3NjUsInVzZXJfaWQiOiIweDMzMDQ2ZTA3ZTNlZjZlODhiMmFiNjRhN2E3ZjVkZDQ3OGI5MTQ1NjkiLCJzdWIiOiIweDMzMDQ2ZTA3ZTNlZjZlODhiMmFiNjRhN2E3ZjVkZDQ3OGI5MTQ1NjkiLCJpYXQiOjE3MjgwMzM5NDEsImV4cCI6MTcyODAzNzU0MSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6e30sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.HmJqjlx_aJVwn2sSKRRfqvoxDEN8E6jhHMWPqg6yh8hg6KPGA6-A3rWLeTRVFuBSPvlwQLbnv96YWQOU6JXP2nt5mrkWa_OmkjSixoN31JDa9DjsAopQdh4ySh3_EZeAbPdEI9IkJAC8uDaSXxLfPckQlyoBlh12AWZ_-qjDjI4HKH2cBfkz-P3q7wLX4mtOOPzv0rHFwDY8rGvKvMlDlS5NysQvsHsvrb3E51iuO6x2K2K9bKN0X8NSgIZaHCKV4KcBycSxLihm0k24wFHgCSJEpi9QaQx4mV8mFeqTVhbRspKyTSVp-8Dzd__Lj4-4Wm4pXWAyy9w_u1K3vmv7pQ";
