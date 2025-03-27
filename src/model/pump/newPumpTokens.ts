import mongoose, { Model, model, Schema } from "mongoose";

interface InewPumpToken {
    mint: string,
    name: string,
    symbol: string,
    decimals: number
    created_at: Date,
    uri: string,
    bonding_curve_key: string
}

interface InewPumpTokenModel extends Model<InewPumpToken> { }

const NewPumpTokenSchema: Schema<InewPumpToken> = new mongoose.Schema({
    mint: { type: String, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    uri: { type: String, required: true },
    bonding_curve_key: { type: String, required: true },
    created_at: { type: Date, required: true, default: Date.now },
})

const NewPumpToken: InewPumpTokenModel = model<InewPumpToken, InewPumpTokenModel>("NewPumpToken", NewPumpTokenSchema);

export default NewPumpToken