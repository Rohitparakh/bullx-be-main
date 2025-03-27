import mongoose, { Model, model, Schema } from "mongoose";

export interface TokenData {
  prvKey: string;
  mint: string;
  name: string;
  symbol: string;
  amount: number;
  invested: number;
  sold: number;
}

interface TokenDataModel extends Model<TokenData> {}

const TokenDataSchema: Schema<TokenData> = new mongoose.Schema({
  prvKey: { type: String, required: true },
  mint: { type: String, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  amount: { type: Number, required: true },
  invested: { type: Number, require: true, default: 0 },
  sold: { type: Number, required: true, default: 0 },
});

const Token: TokenDataModel = model<TokenData, TokenDataModel>(
  "Token",
  TokenDataSchema
);

export default Token;
