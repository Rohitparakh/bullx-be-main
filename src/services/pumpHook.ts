import { PUMP_FUN_PROGRAM } from "../config/constants";
import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINT } from "../config";

let globalLogListener: number | null = null;

export const runListener = () => {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  try {
    globalLogListener = connection.onLogs(
      PUMP_FUN_PROGRAM,
      async ({ logs, err, signature }) => {
        console.log(logs);
        const isTrade = logs.filter(
          (log) => log.includes("Buy") || log.includes("Sell")
        );
        console.log("isTrade :>> ", isTrade);
        console.log(signature);
      },
      "finalized"
    );
  } catch (err) {
    console.log(err);
  }
};
