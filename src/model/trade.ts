import mongoose, { Model, model, Schema, Types } from "mongoose";

export interface TradeData {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  amount: number; // Amount of tokens traded
  priceSol: number; // Price per token in SOL
  priceUsd: number; // Price per token in USD
  tradeType: "BUY" | "SELL"; // Trade type (Buy/Sell)
  tradeDate: Date; // Timestamp of trade
}


interface TradeModel extends Model<TradeData> {}

const TradeSchema: Schema = new Schema({
  id: { type: String, required: true },
  mint: { type: String, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  priceSol: { type: Number, required: true },
  priceUsd: { type: Number, required: true },
  tradeType: { type: String, enum: ["BUY", "SELL"], required: true },
  tradeDate: { type: Date, default: Date.now },
});

const Trade: TradeModel = model<TradeData, TradeModel>("Trade", TradeSchema);

export default Trade;
