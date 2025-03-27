import WebSocket from "ws";
import { PUMPPORTAL_WS_ENDPOINT } from "../config";
import NewPumpToken from "../model/pump/newPumpTokens";
import PumpToken, { IPumpToken } from "../model/pump/pumptoken";
// import { pumpCurveData } from "../controller/pumpController";
import {
  getPumpCurveData,
  getPumpCurveDataByBondingCurveKey,
  saveNewPumpToken,
} from "../utils/pump";
import { ITokenMC } from "../utils/types";

export function subscribeToCreateToken() {
  const ws = new WebSocket(PUMPPORTAL_WS_ENDPOINT as string);
  ws.on("open", () => {
    console.log("Connected to Pumpportal WebSocket");
    ws.send(JSON.stringify({ method: "subscribeNewToken" }));
  });

  ws.on("message", async (data: any) => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.txType === "create") {
        const {
          mint,
          name,
          symbol,
          initialBuy,
          bondingCurveKey,
          vTokensInBondingCurve,
          vSolInBondingCurve,
          uri,
        } = parsedData;
        const coinData: IPumpToken = {
          mint,
          name,
          symbol,
          uri: uri,
          decimals: 6,
          bonding_curve_key: bondingCurveKey,
          created_at: new Date(),
        };
        setTimeout(() => {
          saveNewPumpToken(coinData);
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing message from Pumpportal:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("Disconnected from Pumpportal WebSocket");
  });
}
