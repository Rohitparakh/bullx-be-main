import mongoose, { Model, model, Schema } from "mongoose";

export interface UserData {
  pubKey: string;
  prvKey: string;
  solBalance: number;
}

interface UserDataModel extends Model<UserData> {}

const UserDataSchema: Schema<UserData> = new mongoose.Schema({
  pubKey: { type: String, required: true },
  prvKey: { type: String, required: true },
  solBalance: { type: Number, required: true, default: 50 },
});

const User: UserDataModel = model<UserData, UserDataModel>(
  "User",
  UserDataSchema
);

export default User;
