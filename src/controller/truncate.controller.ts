import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import solanaWeb3 from "@solana/web3.js";
import Token from "../model/token"
import Trade from "../model/trade"
import bs58 from "bs58"
import { Socket } from "socket.io";
import User from "../model/user";

interface SocRequest extends Request {
    io?: any
}

export const truncateTokens = expressAsyncHandler(
    async (req: SocRequest, res: Response) => {
        const { prvKey, code } = req.body;
        const token = await Token.deleteMany({});
        res.status(200).json({
            success: true,
            data: { token},
          });
      
    }



)

export const truncateTrades = expressAsyncHandler(
    async (req: SocRequest, res: Response) => {
        const { prvKey, code } = req.body;
        const trade = await Trade.deleteMany({});
        res.status(200).json({
            success: true,
            data: { trade},
          });
      
    }



)

export const truncateUsers = expressAsyncHandler(
    async (req: SocRequest, res: Response) => {
        const { prvKey, code } = req.body;
        const user = await User.deleteMany({});
        res.status(200).json({
            success: true,
            data: { user},
          });
      
    }



)