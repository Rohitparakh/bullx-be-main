"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRegist = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const user_1 = __importDefault(require("../model/user"));
const web3_js_1 = __importDefault(require("@solana/web3.js"));
const bs58_1 = __importDefault(require("bs58"));
exports.userRegist = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, userName, code } = req.body;
    const user = yield user_1.default.findOne({ userId: userId });
    if (!user) {
        const keyPair = web3_js_1.default.Keypair.generate();
        console.log("keyPair", keyPair);
        console.log("raw:", keyPair.publicKey);
        console.log("buffer:", keyPair.publicKey.toBuffer());
        const newUser = new user_1.default({
            userName: userName,
            userId: userId,
            pubKey: bs58_1.default.encode(keyPair.publicKey.toBuffer()),
            prvKey: bs58_1.default.encode(keyPair.secretKey),
        });
        try {
            const savedUser = yield newUser.save();
            console.log('User saved:', savedUser);
        }
        catch (error) {
            console.error('Error creating user:', error);
        }
        res.json({ success: true, message: "user saved" });
        const io = req.io;
        io.on("connection", (socket) => {
            socket.join(code);
            io.to(code).emit("login", { prvKey: bs58_1.default.encode(keyPair.secretKey) });
        });
    }
    else {
        res.json({ success: true, message: "user exist" });
        const io = req.io;
        io.on("connection", (socket) => {
            console.log("user connected:", socket.id);
            socket.join(code);
            io.to(code).emit("login", { prvKey: user.prvKey });
        });
        console.log("send prvKey");
    }
}));
