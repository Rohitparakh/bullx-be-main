import mongoose, { Model, model, Schema } from "mongoose";
import { ITokenMC } from "../../utils/types";

export interface IPumpToken {
  mint?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  created_at?: Date;
  uri?: string;
  bonding_curve_key?: string;
  updated_at?: Date;
  mc_data?: ITokenMC;
}

interface IPumpTokenModel extends Model<IPumpToken> {}

const PumpTokenSchema: Schema<IPumpToken> = new mongoose.Schema({
  mint: { type: String, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  decimals: { type: Number, required: true },
  uri: { type: String, required: true },
  // mc_data: {
  //   type: {
  //     pumpCurvePrice: { type: Number, required: true },
  //     marketCap: { type: Number, required: true },
  //     liquidity: { type: Number, required: true },
  //     bondingProgress: { type: Number, required: true },
  //   },
  //   required: true,
  // },
  bonding_curve_key: { type: String, required: true },
  updated_at: { type: Date, required: true, default: Date.now },
  created_at: { type: Date, required: true },
});

const PumpToken: IPumpTokenModel = model<IPumpToken, IPumpTokenModel>(
  "PumpToken",
  PumpTokenSchema
);

export default PumpToken;
