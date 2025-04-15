import mongoose, { Model, model, Schema } from "mongoose";

export interface UserData {
  id:string;
  username: string;
  avatar: string;
  email: string;
  solBalance: number;
}

interface UserDataModel extends Model<UserData> {}

const UserDataSchema: Schema<UserData> = new mongoose.Schema({
 
  id: { type: String, required: true },
  username: { type: String },
  avatar: { type: String },
  email: { type: String },
  solBalance: { type: Number, required: true, default: 50 },
});

const User: UserDataModel = model<UserData, UserDataModel>(
  "User",
  UserDataSchema
);

export default User;
